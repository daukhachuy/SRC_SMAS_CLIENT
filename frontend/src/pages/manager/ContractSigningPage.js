import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRoleSectionBasePath } from '../../hooks/useRoleSectionBasePath';
import { contractAPI, createBookEventContract, eventBookingAPI } from '../../api/managerApi';
import { 
  ArrowLeft, FileText, ShieldCheck, Building2, User,
  CheckCircle, Download, Edit3
} from 'lucide-react';
import '../../styles/ContractSigningPage.css';

const DEFAULT_CREATE_TERMS = [
  'Bên B thanh toán đặt cọc theo tỷ lệ đã thỏa thuận trong vòng 24 giờ kể từ khi nhận hợp đồng.',
  'Mọi thay đổi về số lượng khách phải được thông báo trước tối thiểu 48 giờ.',
  'Hai bên phối hợp xác nhận lại danh mục món ăn/dịch vụ trước ngày tổ chức 03 ngày.',
  'Chi phí phát sinh ngoài phạm vi hợp đồng sẽ được xác nhận bằng phụ lục hoặc biên bản bổ sung.',
].join('\n');

const createInitialContractData = () => ({
  contractNumericId: null,
  contractId: '--',
  status: 'draft',
  statusText: 'Nháp',
  bookingCode: '',
  partyA: {
    name: 'Nhà hàng Gourmet Luxury',
    address: 'Chưa cập nhật',
    representative: 'Chưa cập nhật',
    position: 'Quản lý',
    signed: false,
    signedDate: '--/--/----',
  },
  partyB: {
    name: 'Chưa cập nhật',
    phone: '---',
    email: '---',
    signed: false,
    signedDate: null,
  },
  event: {
    name: 'Chưa cập nhật',
    date: '--/--/----',
    time: '--:--',
    tables: 0,
    guestsPerTable: 10,
  },
  menu: [],
  payment: {
    total: 0,
    depositPercent: 30,
    deposit: 0,
  },
  cancellation: [],
});

