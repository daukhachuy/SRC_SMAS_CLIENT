import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Edit3, FileText, ShieldCheck } from 'lucide-react';
import { contractTokenAPI } from '../api/managerApi';
import { extractUserFromToken } from '../utils/jwtHelper';
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
    if (v === undefined || v === null) continue;
    if (typeof v === 'object') continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return '';
}

const CUSTOMER_NAME_KEYS = [
  'fullName',
  'FullName',
  'fullname',
  'Fullname',
  'name',
  'Name',
  'customerName',
  'CustomerName',
  'guestName',
  'GuestName',
  'contactName',
  'ContactName',
  'clientName',
  'ClientName',
  'representativeName',
  'RepresentativeName',
  'displayName',
  'DisplayName',
  'userName',
  'UserName',
];

const CUSTOMER_PHONE_KEYS = [
  'phone',
  'Phone',
  'phoneNumber',
  'PhoneNumber',
  'mobile',
  'Mobile',
  'mobilePhone',
  'MobilePhone',
  'cellPhone',
  'CellPhone',
  'customerPhone',
  'CustomerPhone',
  'telephone',
  'Telephone',
  'tel',
  'Tel',
  'contactPhone',
  'ContactPhone',
  'soDienThoai',
  'SoDienThoai',
  'primaryPhone',
  'PrimaryPhone',
  'userPhone',
  'UserPhone',
];

const CUSTOMER_EMAIL_KEYS = [
  'email',
  'Email',
  'customerEmail',
  'CustomerEmail',
  'contactEmail',
  'ContactEmail',
  'emailAddress',
  'EmailAddress',
  'mail',
  'Mail',
  'userEmail',
  'UserEmail',
];

function collectCustomerObjects(contract) {
  const out = [];
  const push = (o) => {
    if (o && typeof o === 'object' && !Array.isArray(o)) out.push(o);
  };
  push(contract);
  push(contract?.customer);
  push(contract?.Customer);
  push(contract?.partyB);
  push(contract?.PartyB);
  push(contract?.eventBooking?.customer);
  push(contract?.EventBooking?.Customer);
  push(contract?.bookEvent?.customer);
  push(contract?.BookEvent?.Customer);
  push(contract?.booking?.customer);
  push(contract?.Booking?.Customer);
  push(contract?.reservation?.customer);
  push(contract?.Reservation?.Customer);
  push(contract?.user);
  push(contract?.User);
  push(contract?.contact);
  push(contract?.Contact);
  push(contract?.applicationUser);
  push(contract?.ApplicationUser);
  push(contract?.guest);
  push(contract?.Guest);
  return out;
}

function pickFromObjects(objs, keys) {
  for (const o of objs) {
    for (const k of keys) {
      const t = firstNonEmpty(o[k]);
      if (t) return t;
    }
  }
  return '';
}

const getStoredAuthToken = () =>
  localStorage.getItem('authToken') || localStorage.getItem('accessToken');

/** Khi API hợp đồng theo token không trả Party B, dùng user đang đăng nhập (đúng luồng khách ký). Email có thể lấy thêm từ JWT. */
function readLoggedInUserFallback() {
  try {
    let name = '';
    let phone = '';
    let email = '';
    const s = localStorage.getItem('user');
    if (s) {
      const u = JSON.parse(s);
      name = firstNonEmpty(u.fullName, u.fullname, u.name, u.displayName);
      phone = firstNonEmpty(u.phone, u.phoneNumber, u.mobile, u.PhoneNumber);
      email = firstNonEmpty(u.email, u.Email);
    }
    const token = getStoredAuthToken();
    if (token) {
      const fromJwt = extractUserFromToken(token);
      if (fromJwt) {
        name = firstNonEmpty(name, fromJwt.fullname);
        email = firstNonEmpty(email, fromJwt.email);
      }
    }
    return { name, phone, email };
  } catch {
    return { name: '', phone: '', email: '' };
  }
}

