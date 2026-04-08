import React from 'react';
import { 
  X, 
  ShoppingBag, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Utensils, 
  ChevronRight,
  Info
} from 'lucide-react';
import '../styles/OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  // Chuyển ISO UTC → giờ Việt Nam (UTC+7)
  const toVietnamTime = (isoStr) => {
    if (!isoStr) return null;
    const m = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!m) {
      const d = new Date(isoStr);
      return isNaN(d.getTime()) ? null : d;
    }
    const [, y, mo, d, h, mi, s] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h) + 7, Number(mi), Number(s));
  };

  const fmtVN = (date) => {
    if (!date) return '—';
    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Xử lý dữ liệu hiển thị
  const items = order.items || [];
  const orderDate = fmtVN(toVietnamTime(order.createdAt));

  const getStatusClass = (status) => {
    const s = status?.toLowerCase();
    if (s === 'pending' || s === 'chờ') return 'od-status-orange';
    if (s === 'shipping' || s === 'đang giao') return 'od-status-blue';
    if (s === 'completed' || s === 'xong' || s === 'thành công') return 'od-status-green';
    return 'od-status-gray';
  };

  return (
    <div className="od-modal-overlay" onClick={(e) => e.target.className === 'od-modal-overlay' && onClose()}>
      <div className="od-modal-container">
        
        {/* HEADER SECTION */}
        <div className="od-modal-header">
          <div className="od-header-main">
            <div className="od-icon-wrapper">
              <ShoppingBag size={24} />
            </div>
            <div className="od-title-area">
              <div className="od-title-row">
                <h2 className="od-modal-title">Chi tiết đơn hàng</h2>
                <span className={`od-status-badge ${getStatusClass(order.status)}`}>
                  {order.status || 'Đang xử lý'}
                </span>
              </div>
              <p className="od-subtitle">Mã đơn: <strong>#{order.orderCode}</strong></p>
            </div>
          </div>
          <button className="od-close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* BODY SECTION */}
        <div className="od-modal-body">
          
          {/* CỘT TRÁI: DANH SÁCH MÓN & TỔNG TIỀN */}
          <div className="od-content-left">
            <div className="od-section">
              <h3 className="od-section-label">
                <Utensils size={18} /> Món ăn đã đặt
              </h3>
              <div className="od-table-container">
                <table className="od-items-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th className="text-center">SL</th>
                      <th className="text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="od-item-info">
                            <span className="od-item-name">{item.itemName}</span>
                            <span className="od-item-unit">{item.unitPrice?.toLocaleString()}đ</span>
                          </div>
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right od-item-price">
                          {(item.quantity * item.unitPrice).toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="od-billing-card">
              <div className="od-billing-row">
                <span>Tạm tính</span>
                <span>{order.totalAmount?.toLocaleString()}đ</span>
              </div>
              <div className="od-billing-row">
                <span>Phí vận chuyển</span>
                <span>+0đ</span>
              </div>
              <div className="od-billing-total">
                <span className="od-total-label">TỔNG CỘNG</span>
                <span className="od-total-amount">{order.totalAmount?.toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN GIAO NHẬN */}
          <div className="od-content-right">
            <div className="od-section">
              <h3 className="od-section-label">Thông tin giao nhận</h3>
              <div className="od-details-list">
                <div className="od-detail-item">
                  <User size={16} className="od-detail-icon" />
                  <div className="od-detail-text">
                    <label>Khách hàng</label>
                    <p>{order.delivery?.recipientName || order.customer?.fullname || 'Khách hàng'}</p>
                  </div>
                </div>
                <div className="od-detail-item">
                  <Phone size={16} className="od-detail-icon" />
                  <div className="od-detail-text">
                    <label>Số điện thoại</label>
                    <p>{order.delivery?.phone || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                <div className="od-detail-item">
                  <MapPin size={16} className="od-detail-icon" />
                  <div className="od-detail-text">
                    <label>Địa chỉ nhận</label>
                    <p className="od-address-text">{order.delivery?.address || 'Tại nhà hàng'}</p>
                  </div>
                </div>
                <div className="od-detail-item">
                  <Calendar size={16} className="od-detail-icon" />
                  <div className="od-detail-text">
                    <label>Thời gian đặt</label>
                    <p>{orderDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="od-note-box">
              <div style={{ display: 'flex', gap: '8px', color: '#64748b' }}>
                <Info size={16} />
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                  Bạn chỉ có thể đánh giá dịch vụ sau khi đơn hàng đã được giao và thanh toán thành công.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="od-modal-footer">
          <button className="od-btn-secondary" onClick={onClose}>Đóng</button>
          <button className="od-btn-primary" onClick={onClose}>
            Xác nhận <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailModal;