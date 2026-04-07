import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Share2,
  UtensilsCrossed,
  Clock,
  DollarSign,
  FileText,
  Edit,
} from 'lucide-react';
import PaymentModal from '../../components/PaymentModal';
import '../../styles/TakeawayOrderDetailPage.css';

function TakeawayOrderDetailPage() {
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const orderData = {
    code: '#MV004',
    status: 'Sẵn sàng',
    statusClass: 'ready',
    customerName: 'Chị Lan',
    phone: '0912 345 678',
    orderTime: '20/10/2023 14:30',
    pickupTime: '20/10/2023 15:00',
    items: [
      {
        name: 'Cơm Tấm Sườn Nướng',
        quantity: 2,
        unitPrice: 75000,
        totalPrice: 150000,
        note: 'Thêm nước mắm'
      },
      {
        name: 'Salad Tofu',
        quantity: 1,
        unitPrice: 45000,
        totalPrice: 45000,
        note: 'Ít dầu'
      },
      {
        name: 'Nước Cam Ép',
        quantity: 2,
        unitPrice: 15000,
        totalPrice: 30000,
        note: '-'
      }
    ],
    processingStages: [
      { label: 'Mới nhận', time: '14:30:15', completed: true },
      { label: 'Chế biến', time: '14:40:22', completed: true },
      { label: 'Sẵn sàng', time: '14:58:45', completed: true },
      { label: 'Giao hàng', time: null, completed: false }
    ],
    subtotal: 225000,
    discount: 0,
    tax: 0,
    total: 225000,
    customerNote: 'Vui lòng để thêm nước chanh ngoài, cháy lửa một chút nhé.'
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('₫', 'đ');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="takeaway-detail-page-wrapper">
      {/* Header */}
      <header className="takeaway-detail-header">
        <div className="takeaway-detail-header-content">
          <div className="takeaway-detail-header-left">
            <button className="takeaway-detail-back-btn" onClick={handleGoBack}>
              <ArrowLeft size={18} />
              <span>Quay lại</span>
            </button>
            <div className="takeaway-detail-divider"></div>
            <div>
              <div className="takeaway-detail-title-group">
                <h1>Chi tiết đơn hàng {orderData.code}</h1>
                <span className={`takeaway-detail-status-badge status-${orderData.statusClass}`}>
                  {orderData.status}
                </span>
              </div>
            </div>
          </div>
          <div className="takeaway-detail-header-actions">
            <button className="takeaway-detail-action-btn secondary">
              <Printer size={18} />
            </button>
            <button className="takeaway-detail-action-btn secondary">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="takeaway-detail-main">
        <div className="takeaway-detail-container">
          {/* Left Column */}
          <div className="takeaway-detail-left">
            {/* Menu Items Section */}
            <div className="takeaway-detail-card">
              <h3 className="takeaway-detail-card-title">
                <UtensilsCrossed size={18} />
                Danh sách món ăn
              </h3>
              <table className="takeaway-menu-table">
                <thead>
                  <tr>
                    <th>Tên món</th>
                    <th>Đơn giá</th>
                    <th>Số lượng</th>
                    <th>Thành tiền</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="takeaway-menu-item-name">{item.name}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.totalPrice)}</td>
                      <td className="takeaway-menu-item-note">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Customer Info */}
            <div className="takeaway-detail-card">
              <h3 className="takeaway-detail-card-title">
                <FileText size={18} />
                Thông tin khách hàng
              </h3>
              <div className="takeaway-info-grid">
                <div className="takeaway-info-item">
                  <span className="takeaway-info-label">Khách hàng</span>
                  <span className="takeaway-info-value">{orderData.customerName}</span>
                </div>
                <div className="takeaway-info-item">
                  <span className="takeaway-info-label">Số điện thoại</span>
                  <span className="takeaway-info-value">{orderData.phone}</span>
                </div>
                <div className="takeaway-info-item">
                  <span className="takeaway-info-label">Thời gian gọi</span>
                  <span className="takeaway-info-value">{orderData.orderTime}</span>
                </div>
                <div className="takeaway-info-item">
                  <span className="takeaway-info-label">Dự kiến lấy</span>
                  <span className="takeaway-info-value">{orderData.pickupTime}</span>
                </div>
              </div>
              {orderData.customerNote && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <span className="takeaway-info-label">Ghi chú</span>
                  <p style={{ marginTop: '0.5rem', color: '#0f172a' }}>"{orderData.customerNote}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="takeaway-detail-right">
            {/* Processing Timeline */}
            <div className="takeaway-detail-card">
              <h3 className="takeaway-detail-card-title">
                <Clock size={18} />
                Trạng thái chế biến
              </h3>
              <div className="takeaway-timeline">
                {orderData.processingStages.map((stage, idx) => (
                  <div
                    key={idx}
                    className={`takeaway-timeline-item ${stage.completed ? 'completed' : 'pending'}`}
                  >
                    <div className="takeaway-timeline-icon">
                      <Clock size={16} />
                    </div>
                    <div className="takeaway-timeline-content">
                      <p className="takeaway-timeline-title">{stage.label}</p>
                      <p className="takeaway-timeline-time">
                        {stage.time || 'Chưa hoàn thành'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="takeaway-detail-card">
              <h3 className="takeaway-detail-card-title">
                <DollarSign size={18} />
                Tóm tắt thanh toán
              </h3>
              <div className="takeaway-payment-rows">
                <div className="takeaway-payment-row">
                  <span className="takeaway-payment-label">Tạm tính</span>
                  <span className="takeaway-payment-value">{formatCurrency(orderData.subtotal)}</span>
                </div>
                <div className="takeaway-payment-row">
                  <span className="takeaway-payment-label">Giảm giá</span>
                  <span className="takeaway-payment-value">{formatCurrency(orderData.discount)}</span>
                </div>
              </div>
              <div className="takeaway-payment-total">
                <span className="takeaway-payment-total-label">Tổng cộng</span>
                <span className="takeaway-payment-total-value">{formatCurrency(orderData.total)}</span>
              </div>
              <button
                className="takeaway-payment-btn"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                THANH TOÁN
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderData={orderData}
      />
    </div>
  );
}

export default TakeawayOrderDetailPage;