function pickCustomerFromContract(contract) {
  const objs = collectCustomerObjects(contract);
  const name = pickFromObjects(objs, CUSTOMER_NAME_KEYS);
  const phone = pickFromObjects(objs, CUSTOMER_PHONE_KEYS);
  const email = pickFromObjects(objs, CUSTOMER_EMAIL_KEYS);
  const fb = readLoggedInUserFallback();
  return {
    customerName: firstNonEmpty(name, fb.name) || 'Khách hàng',
    customerPhone: firstNonEmpty(phone, fb.phone) || '---',
    customerEmail: firstNonEmpty(email, fb.email) || '---',
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
      contract.Title,
      contract.eventBooking?.eventTitle,
      contract.EventBooking?.EventTitle,
      contract.eventBooking?.title,
      contract.bookEvent?.eventTitle,
      contract.BookEvent?.EventTitle
    ) || 'Sự kiện'
  );
}

/** Chuẩn hóa body API (data / data.data / contract lồng nhau). */
function resolveContractFromSignResponse(res) {
  const root = res?.data ?? {};
  const candidates = [
    root?.data?.data,
    root?.Data?.Data,
    root?.data?.contract,
    root?.data?.Contract,
    root?.contract,
    root?.Contract,
    root?.data,
    root?.Data,
    root,
  ];
  for (const c of candidates) {
    const obj = Array.isArray(c) ? c[0] : c;
    if (obj && typeof obj === 'object') return obj;
  }
  return null;
}

/** Cùng logic với `routes.js` — khách về `/`, nhân viên về dashboard role. */
function getHomePathAfterSign() {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return '/';
    const user = JSON.parse(userStr);
    const role = String(user?.role || '').trim().toLowerCase();
    if (role === 'manager') return '/manager';
    if (role === 'waiter') return '/waiter';
    if (role === 'kitchen') return '/kitchen';
    if (role === 'admin') return '/admin';
  } catch (_) {
    /* ignore */
  }
  return '/';
}

const statusLabel = {
  draft: 'Nháp',
  sent: 'Đã gửi ký / Chờ khách ký',
  signed: 'Đã ký',
  deposited: 'Đã đặt cọc',
  cancelled: 'Đã hủy',
  canceled: 'Đã hủy',
};

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
  const [thankYouAfterSign, setThankYouAfterSign] = useState(false);
  const redirectHomeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectHomeTimerRef.current) {
        clearTimeout(redirectHomeTimerRef.current);
        redirectHomeTimerRef.current = null;
      }
    };
  }, []);

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
        const contract = resolveContractFromSignResponse(res);

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
      setSignNotice('');
      setThankYouAfterSign(true);
      setData((prev) => ({
        ...prev,
        contractId: payload?.contractId || prev.contractId,
        contractCode: payload?.contractCode || prev.contractCode,
        status: 'signed',
        statusText: 'Đã ký',
        signedAt: payload?.signedAt || new Date().toISOString(),
      }));
      if (redirectHomeTimerRef.current) {
        clearTimeout(redirectHomeTimerRef.current);
      }
      redirectHomeTimerRef.current = setTimeout(() => {
        redirectHomeTimerRef.current = null;
        navigate(getHomePathAfterSign(), { replace: true });
      }, 5000);
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
      {thankYouAfterSign ? (
        <div className="contract-sign-thankyou-overlay" role="alertdialog" aria-live="polite">
          <div className="contract-sign-thankyou-card">
            <CheckCircle size={52} className="contract-sign-thankyou-icon" aria-hidden />
            <h2 className="contract-sign-thankyou-title">Cảm ơn quý khách</h2>
            <p className="contract-sign-thankyou-text">
              Quý khách đã ký hợp đồng thành công. Chúng tôi đã ghi nhận xác nhận của quý khách.
            </p>
            <p className="contract-sign-thankyou-hint">Đang chuyển về trang chủ sau vài giây…</p>
          </div>
        </div>
      ) : null}

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
              <div className="detail-row"><span className="detail-label">Số lượng bàn:</span><span className="detail-value">{data.numberOfGuests} bàn</span></div>
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
