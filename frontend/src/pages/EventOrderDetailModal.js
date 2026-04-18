import React, { useState, useEffect } from 'react';
import { myOrderAPI } from '../api/myOrderApi';

const EVENT_TYPE_MAP = {
  1: { name: 'Tiệc Cưới', color: '#f43f5e' },
  2: { name: 'Hội Nghị - Hội Thảo', color: '#3b82f6' },
  3: { name: 'Sinh Nhật', color: '#f59e0b' },
  4: { name: 'Tiệc Công Ty', color: '#8b5cf6' },
  5: { name: 'Liên Hoan Gia Đình', color: '#22c55e' },
};

const EVENT_TYPE_TEXT_MAP = {
  'Wedding': 'Tiệc Cưới',
  'Conference': 'Hội Nghị - Hội Thảo',
  'Birthday': 'Sinh Nhật',
  'Corporate': 'Tiệc Công Ty',
  'Family': 'Liên Hoan Gia Đình',
};

const getEventTypeName = (item) => {
  if (EVENT_TYPE_MAP[item.eventId]?.name) return EVENT_TYPE_MAP[item.eventId].name;
  return EVENT_TYPE_TEXT_MAP[item.eventType] || item.eventType || item.title || 'Sự kiện';
};

const getEventColor = (item) => {
  if (EVENT_TYPE_MAP[item.eventId]?.color) return EVENT_TYPE_MAP[item.eventId].color;
  return '#ec5b13';
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

const fmtTime = (timeStr) => {
  if (!timeStr) return '—';
  const m = String(timeStr).match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : timeStr;
};

const STATUS_CONFIG = {
  pending:    { text: 'Chờ duyệt', class: 'Pending', bg: '#FFF3E0', color: '#F39C12' },
  approved:   { text: 'Đã duyệt', class: 'Confirmed', bg: '#E3F2FD', color: '#1976D2' },
  rejected:   { text: 'Đã từ chối', class: 'Cancelled', bg: '#FFEBEE', color: '#FF3B30' },
  completed:  { text: 'Hoàn thành', class: 'Success', bg: '#E8F5E9', color: '#27AE60' },
  cancelled:  { text: 'Đã hủy', class: 'Cancelled', bg: '#FFEBEE', color: '#FF3B30' },
  active:     { text: 'Đang hoạt động', class: 'Processing', bg: '#E3F2FD', color: '#1976D2' },
};

const getStatusConfig = (status) => {
  const key = String(status || 'pending').trim().toLowerCase();
  return STATUS_CONFIG[key] || STATUS_CONFIG.pending;
};

const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return Number(amount).toLocaleString('vi-VN') + ' đ';
};

