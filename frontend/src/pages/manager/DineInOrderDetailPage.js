import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import '../../styles/DineInOrderDetailPage.css';

function DineInOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get order ID from URL
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Decode the ID if it contains encoded characters
  const orderId = id ? decodeURIComponent(id) : null;
  console.log('Order ID from URL:', orderId);

  const orderData = {
    code: orderId || '#HD005',
    status: 'Đã đủ món',
    statusClass: 'ready',
    tableNumber: 'Bàn 12',
    floor: 'Tầng 1',
    waiter: 'Nguyễn Thu Hà',
    waiterImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqL3Xa8a5DuLMkaiiB7H46ei7LwQTnLexZILiHxC3buKQvv3GNH-ZZjiZ8mWQLkI1HLr6Dg5nDl0QA_fMk-GcckS3mMIkWeLfh4BTG4Td02nBuhOE2x7J7RkoaypjcLh_dOKkOhTu_Izk3M_uDHrYfPoiL0ZY_mLlNf6pPYcs6KsUVCjDYzfsThCrHjwWWQuXO6Sqyz2H4dzl2PztYaUM6WrRFgAzp9KJzBAzmOpq85e9lU3zZR-cfkw6BfEPmwESnrmU-OSDOXIY',
    orderTime: '20/10/2023 19:30',
    items: [
      {
        name: 'Bò Wagyu Nướng Đá',
        quantity: 1,
        unitPrice: 450000,
        totalPrice: 450000,
        note: 'Chín vừa (Medium)'
      },
      {
        name: 'Sashimi Cá Hồi Tươi',
        quantity: 2,
        unitPrice: 280000,
        totalPrice: 560000,
        note: '-'
      },
      {
        name: 'Salad Hoàng Gia',
        quantity: 1,
        unitPrice: 120000,
        totalPrice: 120000,
        note: 'Ít sốt'
      },
      {
        name: 'Rượu Vang Đỏ (Ly)',
        quantity: 2,
        unitPrice: 60000,
        totalPrice: 120000,
        note: '-'
      }
    ],
    processingStages: [
      { label: 'Mới nhận', time: '19:30:15', completed: true },
      { label: 'Chế biến', time: '19:35:40', completed: true },
      { label: 'Đủ món', time: '19:55:22', completed: true },
      { label: 'Thanh toán', time: null, completed: false }
    ],
    subtotal: 1250000,
    discount: 0,
    tax: 125000,
    total: 1375000,
    customerNote: 'Hôm nay là kỷ niệm ngày cưới, vui lòng trang trí bàn nhẹ nhàng giúp mình nhé.'
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
    <div className="dinein-detail-page-wrapper">
      {/* Header */}
      <header className="dinein-detail-header">
        <div className="dinein-detail-header-content">
          <div className="dinein-detail-header-left">
            <button className="dinein-detail-back-btn" onClick={handleGoBack}>
              <ArrowLeft size={18} />
              <span>Quay lại</span>
            </button>
            <div className="dinein-detail-divider"></div>
            <div>
              <div className="dinein-detail-title-group">
                <h1>Chi tiết đơn hàng {orderData.code}</h1>
                <span className={`dinein-detail-status-badge status-${orderData.statusClass}`}>
                  {orderData.status}
                </span>
              </div>
            </div>
          </div>
          <div className="dinein-detail-header-actions">
            <button className="dinein-detail-icon-btn">
              <Printer size={18} />
            </button>
            <button className="dinein-detail-icon-btn">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dinein-detail-main">
        <div className="dinein-detail-container">
          {/* Left Column */}
          <div className="dinein-detail-left-column">
            {/* Menu Items Section */}
            <div className="dinein-detail-card">
              <div className="dinein-detail-card-header">
                <h3 className="dinein-detail-card-title">
                  <UtensilsCrossed size={18} />
                  Danh sách món ăn
                </h3>
                <span className="dinein-detail-items-count">
                  {orderData.items.length} Món • {orderData.items.reduce((sum, item) => sum + item.quantity, 0)} Phần
                </span>
              </div>
              <div className="dinein-detail-table-wrapper">
                <table className="dinein-detail-table">
                  <thead>
                    <tr>
                      <th>Tên món</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-right">Thành tiền</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="dinein-detail-item-name">{item.name}</td>
                        <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-center font-bold">{item.quantity}</td>
                        <td className="text-right font-black">{formatCurrency(item.totalPrice)}</td>
                        <td className="dinein-detail-item-note">{item.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="dinein-detail-table-footer">
                <button className="dinein-detail-add-item-btn">
                  + Thêm món mới
                </button>
              </div>
            </div>

            {/* Processing Stages */}
            <div className="dinein-detail-card">
              <h3 className="dinein-detail-card-title">
                <Clock size={18} />
                Trạng thái chế biến
              </h3>
              <div className="dinein-detail-stages">
                {orderData.processingStages.map((stage, idx) => (
                  <div
                    key={idx}
                    className={`dinein-detail-stage ${stage.completed ? 'completed' : 'pending'}`}
                  >
                    <p className="dinein-detail-stage-label">{stage.label}</p>
                    <p className="dinein-detail-stage-time">
                      {stage.time || '--:--'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dinein-detail-right-column">
            {/* General Info */}
            <div className="dinein-detail-card">
              <h3 className="dinein-detail-card-title">
                <FileText size={18} />
                Thông tin chung
              </h3>
              <div className="dinein-detail-info-group">
                <div className="dinein-detail-info-row">
                  <span>Loại đơn</span>
                  <span className="dinein-detail-info-value">
                    Ăn tại chỗ - {orderData.tableNumber}
                  </span>
                </div>
                <div className="dinein-detail-info-row">
                  <span>Thời gian gọi món</span>
                  <span className="dinein-detail-info-value">{orderData.orderTime}</span>
                </div>
                <div className="dinein-detail-info-row">
                  <span>Nhân viên phục vụ</span>
                  <div className="dinein-detail-waiter-info">
                    <img
                      src={orderData.waiterImage}
                      alt={orderData.waiter}
                      className="dinein-detail-waiter-image"
                    />
                    <span>{orderData.waiter}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="dinein-detail-card">
              <h3 className="dinein-detail-card-title">
                <DollarSign size={18} />
                Tóm tắt thanh toán
              </h3>
              <div className="dinein-detail-payment-summary">
                <div className="dinein-detail-payment-row">
                  <span>Tạm tính</span>
                  <span className="dinein-detail-payment-value">{formatCurrency(orderData.subtotal)}</span>
                </div>
                <div className="dinein-detail-payment-row">
                  <span>Giảm giá</span>
                  <span className="dinein-detail-payment-discount">{formatCurrency(orderData.discount)}</span>
                </div>
                <div className="dinein-detail-payment-row">
                  <span>Thuế VAT (10%)</span>
                  <span className="dinein-detail-payment-value">{formatCurrency(orderData.tax)}</span>
                </div>
                <div className="dinein-detail-payment-total">
                  <span>Tổng cộng</span>
                  <span className="dinein-detail-total-amount">{formatCurrency(orderData.total)}</span>
                </div>
              </div>
              <div className="dinein-detail-payment-buttons">
                <button className="dinein-detail-secondary-btn">
                  <Printer size={16} />
                  In hóa đơn
                </button>
                <button className="dinein-detail-secondary-btn">
                  <Edit size={16} />
                  Chỉnh sửa
                </button>
              </div>
              <button
                className="dinein-detail-primary-btn"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                THANH TOÁN
              </button>
            </div>

            {/* Customer Note */}
            {orderData.customerNote && (
              <div className="dinein-detail-customer-note">
                <p className="dinein-detail-note-label">Ghi chú từ khách hàng</p>
                <p className="dinein-detail-note-text">"{orderData.customerNote}"</p>
              </div>
            )}
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

export default DineInOrderDetailPage;