const ContractSigningPage = () => {
  const { base, homePath } = useRoleSectionBasePath();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const isCreateMode = ['1', 'true', 'yes'].includes(String(searchParams.get('create') || '').toLowerCase());
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPendingCreate, setIsPendingCreate] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [createForm, setCreateForm] = useState({
    depositPercent: 30,
    termsAndConditions: DEFAULT_CREATE_TERMS,
    note: '',
  });
  const [sendingToCustomer, setSendingToCustomer] = useState(false);
  const [sendingDepositRequest, setSendingDepositRequest] = useState(false);

  const [contractData, setContractData] = useState(createInitialContractData);

  /** Chỉ gửi yêu cầu cọc khi đã gửi khách ký (sent/signed) và Bên B đã ký xong; ẩn khi đã cọc / hủy. */
  const canShowDepositRequestButton = (() => {
    const st = String(contractData.status || '').toLowerCase();
    if (!contractData.partyB.signed) return false;
    if (['deposited', 'deposit', 'completed', 'cancelled', 'canceled'].includes(st)) {
      return false;
    }
    return ['sent', 'signed'].includes(st);
  })();

  const statusLabel = {
    pending: 'Chờ duyệt / Chờ xử lý',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    confirmed: 'Đã xác nhận',
    active: 'Đang diễn ra',
    completed: 'Đã hoàn thành',
    draft: 'Nháp',
    sent: 'Đã gửi ký / Chờ khách ký',
    signed: 'Đã ký',
    deposited: 'Đã đặt cọc',
    cancelled: 'Đã hủy',
    canceled: 'Đã hủy',
  };

  const toNum = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const toDateTime = (dateStr, timeStr) => {
    if (!dateStr) return { date: '--/--/----', time: '--:--' };
    const raw = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr)) ? `${dateStr}T${timeStr || '00:00:00'}` : dateStr;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return { date: '--/--/----', time: '--:--' };
    return {
      date: d.toLocaleDateString('vi-VN'),
      time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const resolveBookingCode = (detail, fallback = '') => {
    const direct =
      detail?.bookingCode ||
      detail?.bookEventCode ||
      detail?.eventCode ||
      detail?.code ||
      detail?.eventInfo?.bookingCode ||
      detail?.eventInfo?.bookEventCode ||
      detail?.eventInfo?.eventCode ||
      detail?.eventInfo?.code ||
      '';
    return String(direct || fallback || '').trim();
  };

  useEffect(() => {
    const loadContract = async () => {
      setLoading(true);
      setLoadError('');
      try {
        let bookingCode = String(searchParams.get('bookingCode') || '').trim();
        let detail = null;

        if (eventId) {
          const detailRes = await eventBookingAPI.getDetailById(eventId);
          const detailPayload = detailRes?.data?.data?.data ?? detailRes?.data?.data ?? detailRes?.data;
          detail = Array.isArray(detailPayload) ? detailPayload[0] : detailPayload;
          bookingCode = resolveBookingCode(detail, bookingCode);
        }

        if (!bookingCode) {
          throw new Error('Không tìm thấy bookingCode để tải hợp đồng.');
        }

        let contract = null;
        try {
          const contractRes = await contractAPI.getByBookingCode(bookingCode);
          const payload = contractRes?.data?.data ?? contractRes?.data;
          contract = Array.isArray(payload) ? payload[0] : payload;
        } catch (contractErr) {
          const status = contractErr?.response?.status;
          if (!(isCreateMode && status === 404)) {
            throw contractErr;
          }
        }
        const customer = detail?.customer || {};
        const eventInfo = detail?.eventInfo || {};
        const confirmedBy = detail?.confirmedBy || {};
        const detailPayment = detail?.payment || {};

        const rawStatus = String(contract?.status || detail?.status || 'draft').toLowerCase();
        const total = toNum(detailPayment?.totalAmount ?? contract?.totalAmount ?? contract?.amount, 0);
        const deposit = toNum(detailPayment?.depositAmount ?? contract?.depositAmount, 0);
        const depositPercent = total > 0 && deposit > 0 ? Math.round((deposit / total) * 100) : 30;
        const dt = toDateTime(eventInfo?.reservationDate, eventInfo?.reservationTime);

        const foods = Array.isArray(detail?.foods) ? detail.foods : [];
        const services = Array.isArray(detail?.services) ? detail.services : [];
        const mergedMenu = [
          ...foods.map((x) => ({ name: x?.name || 'Món ăn', category: 'Món ăn' })),
          ...services.map((x) => ({ name: x?.name || 'Dịch vụ', category: 'Dịch vụ' })),
        ];

        const guests = toNum(eventInfo?.numberOfGuests, 0);
        const tables = toNum(eventInfo?.numberOfTables ?? eventInfo?.tableCount, guests);
        const guestsPerTable = tables > 0 ? Math.max(1, Math.round(guests / tables)) : 10;

        const terms = contract?.termsAndConditions || detail?.contract?.termsAndConditions || DEFAULT_CREATE_TERMS;
        const cancellation = terms
          ? String(terms)
            .split(/\r?\n|\.|;/)
            .map((x) => x.trim())
            .filter(Boolean)
          : [];

        const signedAt = contract?.signedAt || confirmedBy?.confirmedAt;
        const signedDate = signedAt ? new Date(signedAt).toLocaleDateString('vi-VN') : '--/--/----';

        setContractData({
          ...createInitialContractData(),
          contractNumericId: toNum(contract?.contractId, 0) || null,
          bookingCode,
          contractId: contract?.contractCode || contract?.contractId || '--',
          status: rawStatus,
          statusText: statusLabel[rawStatus] || contract?.status || detail?.status || 'Nháp',
          partyA: {
            name: 'Nhà hàng Gourmet Luxury',
            address: 'Chưa cập nhật',
            representative: confirmedBy?.fullName || 'Chưa cập nhật',
            position: 'Quản lý',
            signed: Boolean(signedAt),
            signedDate,
          },
          partyB: {
            name: customer?.fullName || 'Chưa cập nhật',
            phone: customer?.phone || '---',
            email: customer?.email || '---',
            signed: Boolean(contract?.signedAt),
            signedDate: contract?.signedAt ? new Date(contract.signedAt).toLocaleDateString('vi-VN') : null,
          },
          event: {
            name: detail?.eventTitle || `Sự kiện ${bookingCode}`,
            date: dt.date,
            time: dt.time,
            tables,
            guestsPerTable,
          },
          menu: mergedMenu,
          payment: {
            total,
            deposit,
            depositPercent,
          },
          cancellation,
        });
        setIsPendingCreate(!contract);
      } catch (err) {
        console.error('Lỗi tải hợp đồng theo bookingCode:', err);
        const errorCode = err?.response?.status ? ` (HTTP ${err.response.status})` : '';
        const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Không tải được hợp đồng.';
        setLoadError(`${detail}${errorCode}`);
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [eventId, searchParams, isCreateMode]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  const handleSignContract = () => {
    // Open signature pad modal
    setIsSignaturePadOpen(true);
  };

  const handleDownloadPDF = () => {
    alert('Tính năng tải PDF đang được phát triển');
  };

  const handleSendToCustomerSign = () => {
    const doSend = async () => {
      if (!contractData.contractNumericId) {
        alert('Không tìm thấy contractId để gửi ký.');
        return;
      }

      setSendingToCustomer(true);
      try {
        const res = await contractAPI.sendSign(contractData.contractNumericId);
        const payload = res?.data?.data ?? res?.data ?? {};
        const sentTo = payload?.sentTo ? ` (${payload.sentTo})` : '';
        const deadline = payload?.deadline
          ? `\nHạn ký: ${new Date(payload.deadline).toLocaleString('vi-VN')}`
          : '';

        setContractData(prev => ({
          ...prev,
          status: 'sent',
          statusText: 'Đã gửi ký / Chờ khách ký',
        }));

        alert(`${payload?.message || 'Đã gửi khách hàng ký thành công'}${sentTo}${deadline}`);
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Gửi khách hàng ký thất bại.';
        alert(msg);
      } finally {
        setSendingToCustomer(false);
      }
    };

    doSend();
  };

  const handleSendDepositRequest = () => {
    const doSend = async () => {
      if (!canShowDepositRequestButton) {
        alert('Chỉ gửi yêu cầu đặt cọc sau khi đã gửi khách ký và khách đã ký xong.');
        return;
      }
      if (!contractData.contractNumericId) {
        alert('Không tìm thấy contractId để gửi yêu cầu đặt cọc.');
        return;
      }

      setSendingDepositRequest(true);
      try {
        const res = await contractAPI.sendDepositRequest(contractData.contractNumericId);
        const payload = res?.data?.data ?? res?.data ?? {};
        const checkoutUrl = payload?.checkoutUrl || '';

        if (!checkoutUrl) {
          alert(payload?.message || 'Đã tạo yêu cầu đặt cọc nhưng không nhận được đường dẫn thanh toán.');
          return;
        }

        if (navigator?.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(checkoutUrl);
          } catch (_) {
            // Ignore clipboard errors and continue with mail draft flow.
          }
        }

        const customerEmail = contractData?.partyB?.email;
        if (customerEmail && customerEmail !== '---') {
          const subject = encodeURIComponent(`Yeu cau dat coc hop dong ${contractData.contractId}`);
          const body = encodeURIComponent(
            `Xin chao ${contractData.partyB.name || 'Quy khach'},\n\n` +
            `Vui long thanh toan dat coc theo hop dong ${contractData.contractId}.\n` +
            `Link thanh toan PayOS: ${checkoutUrl}\n\n` +
            `Tran trong.`
          );

          const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${subject}&body=${body}`;
          const opened = window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');

          if (!opened) {
            window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, '_self');
          }
        }

        alert(`${payload?.message || 'Đã tạo link đặt cọc thành công.'}\nLink thanh toán đã được sao chép.`);
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Gửi yêu cầu đặt cọc thất bại.';
        alert(msg);
      } finally {
        setSendingDepositRequest(false);
      }
    };

    doSend();
  };

  const handleCreateContract = async () => {
    if (!eventId) return;
    setCreatingContract(true);
    try {
      await createBookEventContract(Number(eventId), {
        depositPercent: Number(createForm.depositPercent) || 0,
        termsAndConditions: createForm.termsAndConditions,
        note: createForm.note,
      });
      const params = new URLSearchParams(searchParams);
      params.delete('create');
      navigate(`${base}/reservations/${eventId}/contract?${params.toString()}`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Tạo hợp đồng thất bại.';
      alert(msg);
    } finally {
      setCreatingContract(false);
    }
  };

  if (loading) {
    return <div className="contract-signing-page" style={{ padding: 24 }}>Đang tải hợp đồng...</div>;
  }

  if (loadError) {
    return <div className="contract-signing-page" style={{ padding: 24, color: '#b91c1c' }}>{loadError}</div>;
  }

  return (
    <div className="contract-signing-page">
      {/* Breadcrumb & Header */}
      <nav className="contract-breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate(homePath)}>
          Trang chủ
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-link" onClick={() => navigate(`${base}/reservations`)}>
          Lịch đặt bàn
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{isPendingCreate ? 'Tạo hợp đồng sự kiện' : 'Ký hợp đồng điện tử'}</span>
      </nav>

      {/* Top Header Bar */}
      <div className="contract-header-bar">
        <div className="header-info">
          <h1 className="contract-title">{isPendingCreate ? 'TẠO HỢP ĐỒNG SỰ KIỆN' : 'KÝ HỢP ĐỒNG SỰ KIỆN'}</h1>
          <div className="contract-badges">
            <span className="badge badge-primary">
              Mã: {contractData.contractId}
            </span>
            {contractData.bookingCode ? (
              <span className="badge badge-primary">Booking: {contractData.bookingCode}</span>
            ) : null}
            <span className="badge badge-warning">
              Trạng thái: {contractData.statusText}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          {!isPendingCreate && (
            <button 
              className="btn-download-pdf"
              onClick={handleDownloadPDF}
            >
              <Download size={18} />
              Tải bản nháp PDF
            </button>
          )}
        </div>
      </div>

      {/* Contract Document */}
      <div className="contract-document">
        {/* Document Header */}
        <div className="document-header">
          <div className="header-icon">
            <ShieldCheck size={40} className="icon-shield" />
          </div>
          <p className="header-country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="header-motto">Độc lập - Tự do - Hạnh phúc</p>
          <div className="header-divider"></div>
          <h2 className="document-title">HỢP ĐỒNG DỊCH VỤ TỔ CHỨC SỰ KIỆN</h2>
          <p className="document-subtitle">
            Căn cứ vào nhu cầu và khả năng của hai bên, chúng tôi thống nhất các điều khoản sau đây:
          </p>
        </div>

        {/* Parties Information */}
        <div className="parties-section">
          {/* Party A */}
          <div className="party-box">
            <h3 className="party-title">
              <Building2 size={16} />
              Bên A (Nhà hàng)
            </h3>
            <div className="party-details">
              <div className="detail-row">
                <span className="detail-label">Tên đơn vị:</span>
                <span className="detail-value">{contractData.partyA.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Địa chỉ:</span>
                <span className="detail-value">{contractData.partyA.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Đại diện:</span>
                <span className="detail-value representative">
                  {contractData.partyA.representative} - {contractData.partyA.position}
                </span>
              </div>
            </div>
          </div>

          {/* Party B */}
          <div className="party-box">
            <h3 className="party-title">
              <User size={16} />
              Bên B (Khách hàng)
            </h3>
            <div className="party-details">
              <div className="detail-row">
                <span className="detail-label">Họ và tên:</span>
                <span className="detail-value">{contractData.partyB.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Số điện thoại:</span>
                <span className="detail-value">{contractData.partyB.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{contractData.partyB.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <div className="contract-content">
          {/* Section 1: Event Details */}
          <section className="contract-section">
            <h4 className="section-title">
              <span className="section-number">1</span>
              Chi tiết dịch vụ & Sự kiện
            </h4>
            <div className="event-details-grid">
              <div className="event-detail-card">
                <p className="card-label">Tên sự kiện</p>
                <p className="card-value">{contractData.event.name}</p>
              </div>
              <div className="event-detail-card">
                <p className="card-label">Thời gian</p>
                <p className="card-value">{contractData.event.time} - {contractData.event.date}</p>
              </div>
              <div className="event-detail-card">
                <p className="card-label">Số lượng bàn</p>
                <p className="card-value">
                  {contractData.event.tables} Bàn ({contractData.event.guestsPerTable} người/bàn)
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Menu */}
          <section className="contract-section">
            <h4 className="section-title">
              <span className="section-number">2</span>
              Thực đơn đã chọn
            </h4>
            <div className="menu-table-wrapper">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th>Món ăn</th>
                    <th>Loại món</th>
                  </tr>
                </thead>
                <tbody>
                  {contractData.menu.length === 0 && (
                    <tr>
                      <td colSpan="2" className="menu-item-category">Chưa có dữ liệu món ăn/dịch vụ</td>
                    </tr>
                  )}
                  {contractData.menu.map((item, index) => (
                    <tr key={index}>
                      <td className="menu-item-name">{item.name}</td>
                      <td className="menu-item-category">{item.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Payment */}
          <section className="contract-section">
            <h4 className="section-title">
              <span className="section-number">3</span>
              Điều khoản hợp đồng & Đặt cọc
            </h4>
            {isPendingCreate ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ fontWeight: 600 }}>
                  Điều khoản hợp đồng
                  <textarea
                    rows={6}
                    value={createForm.termsAndConditions}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, termsAndConditions: e.target.value }))}
                    style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, border: '1px solid #d8dee9' }}
                  />
                </label>
                <label style={{ fontWeight: 600 }}>
                  Tỉ lệ đặt cọc (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={createForm.depositPercent}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, depositPercent: Number(e.target.value) }))}
                    style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, border: '1px solid #d8dee9' }}
                  />
                </label>
                <label style={{ fontWeight: 600 }}>
                  Ghi chú
                  <textarea
                    rows={3}
                    value={createForm.note}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, note: e.target.value }))}
                    style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, border: '1px solid #d8dee9' }}
                  />
                </label>

                <div className="payment-box" style={{ marginTop: 6 }}>
                  <div className="payment-total">
                    <span className="payment-label">Tổng chi phí:</span>
                    <span className="payment-amount">{formatCurrency(contractData.payment.total)}</span>
                  </div>
                  <div className="payment-deposit">
                    <span className="deposit-label">Tiền đặt cọc ({createForm.depositPercent}%):</span>
                    <span className="deposit-amount">
                      {formatCurrency(Math.round((contractData.payment.total || 0) * (Number(createForm.depositPercent) || 0) / 100))}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn-back" onClick={() => navigate(-1)} type="button">
                    <ArrowLeft size={18} />
                    Quay lại
                  </button>
                  <button className="btn-download-pdf" onClick={handleCreateContract} type="button" disabled={creatingContract}>
                    <Edit3 size={18} />
                    {creatingContract ? 'Đang tạo hợp đồng...' : 'Tạo hợp đồng'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="payment-grid">
                <div className="payment-box">
                  <div className="payment-total">
                    <span className="payment-label">Tổng chi phí:</span>
                    <span className="payment-amount">{formatCurrency(contractData.payment.total)}</span>
                  </div>
                  <div className="payment-deposit">
                    <span className="deposit-label">
                      Tiền đặt cọc ({contractData.payment.depositPercent}%):
                    </span>
                    <span className="deposit-amount">{formatCurrency(contractData.payment.deposit)}</span>
                  </div>
                </div>

                <div className="cancellation-policy">
                  <p className="policy-title">Quy định hủy bỏ:</p>
                  {contractData.cancellation.length === 0 && (
                    <p className="policy-item">• Chưa có điều khoản hủy bỏ.</p>
                  )}
                  {contractData.cancellation.map((policy, index) => (
                    <p key={index} className="policy-item">• {policy}</p>
                  ))}

                  {canShowDepositRequestButton ? (
                    <button
                      className="btn-request-deposit"
                      onClick={handleSendDepositRequest}
                      type="button"
                      disabled={sendingDepositRequest || !contractData.contractNumericId}
                    >
                      {sendingDepositRequest ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU ĐẶT CỌC'}
                    </button>
                  ) : (
                    <p className="policy-item" style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>
                      {contractData.partyB.signed
                        ? 'Gửi yêu cầu đặt cọc sẽ khả dụng khi hợp đồng ở trạng thái đã gửi ký / đã ký.'
                        : 'Vui lòng gửi khách hàng ký và chờ khách ký xong trước khi gửi yêu cầu đặt cọc.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Section 4: Signatures */}
          {!isPendingCreate && (
            <section className="contract-section signature-section">
              <h4 className="signature-header">Khu vực chữ ký số</h4>
              <div className="signatures-grid">
              {/* Party A Signature */}
              <div className="signature-box">
                <p className="signature-title">Bên A (Nhà hàng)</p>
                <div className={`signature-area ${contractData.partyA.signed ? 'signed' : 'unsigned'}`}>
                  <div className="signature-content">
                    {contractData.partyA.representative}
                  </div>
                  <div className="signature-timestamp">
                    Digital Signed: {contractData.partyA.signedDate}
                  </div>
                  {contractData.partyA.signed ? <CheckCircle className="signature-check" size={20} /> : null}
                </div>
                <p className="signatory-name">{contractData.partyA.representative}</p>
              </div>

              {/* Party B Signature */}
              <div className="signature-box">
                <p className="signature-title">Bên B (Khách hàng)</p>
                <div 
                  className={`signature-area ${contractData.partyB.signed ? 'signed' : 'unsigned'}`}
                  onClick={!contractData.partyB.signed ? handleSignContract : undefined}
                >
                  {contractData.partyB.signed ? (
                    <>
                      <div className="signature-content">{contractData.partyB.name}</div>
                      <div className="signature-timestamp">Digital Signed: {contractData.partyB.signedDate}</div>
                      <CheckCircle className="signature-check" size={20} />
                    </>
                  ) : (
                    <>
                      <Edit3 className="signature-icon" size={24} />
                      <p className="signature-prompt">Ký tên tại đây</p>
                    </>
                  )}
                </div>
                <p className={`signatory-name ${contractData.partyB.signed ? '' : 'unsigned-text'}`}>
                  {contractData.partyB.signed ? contractData.partyB.name : 'Chưa ký'}
                </p>
              </div>
              </div>
            </section>
          )}
        </div>

        {/* Action Footer */}
        {!isPendingCreate && (
          <div className="contract-footer">
            <button
              className="btn-send-customer-sign"
              onClick={handleSendToCustomerSign}
              type="button"
              disabled={sendingToCustomer || !contractData.contractNumericId}
            >
              <FileText size={20} />
              {sendingToCustomer ? 'ĐANG GỬI...' : 'GỬI KHÁCH HÀNG KÝ'}
            </button>
            <button 
              className="btn-sign-contract"
              onClick={handleSignContract}
            >
              <Edit3 size={20} />
              XÁC NHẬN KÝ KẾT
            </button>
          </div>
        )}
      </div>

      {/* Legal Notice */}
      <p className="legal-notice">
        Bản hợp đồng này có giá trị pháp lý theo Luật Giao dịch điện tử. <br/>
        © 2023 Gourmet POS - Hệ thống quản lý nhà hàng.
      </p>

      {/* Signature Pad Modal (placeholder) */}
      {isSignaturePadOpen && (
        <div className="signature-modal-overlay" onClick={() => setIsSignaturePadOpen(false)}>
          <div className="signature-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Chữ ký điện tử</h3>
            <p>Tính năng ký điện tử đang được phát triển...</p>
            <button 
              className="btn-close-modal"
              onClick={() => setIsSignaturePadOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSigningPage;
