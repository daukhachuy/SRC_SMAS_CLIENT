import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Percent,
  CreditCard,
  Banknote,
  Wallet,
  CheckCircle
} from 'lucide-react';
import '../styles/PaymentModal.css';

function PaymentModal({ isOpen, onClose, orderData }) {
  const [discountCode, setDiscountCode] = useState('GIAM30K');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountApplied, setDiscountApplied] = useState(true);

  if (!isOpen) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('₫', 'đ');
  };

  const menuItems = orderData?.items || [];
  const subtotal = orderData?.subtotal || 1250000;
  const discount = orderData?.discount || 0;
  const fixedDiscount = 30000;
  const total = subtotal - discount - fixedDiscount;

  const handleApplyCode = () => {
    if (discountCode) {
      setDiscountApplied(true);
    }
  };

  const handlePayment = () => {
    console.log('Payment processed with method:', paymentMethod);
    onClose();
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-header-content">
            <div>
              <h1 className="payment-modal-title">Chi tiết đơn hàng</h1>
              <div className="payment-modal-order-info">
                <span className="payment-modal-order-code">#ORD-20231024</span>
                <span className="payment-modal-order-separator">•</span>
                <p className="payment-modal-table-info">Bàn số 12 - Tầng 1</p>
              </div>
            </div>
            <button className="payment-modal-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="payment-modal-body">
          {/* Left Column - Order Items */}
          <div className="payment-modal-left-column">
            <div className="payment-modal-section">
              <h2 className="payment-modal-section-title">
                <DollarSign size={18} />
                Danh sách món đã gọi
              </h2>
              <div className="payment-modal-items-table">
                <table className="payment-modal-table">
                  <thead>
                    <tr>
                      <th>Tên món</th>
                      <th className="text-center">SL</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="payment-modal-item-info">
                            <span className="payment-modal-item-name">{item.name}</span>
                            <span className="payment-modal-item-note">
                              {item.note !== '-' && `Ghi chú: ${item.note}`}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right payment-modal-item-total">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="payment-modal-summary">
              <div className="payment-modal-summary-row">
                <span>Tạm tính:</span>
                <span className="payment-modal-summary-value">{formatCurrency(subtotal)}</span>
              </div>
              <div className="payment-modal-summary-row">
                <span>Giảm giá (10%):</span>
                <span className="payment-modal-summary-discount">{formatCurrency(discount)}</span>
              </div>
              <div className="payment-modal-summary-row">
                <span>Mã giảm giá (GIAM30K):</span>
                <span className="payment-modal-summary-discount">{formatCurrency(fixedDiscount)}</span>
              </div>
              <div className="payment-modal-summary-total">
                <span>Tổng thanh toán:</span>
                <span className="payment-modal-total-amount">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Discount & Payment */}
          <div className="payment-modal-right-column">
            {/* Discount Code Section */}
            <div className="payment-modal-section">
              <h3 className="payment-modal-section-title">
                <Percent size={18} />
                Áp dụng mã giảm giá
              </h3>
              <div className="payment-modal-discount-input">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="payment-modal-input"
                />
                <button className="payment-modal-apply-btn" onClick={handleApplyCode}>
                  Áp dụng
                </button>
              </div>
              {discountApplied && (
                <div className="payment-modal-discount-success">
                  <CheckCircle size={14} />
                  <p>Giảm giá mã ưu đãi: {formatCurrency(fixedDiscount)}</p>
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="payment-modal-section">
              <h3 className="payment-modal-section-title">
                <CreditCard size={18} />
                Phương thức thanh toán
              </h3>
              <div className="payment-modal-payment-methods">
                {/* Cash */}
                <label className={`payment-modal-method ${paymentMethod === 'cash' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="payment-modal-radio"
                  />
                  <div className="payment-modal-method-icon">
                    <Banknote size={20} />
                  </div>
                  <div className="payment-modal-method-info">
                    <p className="payment-modal-method-name">Tiền mặt</p>
                    <p className="payment-modal-method-desc">Thanh toán trực tiếp</p>
                  </div>
                </label>

                {/* Bank Transfer */}
                <label className={`payment-modal-method ${paymentMethod === 'bank' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="payment-modal-radio"
                  />
                  <div className="payment-modal-method-icon">
                    <CreditCard size={20} />
                  </div>
                  <div className="payment-modal-method-info">
                    <p className="payment-modal-method-name">Chuyển khoản</p>
                    <p className="payment-modal-method-desc">Quét mã QR ngân hàng</p>
                  </div>
                </label>

                {/* E-Wallet */}
                <label className={`payment-modal-method ${paymentMethod === 'ewallet' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="ewallet"
                    checked={paymentMethod === 'ewallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="payment-modal-radio"
                  />
                  <div className="payment-modal-method-icon">
                    <Wallet size={20} />
                  </div>
                  <div className="payment-modal-method-info">
                    <p className="payment-modal-method-name">Ví điện tử</p>
                    <p className="payment-modal-method-desc">Momo, ZaloPay, ShopeePay</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="payment-modal-actions">
              <div className="payment-modal-total-display">
                <p className="payment-modal-total-label">Tổng cộng</p>
                <span className="payment-modal-total-price">{formatCurrency(total)}</span>
              </div>
              <button className="payment-modal-complete-btn" onClick={handlePayment}>
                <CheckCircle size={18} />
                Hoàn tất thanh toán
              </button>
              <button className="payment-modal-print-btn">In hóa đơn tạm tính</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
