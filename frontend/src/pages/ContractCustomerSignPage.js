import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Edit3, FileText, ShieldCheck } from 'lucide-react';
import { contractTokenAPI } from '../api/managerApi';
import '../styles/ContractSigningPage.css';

const createInitialData = () => ({
  contractId: '--',
  contractCode: '--',
  status: 'draft',
  statusText: 'Nháp',
  customerName: 'Khách hàng',
  customerPhone: '---',
  customerEmail: '---',
  eventName: 'Sự kiện',
  eventDate: '--/--/----',
  eventTime: '--:--',
  numberOfGuests: 0,
  terms: [],
  totalAmount: 0,
  depositAmount: 0,
  signedAt: null,
});

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toDateTime = (rawDate) => {
  if (!rawDate) return { date: '--/--/----', time: '--:--' };
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return { date: '--/--/----', time: '--:--' };
  return {
    date: d.toLocaleDateString('vi-VN'),
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
};

/** API .NET thường trả PascalCase; một số DTO lồng customer / partyB khác tên trường. */
function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function nestedCustomerLike(contract) {
  if (!contract || typeof contract !== 'object') return {};
  return (
    contract.customer ||
    contract.Customer ||
    contract.partyB ||
    contract.PartyB ||
    contract.reservation?.customer ||
    contract.Reservation?.Customer ||
    contract.booking?.customer ||
    contract.Booking?.Customer ||
    {}
  );
}

function pickCustomerFromContract(contract) {
  const c = nestedCustomerLike(contract);
  const name = firstNonEmpty(
    contract.customerName,
    contract.CustomerName,
    contract.guestName,
    contract.GuestName,
    c.fullName,
    c.FullName,
    c.name,
    c.Name,
    c.fullname,
    c.Fullname
  );
  const phone = firstNonEmpty(
    contract.customerPhone,
    contract.CustomerPhone,
    contract.phone,
    contract.Phone,
    c.phone,
    c.Phone,
    c.phoneNumber,
    c.PhoneNumber,
    c.mobile,
    c.Mobile
  );
  const email = firstNonEmpty(
    contract.customerEmail,
    contract.CustomerEmail,
    contract.email,
    contract.Email,
    c.email,
    c.Email
  );
  return {
    customerName: name || 'Khách hàng',
    customerPhone: phone || '---',
    customerEmail: email || '---',
  };
}

function pickEventNameFromContract(contract) {
  return (
    firstNonEmpty(
      contract.eventTitle,
      contract.EventTitle,
      contract.eventName,
      contract.EventName,
      contract.title,
      contract.Title
    ) || 'Sự kiện'
  );
}

const statusLabel = {
  draft: 'Nháp',
  sent: 'Đã gửi ký / Chờ khách ký',
  signed: 'Đã ký',
  deposited: 'Đã đặt cọc',
  cancelled: 'Đã hủy',
  canceled: 'Đã hủy',
};

const getStoredAuthToken = () =>
  localStorage.getItem('authToken') || localStorage.getItem('accessToken');

const ContractCustomerSignPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [signNotice, setSignNotice] = useState('');
  const [data, setData] = useState(createInitialData);

  useEffect(() => {
    const loadByToken = async () => {
      if (!token) {
        setError('Thiếu token ký hợp đồng.');
        setLoading(false);
        return;
      }

      const authToken = getStoredAuthToken();
      if (!authToken) {
        navigate('/auth', {
          replace: true,
          state: {
            authMessage: 'Vui lòng đăng nhập để ký hợp đồng.',
            redirectTo: `${location.pathname}${location.search}`,
          },
        });
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await contractTokenAPI.getBySignToken(token);
        const payload = res?.data?.data ?? res?.data;
        const contract = Array.isArray(payload) ? payload[0] : payload;

        if (!contract || typeof contract !== 'object') {
          throw new Error('Dữ liệu hợp đồng không hợp lệ.');
        }

        const rawStatus = String(
          contract?.status ?? contract?.Status ?? 'draft'
        ).toLowerCase();
        const signedAt = contract?.signedAt ?? contract?.SignedAt ?? null;
        const dt = toDateTime(
          contract?.eventDate ||
            contract?.EventDate ||
            contract?.reservationDate ||
            contract?.ReservationDate ||
            signedAt
        );
        const termsRaw =
          contract?.termsAndConditions ?? contract?.TermsAndConditions ?? '';
        const terms = termsRaw
          ? String(termsRaw)
            .split(/\r?\n|\.|;/)
            .map((x) => x.trim())
            .filter(Boolean)
          : [];

        const cust = pickCustomerFromContract(contract);
        const code =
          firstNonEmpty(contract.contractCode, contract.ContractCode) || '--';
        const cid =
          firstNonEmpty(contract.contractId, contract.ContractId) || '--';

        setData({
          contractId: cid,
          contractCode: code,
          status: rawStatus,
          statusText: statusLabel[rawStatus] || contract?.status || 'Nháp',
          customerName: cust.customerName,
          customerPhone: cust.customerPhone,
          customerEmail: cust.customerEmail,
          eventName: pickEventNameFromContract(contract),
          eventDate: dt.date,
          eventTime: dt.time,
          numberOfGuests: toNum(
            contract?.numberOfGuests ?? contract?.NumberOfGuests,
            0
          ),
          terms,
          totalAmount: toNum(
            contract?.totalAmount ??
              contract?.TotalAmount ??
              contract?.amount ??
              contract?.Amount,
            0
          ),
          depositAmount: toNum(
            contract?.depositAmount ?? contract?.DepositAmount,
            0
          ),
          signedAt,
        });
      } catch (err) {
        setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Không tải được hợp đồng từ token.');
      } finally {
        setLoading(false);
      }
    };

    loadByToken();
  }, [location.pathname, location.search, navigate, token]);

  const canSign = useMemo(() => data.status !== 'signed' && !data.signedAt, [data.status, data.signedAt]);

  const handleConfirmSign = async () => {
    if (!token || !canSign) return;
    setSigning(true);
    setSignNotice('');
    try {
      const res = await contractTokenAPI.confirmSignByToken(token);
      const payload = res?.data?.data ?? res?.data ?? {};
      setSignNotice(payload?.message || 'Ký hợp đồng thành công.');
      setData((prev) => ({
        ...prev,
        contractId: payload?.contractId || prev.contractId,
        contractCode: payload?.contractCode || prev.contractCode,
        status: 'signed',
        statusText: 'Đã ký',
        signedAt: payload?.signedAt || new Date().toISOString(),
      }));
    } catch (err) {
      setSignNotice(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Ký hợp đồng thất bại.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return <div className="contract-signing-page" style={{ padding: 24 }}>Đang tải hợp đồng từ token...</div>;
  }

  if (error) {
    const isAlreadySigned = String(error).toLowerCase().includes('đã được ký')
      || String(error).toLowerCase().includes('already signed');

    if (isAlreadySigned) {
      return (
        <div className="contract-signing-page">
          <div className="contract-header-bar" style={{ marginTop: 24 }}>
            <div className="header-info">
              <h1 className="contract-title">KÝ HỢP ĐỒNG ĐIỆN TỬ</h1>
              <div className="contract-badges">
                <span className="badge badge-warning">Trạng thái: ĐÃ KÝ</span>
              </div>
            </div>
          </div>

          <div className="contract-document">
            <div className="document-header">
              <div className="header-icon">
                <ShieldCheck size={40} className="icon-shield" />
              </div>
              <h2 className="document-title">HỢP ĐỒNG ĐÃ ĐƯỢC KÝ TRƯỚC ĐÓ</h2>
              <p className="document-subtitle">Liên kết ký này không còn hiệu lực cho thao tác ký lại.</p>
            </div>

            <div className="contract-footer">
              <button className="btn-sign-contract" type="button" disabled>
                <CheckCircle size={20} />
                ĐÃ KÝ HỢP ĐỒNG
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <div className="contract-signing-page" style={{ padding: 24, color: '#b91c1c' }}>{error}</div>;
  }

  return (
    <div className="contract-signing-page">
      <div className="contract-header-bar" style={{ marginTop: 24 }}>
        <div className="header-info">
          <h1 className="contract-title">KÝ HỢP ĐỒNG ĐIỆN TỬ</h1>
          <div className="contract-badges">
            <span className="badge badge-primary">Mã: {data.contractCode}</span>
            <span className="badge badge-warning">Trạng thái: {data.statusText}</span>
          </div>
        </div>
      </div>

      <div className="contract-document">
        <div className="document-header">
          <div className="header-icon">
            <ShieldCheck size={40} className="icon-shield" />
          </div>
          <p className="header-country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="header-motto">Độc lập - Tự do - Hạnh phúc</p>
          <div className="header-divider"></div>
          <h2 className="document-title">HỢP ĐỒNG DỊCH VỤ TỔ CHỨC SỰ KIỆN</h2>
          <p className="document-subtitle">Quý khách vui lòng kiểm tra thông tin và xác nhận ký hợp đồng.</p>
        </div>

        <div className="parties-section">
          <div className="party-box">
            <h3 className="party-title"><FileText size={16} />Thông tin hợp đồng</h3>
            <div className="party-details">
              <div className="detail-row"><span className="detail-label">Mã hợp đồng:</span><span className="detail-value">{data.contractCode}</span></div>
              <div className="detail-row"><span className="detail-label">Sự kiện:</span><span className="detail-value">{data.eventName}</span></div>
              <div className="detail-row"><span className="detail-label">Thời gian:</span><span className="detail-value">{data.eventTime} - {data.eventDate}</span></div>
              <div className="detail-row"><span className="detail-label">Số lượng khách:</span><span className="detail-value">{data.numberOfGuests} khách</span></div>
            </div>
          </div>

          <div className="party-box">
            <h3 className="party-title"><Edit3 size={16} />Khách hàng</h3>
            <div className="party-details">
              <div className="detail-row"><span className="detail-label">Họ và tên:</span><span className="detail-value">{data.customerName}</span></div>
              <div className="detail-row"><span className="detail-label">Số điện thoại:</span><span className="detail-value">{data.customerPhone}</span></div>
              <div className="detail-row"><span className="detail-label">Email:</span><span className="detail-value">{data.customerEmail}</span></div>
            </div>
          </div>
        </div>

        <div className="contract-content">
          <section className="contract-section">
            <h4 className="section-title"><span className="section-number">1</span>Điều khoản hợp đồng</h4>
            <div className="cancellation-policy">
              {data.terms.length === 0 ? <p className="policy-item">• Chưa có điều khoản.</p> : null}
              {data.terms.map((term, idx) => <p key={idx} className="policy-item">• {term}</p>)}
            </div>
          </section>

          <section className="contract-section">
            <h4 className="section-title"><span className="section-number">2</span>Chi phí</h4>
            <div className="payment-grid">
              <div className="payment-box">
                <div className="payment-total"><span className="payment-label">Tổng chi phí:</span><span className="payment-amount">{new Intl.NumberFormat('vi-VN').format(data.totalAmount)} VNĐ</span></div>
                <div className="payment-deposit"><span className="deposit-label">Tiền đặt cọc:</span><span className="deposit-amount">{new Intl.NumberFormat('vi-VN').format(data.depositAmount)} VNĐ</span></div>
              </div>
            </div>
          </section>

          <section className="contract-section signature-section">
            <h4 className="signature-header">Xác nhận của khách hàng</h4>
            <div className="signatures-grid">
              <div className="signature-box">
                <p className="signature-title">Trạng thái ký</p>
                <div className={`signature-area ${canSign ? 'unsigned' : 'signed'}`}>
                  {canSign ? <p className="signature-prompt">Sẵn sàng ký hợp đồng</p> : <><div className="signature-content">{data.customerName}</div><CheckCircle className="signature-check" size={20} /></>}
                </div>
                <p className={`signatory-name ${canSign ? 'unsigned-text' : ''}`}>{canSign ? 'Chưa ký' : 'Đã ký'}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="contract-footer">
          <button className="btn-sign-contract" type="button" onClick={handleConfirmSign} disabled={!canSign || signing}>
            <Edit3 size={20} />
            {signing ? 'ĐANG KÝ...' : canSign ? 'XÁC NHẬN KÝ HỢP ĐỒNG' : 'ĐÃ KÝ HỢP ĐỒNG'}
          </button>
        </div>
      </div>

      {signNotice ? (
        <p className="legal-notice" style={{ color: signNotice.toLowerCase().includes('thất bại') ? '#b91c1c' : '#15803d' }}>
          {signNotice}
        </p>
      ) : null}
    </div>
  );
};

export default ContractCustomerSignPage;
