import React, { useState, useEffect } from 'react';
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
import { orderAPI } from '../../api/managerApi';
import '../../styles/DineInOrderDetailPage.css';

function DineInOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get order ID from URL
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);


  // Decode the ID if it contains encoded characters
  const orderId = id ? decodeURIComponent(id) : null;
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    orderAPI.getByCode(orderId)
      .then(res => {
        // Nếu API trả về .data.data thì lấy sâu vào, còn không thì lấy .data
        const data = res?.data?.data || res?.data || res;
        setOrderData(data);
      })
      .catch(err => {
        setError('Không thể tải chi tiết đơn hàng.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

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

  if (loading) {
    return <div className="dinein-detail-page-wrapper"><div style={{padding: 40, textAlign: 'center'}}>Đang tải chi tiết đơn hàng...</div></div>;
  }
  if (error) {
    return <div className="dinein-detail-page-wrapper"><div style={{padding: 40, color: 'red', textAlign: 'center'}}>{error}</div></div>;
  }
  if (!orderData) {
    return <div className="dinein-detail-page-wrapper"><div style={{padding: 40, color: 'red', textAlign: 'center'}}>Không có dữ liệu đơn hàng.</div></div>;
  }

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
                <h1>Chi tiết đơn hàng {orderData.code || orderData.orderCode || orderId}</h1>
                <span className={`dinein-detail-status-badge status-${orderData.statusClass || orderData.status || ''}`}>
                  {orderData.status || '---'}
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
                  {orderData.items?.length || 0} Món • {(orderData.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)} Phần
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
                    {(orderData.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="dinein-detail-item-name">{item.name || item.foodName}</td>
                        <td className="text-right">{formatCurrency(item.unitPrice || item.price || 0)}</td>
                        <td className="text-center font-bold">{item.quantity || 0}</td>
                        <td className="text-right font-black">{formatCurrency(item.totalPrice || (item.price * item.quantity) || 0)}</td>
                        <td className="dinein-detail-item-note">{item.note || ''}</td>
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
                {(orderData.processingStages || []).map((stage, idx) => (
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
                    Ăn tại chỗ - {orderData.tableNumber || orderData.tableName || ''}
                  </span>
                </div>
                <div className="dinein-detail-info-row">
                  <span>Thời gian gọi món</span>
                  <span className="dinein-detail-info-value">{orderData.orderTime || orderData.createdAt || ''}</span>
                </div>
                <div className="dinein-detail-info-row">
                  <span>Nhân viên phục vụ</span>
                  <div className="dinein-detail-waiter-info">
                    <img
                      src={orderData.waiterImage || ''}
                      alt={orderData.waiter || ''}
                      className="dinein-detail-waiter-image"
                    />
                    <span>{orderData.waiter || ''}</span>
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
                  <span className="dinein-detail-payment-value">{formatCurrency(orderData.subtotal || 0)}</span>
                </div>
                <div className="dinein-detail-payment-row">
                  <span>Giảm giá</span>
                  <span className="dinein-detail-payment-discount">{formatCurrency(orderData.discount || 0)}</span>
                </div>
                <div className="dinein-detail-payment-row">
                  <span>Thuế VAT (10%)</span>
                  <span className="dinein-detail-payment-value">{formatCurrency(orderData.tax || 0)}</span>
                </div>
                <div className="dinein-detail-payment-total">
                  <span>Tổng cộng</span>
                  <span className="dinein-detail-total-amount">{formatCurrency(orderData.total || 0)}</span>
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
