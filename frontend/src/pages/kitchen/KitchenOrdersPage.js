import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  PlayCircle,
  Trash2,
  X
} from 'lucide-react';

const KitchenOrdersPage = () => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Mock data cho các đơn hàng
  const orders = useMemo(() => [
    {
      id: 'ORD8821',
      table: 'BÀN 05',
      waitTime: 18,
      status: 'overdue',
      note: 'Dị ứng hải sản - Không tôm',
      items: [
        { id: 1, name: 'Phở bò tái lăn', quantity: 2, note: 'Nhiều hành, ít bánh', status: 'cooking' },
        { id: 2, name: 'Gỏi cuốn tôm thịt', quantity: 1, note: 'KHÔNG TÔM', status: 'pending' }
      ]
    },
    {
      id: 'ORD8824',
      table: 'BÀN 12',
      waitTime: 8,
      status: 'normal',
      note: null,
      items: [
        { id: 3, name: 'Bún chả Hà Nội', quantity: 1, note: null, status: 'cooking' },
        { id: 4, name: 'Nem cua bể', quantity: 1, note: null, status: 'pending' }
      ]
    },
    {
      id: 'ORD8827',
      table: 'BÀN 02',
      waitTime: 3,
      status: 'new',
      note: null,
      items: [
        { id: 5, name: 'Mì Quảng Gà', quantity: 1, note: null, status: 'pending' }
      ]
    },
    {
      id: 'ORD8830',
      table: 'BÀN 08',
      waitTime: 1,
      status: 'new',
      note: null,
      items: [
        { id: 6, name: 'Cơm tấm sườn bì', quantity: 2, note: null, status: 'pending' }
      ]
    }
  ], []);

  const handleCancelItem = (item) => {
    setSelectedItem(item);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy món');
      return;
    }
    console.log('Hủy món:', selectedItem, 'Lý do:', cancelReason);
    setShowCancelModal(false);
    setCancelReason('');
    setSelectedItem(null);
  };

  const handleStartAllItems = (orderId) => {
    console.log('Bắt đầu tất cả món của đơn:', orderId);
  };

  const handleCompleteAllItems = (orderId) => {
    console.log('Hoàn thành tất cả món của đơn:', orderId);
  };

  const getOrderCardClass = (status) => {
    return `kds-order-card ${status === 'overdue' ? 'overdue' : ''}`;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'cooking') return 'cooking';
    if (status === 'pending') return 'pending';
    return '';
  };

  const getWaitTimeClass = (status) => {
    if (status === 'overdue') return 'overdue';
    if (status === 'new') return 'new';
    return 'normal';
  };

  return (
    <div className="kds-orders-container">
      <header className="kds-header">
        <div className="kds-header-left">
          <h2 className="kds-page-title">Điều phối chế biến - Thao tác hàng loạt</h2>
          <div className="kds-status-badge online">
            <span className="status-dot"></span>
            ĐANG TRỰC TUYẾN
          </div>
        </div>
        <div className="kds-header-right">
          <div className="kds-time">
            <Clock size={20} />
            <span>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      <main className="kds-orders-grid">
        {orders.map((order) => (
          <div key={order.id} className={getOrderCardClass(order.status)}>
            <div className={`kds-order-header ${order.status === 'overdue' ? 'overdue' : ''}`}>
              <div className="kds-table-info">
                <span className="kds-table-label">Bàn</span>
                <span className="kds-table-name">{order.table}</span>
              </div>
              <div className="kds-order-info">
                <span className="kds-order-label">Mã đơn</span>
                <span className="kds-order-id">#{order.id}</span>
              </div>
            </div>

            <div className="kds-order-content">
              <div className={`kds-wait-time ${getWaitTimeClass(order.status)}`}>
                <Clock size={16} />
                {order.status === 'new' 
                  ? `MỚI NHẬN - ${order.waitTime} PHÚT`
                  : order.status === 'overdue'
                  ? `ĐÃ CHỜ ${order.waitTime} PHÚT`
                  : `ĐÃ CHỜ ${order.waitTime} PHÚT`
                }
              </div>

              {order.note && (
                <div className="kds-order-note warning">
                  <p className="note-label">Ghi chú</p>
                  <p className="note-content">{order.note}</p>
                </div>
              )}

              <div className="kds-items-list">
                {order.items.map((item) => (
                  <div key={item.id} className={`kds-item ${item.status}`}>
                    <div className="kds-item-info">
                      <span className="kds-item-qty">{item.quantity}x</span>
                      <div>
                        <p className="kds-item-name">{item.name}</p>
                        {item.note && (
                          <p className="kds-item-note">{item.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="kds-item-actions">
                      <span className={`kds-status-badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status === 'cooking' ? 'Đang nấu' : 'Chờ nấu'}
                      </span>
                      <button 
                        className="kds-cancel-btn"
                        onClick={() => handleCancelItem(item)}
                        aria-label="Hủy món"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="kds-order-actions">
              <button 
                className="kds-action-btn start"
                onClick={() => handleStartAllItems(order.id)}
              >
                <PlayCircle size={20} />
                <span>Bắt đầu tất cả</span>
              </button>
              <button 
                className="kds-action-btn complete"
                onClick={() => handleCompleteAllItems(order.id)}
              >
                <CheckCircle size={20} />
                <span>Hoàn thành tất cả</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      <footer className="kds-footer">
        <div className="kds-stats">
          <div className="kds-stat-item">
            <span className="stat-dot overdue"></span>
            <span className="stat-text">Trễ: <strong className="stat-value overdue">1 đơn</strong></span>
          </div>
          <div className="kds-stat-item">
            <span className="stat-dot cooking"></span>
            <span className="stat-text">Đang chế biến: <strong className="stat-value cooking">3 món</strong></span>
          </div>
          <div className="kds-stat-item">
            <span className="stat-dot pending"></span>
            <span className="stat-text">Chờ nấu: <strong className="stat-value pending">8 món</strong></span>
          </div>
        </div>
        <div className="kds-footer-actions">
          <button className="kds-history-btn">
            <Clock size={18} />
            Xem lịch sử
          </button>
        </div>
      </footer>

      {/* Cancel Item Modal */}
      {showCancelModal && (
        <div className="kds-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="kds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header">
              <div className="modal-icon warning">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="kds-modal-title">
                  Xác nhận hủy món: <span className="highlight">{selectedItem?.name}</span>
                </h3>
                <p className="kds-modal-subtitle">Thao tác này không thể hoàn tác</p>
              </div>
            </div>

            <div className="kds-modal-content">
              <div className="kds-modal-warning">
                <p>Bạn có chắc chắn muốn hủy món này khỏi danh sách chế biến của bếp?</p>
              </div>

              <div className="kds-form-group">
                <div className="kds-form-label-row">
                  <label className="kds-form-label">Lý do hủy món</label>
                  <span className="kds-form-required">Bắt buộc</span>
                </div>
                <textarea
                  className="kds-textarea"
                  placeholder="Nhập lý do chi tiết (ví dụ: Hết nguyên liệu bò, Khách báo đổi món, Nhầm đơn hàng...)"
                  rows={5}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>

            <div className="kds-modal-footer">
              <button 
                className="kds-btn secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Quay lại
              </button>
              <button 
                className="kds-btn danger"
                onClick={handleConfirmCancel}
              >
                <CheckCircle size={18} />
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenOrdersPage;