/** Lấy tên field ưu tiên */
const pick = (obj, keys, fallback = null) => {
  for (const key of keys) {
    const val = obj?.[key];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return fallback;
};

const EventOrderDetailModal = ({ eventData, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Xác định bookEventId từ eventData
  const bookEventId = pick(eventData, ['bookEventId', 'eventBookingId', 'eventId', 'id', 'bookingId']);

  useEffect(() => {
    if (!bookEventId) {
      // Không có ID → dùng trực tiếp eventData
      setDetail(eventData);
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await myOrderAPI.getBookEventDetail(bookEventId);
        setDetail(data);
      } catch (e) {
        // Fallback: dùng eventData gốc
        setDetail(eventData);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [bookEventId]);

  if (!detail && !loading) return null;

  const ev = detail || {};
  const statusCfg = getStatusConfig(ev.status || ev.bookingStatus || 'Pending');
  const eventTypeName = getEventTypeName(ev);
  const eventColor = getEventColor(ev);
  const bookingCode = pick(ev, ['bookingCode', 'eventBookingCode', 'code', 'bookEventCode'], `#${bookEventId || ev.id || ''}`);

  // Lấy thông tin khách hàng
  const customerName = pick(ev, ['customerName', 'fullname', 'fullName', 'name', 'contactName', 'representativeName'], 'Khách hàng');
  const phone = pick(ev, ['phone', 'phoneNumber', 'contactPhone', 'customerPhone'], '—');
  const email = pick(ev, ['email', 'customerEmail', 'contactEmail'], '—');
  const address = pick(ev, ['address', 'customerAddress', 'deliveryAddress'], '—');

  // Lấy thông tin sự kiện
  const eventDate = pick(ev, ['eventDate', 'bookingDate', 'reservationDate', 'eventTime', 'bookingTime']) ? fmtDate(ev.eventDate || ev.bookingDate || ev.reservationDate) : '—';
  const eventTime = fmtTime(ev.eventTime || ev.bookingTime || ev.reservationTime);
  const numberOfGuests = pick(ev, ['numberOfGuests', 'guestCount', 'guests'], 0);
  const note = pick(ev, ['note', 'specialRequests', 'requirements'], '');
  const estimatedBudget = pick(ev, ['estimatedBudget', 'budget', 'totalAmount', 'estimatedRevenue', 'total'], null);

  // Thực đơn & dịch vụ
  const menuItems = ev.foods || ev.menuItems || ev.eventFoods || [];
  const services = ev.services || ev.eventServices || [];
  const contractCode = pick(ev, ['contractCode', 'contractNumber', 'contractId'], '');
  const contractStatus = pick(ev, ['contractStatus', 'signed'], null);

  const totalMenu = menuItems.reduce((sum, item) => {
    const price = Number(pick(item, ['price', 'unitPrice', 'totalPrice', 'amount'], 0));
    const qty = Number(pick(item, ['quantity', 'qty', 'count'], 1));
    return sum + price * qty;
  }, 0);

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="event-modal-header">
          <div className="event-modal-title-row">
            <i className="fa-solid fa-calendar-star" style={{ color: '#ec5b13', fontSize: '1.4rem' }}></i>
            <div>
              <h2 className="event-modal-title">Chi tiết đặt sự kiện</h2>
              <p className="event-modal-code">#{bookingCode}</p>
            </div>
          </div>
          <div className="event-modal-header-right">
            <span
              className="event-status-badge"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.text}
            </span>
            <button className="event-modal-close" onClick={onClose}>
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="event-modal-body">
          {loading ? (
            <div className="event-modal-loading">
              <div className="Spinner"></div>
              <p>Đang tải chi tiết...</p>
            </div>
          ) : (
            <>
              {/* Event Type Banner */}
              <div
                className="event-type-banner"
                style={{ borderLeftColor: eventColor }}
              >
                <div>
                  <span className="event-type-label">LOẠI SỰ KIỆN</span>
                  <p className="event-type-name">{eventTypeName}</p>
                </div>
                <div className="event-guest-count">
                  <span className="event-guest-num">{numberOfGuests}</span>
                  <span className="event-guest-unit">khách</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="event-info-grid">
                <div className="event-info-section">
                  <h3 className="event-section-title">
                    <i className="fa-solid fa-user"></i> Thông tin liên hệ
                  </h3>
                  <div className="event-info-rows">
                    <div className="event-info-row">
                      <span className="event-info-label">Người đặt</span>
                      <span className="event-info-value">{customerName}</span>
                    </div>
                    <div className="event-info-row">
                      <span className="event-info-label">Điện thoại</span>
                      <span className="event-info-value">{phone}</span>
                    </div>
                    <div className="event-info-row">
                      <span className="event-info-label">Email</span>
                      <span className="event-info-value">{email}</span>
                    </div>
                    {address && address !== '—' && (
                      <div className="event-info-row">
                        <span className="event-info-label">Địa chỉ</span>
                        <span className="event-info-value">{address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="event-info-section">
                  <h3 className="event-section-title">
                    <i className="fa-solid fa-clock"></i> Thông tin sự kiện
                  </h3>
                  <div className="event-info-rows">
                    <div className="event-info-row">
                      <span className="event-info-label">Ngày tổ chức</span>
                      <span className="event-info-value">{eventDate}</span>
                    </div>
                    <div className="event-info-row">
                      <span className="event-info-label">Giờ bắt đầu</span>
                      <span className="event-info-value">{eventTime}</span>
                    </div>
                    <div className="event-info-row">
                      <span className="event-info-label">Số khách</span>
                      <span className="event-info-value">{numberOfGuests} người</span>
                    </div>
                    {contractCode && (
                      <div className="event-info-row">
                        <span className="event-info-label">Mã hợp đồng</span>
                        <span className="event-info-value">{contractCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Note */}
              {note && (
                <div className="event-note-section">
                  <h3 className="event-section-title">
                    <i className="fa-solid fa-comment"></i> Yêu cầu đặc biệt
                  </h3>
                  <p className="event-note-text">{note}</p>
                </div>
              )}

              {/* Menu Items */}
              {menuItems.length > 0 && (
                <div className="event-menu-section">
                  <h3 className="event-section-title">
                    <i className="fa-solid fa-utensils"></i> Thực đơn
                    <span className="event-section-count">{menuItems.length} món</span>
                  </h3>
                  <div className="event-menu-list">
                    {menuItems.map((item, idx) => (
                      <div key={idx} className="event-menu-item">
                        <div className="event-menu-item-info">
                          <span className="event-menu-item-name">
                            {pick(item, ['name', 'foodName', 'itemName', 'title'], `Món ${idx + 1}`)}
                          </span>
                          {item.quantity && (
                            <span className="event-menu-item-qty">x{item.quantity}</span>
                          )}
                        </div>
                        <span className="event-menu-item-price">
                          {formatCurrency(pick(item, ['price', 'unitPrice', 'totalPrice'], 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                  {totalMenu > 0 && (
                    <div className="event-menu-total">
                      <span>Tổng thực đơn</span>
                      <span className="event-menu-total-price">{formatCurrency(totalMenu)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Services */}
              {services.length > 0 && (
                <div className="event-service-section">
                  <h3 className="event-section-title">
                    <i className="fa-solid fa-star"></i> Dịch vụ đi kèm
                    <span className="event-section-count">{services.length} dịch vụ</span>
                  </h3>
                  <div className="event-service-list">
                    {services.map((svc, idx) => (
                      <div key={idx} className="event-service-item">
                        <i className="fa-solid fa-check-circle" style={{ color: '#27AE60' }}></i>
                        <span>{pick(svc, ['name', 'serviceName', 'title'], `Dịch vụ ${idx + 1}`)}</span>
                        {pick(svc, ['price', 'amount'], null) && (
                          <span className="event-service-price">
                            {formatCurrency(pick(svc, ['price', 'amount'], 0))}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Summary */}
              {estimatedBudget != null && (
                <div className="event-budget-section">
                  <div className="event-budget-row">
                    <span className="event-budget-label">Ước tính tổng chi phí</span>
                    <span className="event-budget-value">{formatCurrency(estimatedBudget)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="event-modal-footer">
          <button className="event-modal-btn event-modal-btn-close" onClick={onClose}>
            <i className="fa-solid fa-arrow-left"></i> Đóng
          </button>
        </div>
      </div>

      <style>{`
        .event-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .event-modal-content {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 640px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .event-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-shrink: 0;
        }
        .event-modal-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .event-modal-title {
          font-size: 1.1rem;
          font-weight: 900;
          color: #1e293b;
          margin: 0;
          text-transform: uppercase;
        }
        .event-modal-code {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 0;
          font-weight: 600;
        }
        .event-modal-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .event-status-badge {
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .event-modal-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s;
        }
        .event-modal-close:hover {
          background: #fee2e2;
          color: #ef4444;
          border-color: #fca5a5;
        }
        .event-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .event-modal-loading {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }
        .event-modal-loading .Spinner {
          width: 36px;
          height: 36px;
          border: 4px rgba(236, 91, 19, 0.15);
          border-top-color: #ec5b13;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .event-type-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #fff;
          border-radius: 12px;
          border-left: 5px solid #ec5b13;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .event-type-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .event-type-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #1e293b;
          margin: 4px 0 0;
        }
        .event-guest-count {
          text-align: right;
        }
        .event-guest-num {
          display: block;
          font-size: 2rem;
          font-weight: 900;
          color: #ec5b13;
          line-height: 1;
        }
        .event-guest-unit {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 600;
        }
        .event-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 480px) {
          .event-info-grid { grid-template-columns: 1fr; }
        }
        .event-info-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
        }
        .event-section-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .event-section-title i {
          color: #ec5b13;
        }
        .event-section-count {
          margin-left: auto;
          background: #e2e8f0;
          color: #64748b;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          text-transform: none;
          letter-spacing: 0;
        }
        .event-info-rows { display: flex; flex-direction: column; gap: 8px; }
        .event-info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .event-info-label {
          font-size: 0.78rem;
          color: #94a3b8;
          font-weight: 600;
          white-space: nowrap;
        }
        .event-info-value {
          font-size: 0.85rem;
          color: #1e293b;
          font-weight: 700;
          text-align: right;
        }
        .event-note-section {
          background: #fefce8;
          border: 1px solid #fef08a;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .event-note-section .event-section-title { color: #854d0e; }
        .event-note-section .event-section-title i { color: #ca8a04; }
        .event-note-text {
          font-size: 0.85rem;
          color: #713f12;
          margin: 0;
          line-height: 1.5;
        }
        .event-menu-section,
        .event-service-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .event-menu-list,
        .event-service-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .event-menu-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .event-menu-item-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .event-menu-item-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
        }
        .event-menu-item-qty {
          background: #f1f5f9;
          color: #64748b;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .event-menu-item-price {
          font-size: 0.85rem;
          font-weight: 800;
          color: #ec5b13;
        }
        .event-menu-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px dashed #e2e8f0;
          font-weight: 700;
          font-size: 0.85rem;
          color: #64748b;
        }
        .event-menu-total-price {
          color: #ec5b13;
          font-size: 1rem;
        }
        .event-service-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #fff;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
        }
        .event-service-price {
          margin-left: auto;
          font-weight: 800;
          color: #64748b;
          font-size: 0.8rem;
        }
        .event-budget-section {
          background: #fff;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
        }
        .event-budget-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .event-budget-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
        }
        .event-budget-value {
          font-size: 1.2rem;
          font-weight: 900;
          color: #ec5b13;
        }
        .event-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }
        .event-modal-btn {
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .event-modal-btn-close {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .event-modal-btn-close:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default EventOrderDetailModal;
