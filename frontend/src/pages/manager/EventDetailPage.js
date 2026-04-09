import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoleSectionBasePath } from '../../hooks/useRoleSectionBasePath';
import { eventBookingAPI } from '../../api/managerApi';
import { 
  Calendar, Users, CheckCircle, FileText, 
  ChevronRight, DollarSign,
  UtensilsCrossed, Scale
} from 'lucide-react';
import '../../styles/EventDetailPage.css';
import TransactionHistoryModal from '../../components/TransactionHistoryModal';

const createEmptyEventData = (eventId) => ({
  id: eventId || '',
  bookingCode: '',
  title: 'Chưa có dữ liệu sự kiện',
  venue: 'Chưa cập nhật',
  date: '--/--/----',
  time: '--:--',
  tables: 0,
  guests: 0,
  status: 'pending',
  statusText: 'Chưa có hợp đồng',
  comboName: 'Chưa cập nhật',
  menu: [],
  policies: [],
  services: [],
  payment: {
    pricePerTable: 0,
    quantity: 0,
    subtotal: 0,
    serviceVAT: 0,
    decoration: 0,
    total: 0,
    deposit: 0,
    remaining: 0,
  },
});

const EventDetailPage = () => {
  const { base } = useRoleSectionBasePath();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [eventData, setEventData] = useState(() => createEmptyEventData(eventId));

  const statusLabelMap = {
    pending: 'Chờ duyệt / Chờ xử lý',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    confirmed: 'Đã xác nhận',
    active: 'Đang diễn ra',
    cancelled: 'Đã hủy',
    canceled: 'Đã hủy',
    completed: 'Đã hoàn thành',
    draft: 'Nháp',
    sent: 'Đã gửi ký / Chờ khách ký',
    signed: 'Đã ký',
    deposited: 'Đã đặt cọc',
  };

  const toDateTime = (dateStr, timeStr) => {
    if (!dateStr) return { date: '--/--/----', time: '--:--' };
    const raw = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))
      ? `${dateStr}T${timeStr || '00:00:00'}`
      : dateStr;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return { date: '--/--/----', time: '--:--' };
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const pickField = (obj, keys, fallback = null) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
  };

  const toNum = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  useEffect(() => {
    const loadDetail = async () => {
      if (!eventId) {
        setLoading(false);
        setLoadError('Thiếu mã sự kiện.');
        return;
      }

      setLoading(true);
      setLoadError('');
      try {
        const res = await eventBookingAPI.getDetailById(eventId);
        const body = res?.data;
        const payload = body?.data?.data ?? body?.data ?? body;
        const detail = Array.isArray(payload) ? payload[0] : payload;

        if (!detail || typeof detail !== 'object') {
          setEventData(createEmptyEventData(eventId));
          return;
        }

        const customer = detail?.customer || {};
        const eventInfo = detail?.eventInfo || {};
        const contract = detail?.contract || {};
        const paymentData = detail?.payment || {};

        const statusRaw = String(
          pickField(
            {
              contractStatus: contract?.status,
              status: detail?.status,
              bookingStatus: detail?.bookingStatus,
            },
            ['contractStatus', 'status', 'bookingStatus'],
            'pending'
          )
        ).toLowerCase();
        const dt = toDateTime(
          pickField(eventInfo, ['reservationDate', 'eventDate', 'date'])
            ?? pickField(detail, ['reservationDate', 'eventDate', 'date']),
          pickField(eventInfo, ['reservationTime', 'eventTime', 'time'])
            ?? pickField(detail, ['reservationTime', 'eventTime', 'time'])
        );

        const total = toNum(pickField(paymentData, ['totalAmount', 'total', 'grandTotal'], 0));
        const deposit = toNum(pickField(paymentData, ['depositAmount', 'depositedAmount', 'deposit'], 0));
        const paidAmount = toNum(pickField(paymentData, ['paidAmount'], 0));
        const remainingRaw = pickField(paymentData, ['remainingAmount', 'remainAmount']);
        const remaining = remainingRaw !== null ? toNum(remainingRaw, 0) : Math.max(total - deposit, 0);

        const explicitTables = pickField(eventInfo, ['numberOfTables', 'tableCount', 'tables'])
          ?? pickField(detail, ['numberOfTables', 'tableCount', 'tables']);
        const guestsRaw = toNum(
          pickField(eventInfo, ['numberOfGuests', 'guestCount', 'guests'])
            ?? pickField(detail, ['numberOfGuests', 'guestCount', 'guests'], 0)
        );

        // Backend hiện trả numberOfGuests theo ngữ cảnh số bàn ở một số API detail.
        // Nếu thiếu số bàn rõ ràng, dùng numberOfGuests làm số bàn và quy đổi khách = bàn * 10.
        const quantity = explicitTables !== null && explicitTables !== undefined
          ? toNum(explicitTables, 0)
          : guestsRaw;
        const computedGuests = explicitTables !== null && explicitTables !== undefined
          ? (guestsRaw || (quantity * 10))
          : (quantity * 10);
        const pricePerTable = toNum(
          pickField(paymentData, ['pricePerTable', 'unitPrice'])
            ?? pickField(detail, ['pricePerTable', 'unitPrice'], 0)
        );
        const subtotal = toNum(
          pickField(paymentData, ['subtotal', 'subTotal']),
          pricePerTable * quantity || total
        );

        const menuItems = pickField(detail, ['foods', 'menuItems', 'items'], []);
        const menu = Array.isArray(menuItems) && menuItems.length
          ? [{
            category: 'Thực đơn',
            items: menuItems.map((m) => ({
              name: pickField(m, ['name', 'dishName', 'foodName'], 'Món ăn'),
              description: pickField(m, ['description', 'note'], ''),
              price: toNum(pickField(m, ['subtotal'], toNum(pickField(m, ['price', 'unitPrice'], 0)))),
              note: pickField(m, ['note', 'cookingNote'], ''),
            })),
          }]
          : [];

        const services = Array.isArray(detail?.services)
          ? detail.services.map((s) => {
            const name = pickField(s, ['name', 'serviceName'], 'Dịch vụ');
            const qty = toNum(pickField(s, ['quantity'], 0));
            const value = toNum(pickField(s, ['subtotal', 'unitPrice'], 0));
            if (qty > 0 && value > 0) return `${name} x${qty} - ${new Intl.NumberFormat('vi-VN').format(value)}đ`;
            if (qty > 0) return `${name} x${qty}`;
            return name;
          })
          : [];

        const terms = pickField(contract, ['termsAndConditions', 'terms', 'note'], '');
        const policies = terms
          ? String(terms)
            .split(/\r?\n|\.|;/)
            .map((x) => x.trim())
            .filter(Boolean)
          : [];

        setEventData({
          id: pickField(detail, ['bookEventId', 'bookingCode', 'id'], eventId),
          bookingCode: pickField(detail, ['bookingCode'], ''),
          title: pickField(detail, ['eventTitle', 'eventName', 'title'], pickField(eventInfo, ['title', 'eventTitle'], `Sự kiện ${pickField(detail, ['bookingCode'], '')}`)),
          venue: pickField(detail, ['venue', 'hallName', 'location'], 'Chưa cập nhật'),
          date: dt.date,
          time: dt.time,
          tables: quantity,
          guests: computedGuests,
          status: statusRaw,
          statusText: statusLabelMap[statusRaw] || pickField(detail, ['status', 'contractStatus'], 'Chưa có hợp đồng'),
          comboName: pickField(detail, ['comboName', 'packageName', 'menuPackageName'], pickField(eventInfo, ['note'], 'Chưa cập nhật')),
          menu,
          policies,
          services,
          payment: {
            pricePerTable,
            quantity,
            subtotal,
            serviceVAT: toNum(pickField(paymentData, ['serviceVAT', 'serviceFee', 'vat'], 0)),
            decoration: toNum(pickField(paymentData, ['decorationFee', 'decoration', 'extraFee'], 0)),
            total,
            deposit: Math.max(deposit, paidAmount),
            remaining,
          },
        });
      } catch (err) {
        console.error('Lỗi tải chi tiết đặt sự kiện:', err);
        setLoadError(err?.response?.data?.message || 'Không tải được chi tiết sự kiện.');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [eventId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  if (loading) {
    return <div className="event-detail-page" style={{ padding: 24 }}>Đang tải chi tiết sự kiện...</div>;
  }

  if (loadError) {
    return <div className="event-detail-page" style={{ padding: 24, color: '#b91c1c' }}>{loadError}</div>;
  }

  return (
    <div className="event-detail-page">
      {/* Breadcrumb & Header */}
      <div className="event-detail-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item">Hệ thống</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-item">Quản lý sự kiện</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-item active">#{eventData.id}</span>
        </div>
        <h1 className="event-title">Chi tiết Sự kiện #{eventData.id}</h1>
        <p className="event-subtitle">{eventData.title}{eventData.venue ? ` - ${eventData.venue}` : ''}</p>
      </div>

      {/* Info Cards */}
      <div className="event-info-cards">
        <div className="info-card">
          <div className="info-card-header">
            <Calendar className="info-card-icon" size={20} />
            <span className="info-card-label">Ngày giờ</span>
          </div>
          <p className="info-card-value">{eventData.date} | {eventData.time}</p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <UtensilsCrossed className="info-card-icon" size={20} />
            <span className="info-card-label">Số lượng bàn</span>
          </div>
          <p className="info-card-value">{eventData.tables} bàn tiệc</p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <Users className="info-card-icon" size={20} />
            <span className="info-card-label">Khách dự kiến</span>
          </div>
          <p className="info-card-value">{eventData.guests} khách mời</p>
        </div>

        <div className="info-card status-card">
          <div className="info-card-header">
            <CheckCircle className="info-card-icon" size={20} />
            <span className="info-card-label">Trạng thái</span>
          </div>
          <p className="info-card-value status-confirmed">{eventData.statusText.toUpperCase()}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="event-content-grid">
        {/* Left Column - Menu & Terms */}
        <div className="event-left-column">
          {/* Menu Section */}
          <section className="event-section menu-section">
            <div className="section-header">
              <h3 className="section-title">
                <FileText size={20} />
                Danh sách Thực đơn được chọn
              </h3>
              <span className="combo-badge">{eventData.comboName}</span>
            </div>

            <div className="menu-table-container">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th>Món ăn / Phân loại</th>
                    <th>Đơn giá</th>
                    <th>Ghi chú chế biến</th>
                  </tr>
                </thead>
                <tbody>
                  {eventData.menu.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '14px 0' }}>
                        Chưa có dữ liệu thực đơn từ hệ thống.
                      </td>
                    </tr>
                  )}
                  {eventData.menu.map((category, catIndex) => (
                    <React.Fragment key={catIndex}>
                      <tr className="category-row">
                        <td colSpan="3">{category.category}</td>
                      </tr>
                      {category.items.map((item, itemIndex) => (
                        <tr key={itemIndex}>
                          <td>
                            <div className="menu-item-name">{item.name}</div>
                            {item.description && (
                              <div className="menu-item-desc">{item.description}</div>
                            )}
                          </td>
                          <td className="menu-price">{formatCurrency(item.price)}</td>
                          <td className="menu-note">{item.note}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Terms & Services Section */}
          <section className="event-section terms-section">
            <h3 className="section-title">
              <Scale size={20} />
              Điều khoản & Dịch vụ đi kèm
            </h3>

            <div className="terms-grid">
              {/* Policies */}
              <div className="terms-column">
                <h4 className="terms-subtitle">Chính sách & Quy định</h4>
                <ul className="policy-list">
                  {eventData.policies.length === 0 && (
                    <li className="policy-item" style={{ color: '#94a3b8' }}>Chưa có điều khoản.</li>
                  )}
                  {eventData.policies.map((policy, index) => (
                    <li key={index} className="policy-item">
                      <CheckCircle size={16} className="policy-icon" />
                      {policy}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div className="terms-column">
                <h4 className="terms-subtitle">Dịch vụ đi kèm</h4>
                <div className="services-grid">
                  {eventData.services.length === 0 && (
                    <div className="service-badge" style={{ color: '#94a3b8' }}>Chưa có dịch vụ đi kèm.</div>
                  )}
                  {eventData.services.map((service, index) => (
                    <div key={index} className="service-badge">
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Payment */}
        <div className="event-right-column">
          <section className="event-section payment-section">
            <h3 className="section-title">
              <DollarSign size={20} />
              Thanh toán dự kiến
            </h3>

            <div className="payment-details">
              <div className="payment-row">
                <span>Đơn giá thực đơn (/bàn)</span>
                <span className="payment-value">{formatCurrency(eventData.payment.pricePerTable)}</span>
              </div>
              <div className="payment-row">
                <span>Số lượng ({eventData.payment.quantity} bàn)</span>
                <span className="payment-value">{formatCurrency(eventData.payment.subtotal)}</span>
              </div>
              <div className="payment-row">
                <span>Phí dịch vụ</span>
                <span className="payment-value">{formatCurrency(eventData.payment.serviceVAT)}</span>
              </div>
              <div className="payment-row">
                <span>Trang trí & Âm thanh</span>
                <span className="payment-value">{formatCurrency(eventData.payment.decoration)}</span>
              </div>

              <hr className="payment-divider" />

              <div className="payment-row payment-total">
                <span>Tổng cộng</span>
                <span className="payment-total-value">{formatCurrency(eventData.payment.total)}</span>
              </div>

              <div className="payment-status-box">
                <div className="payment-deposit">
                  <span>Tiền cọc đã đóng (30%)</span>
                  <span className="deposit-amount">- {formatCurrency(eventData.payment.deposit)}</span>
                </div>
                <div className="payment-remaining">
                  <span>Còn lại cần thanh toán</span>
                  <span className="remaining-amount">{formatCurrency(eventData.payment.remaining)}</span>
                </div>
              </div>

              <div className="payment-actions">
                <button className="btn-confirm-payment">
                  Xác nhận thanh toán đợt 2
                </button>
                <button 
                  className="btn-transaction-history"
                  onClick={() => setShowTransactionModal(true)}
                >
                  Lịch sử giao dịch
                </button>
                <button 
                  className="btn-transaction-history"
                  onClick={() => {
                    const bookingQuery = eventData.bookingCode ? `?bookingCode=${encodeURIComponent(eventData.bookingCode)}` : '';
                    navigate(`${base}/reservations/${eventData.id}/contract${bookingQuery}`);
                  }}
                >
                  Xem hợp đồng
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="event-footer">
        <p>© 2024 Gourmet POS System. Phát triển cho Dịch vụ Tiệc Cao cấp.</p>
      </footer>

      {/* Transaction History Modal */}
      {showTransactionModal && (
        <TransactionHistoryModal 
          eventId={eventData.id}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
