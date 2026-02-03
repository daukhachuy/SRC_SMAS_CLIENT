import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Cart.css';

const Cart = () => {
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState('GIAM50K');

  const [items, setItems] = useState(
    Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      name: 'Tôm hùm nướng phô mai',
      price: 350000,
      qty: 1,
      note: 'Ghi chú: ít cay',
      img: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?q=80&w=200'
    }))
  );

  return (
    <div className="cart-page">
      <Header />
      
      <div className="cart-container">
        <section className="cart-section">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Tên món</th>
                <th>Số lượng</th>
                <th>Giá</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="item-info">
                    <img src={item.img} alt={item.name} />
                    <div>
                      <h4>{item.name}</h4>
                      <p className="item-price-small">{item.price.toLocaleString()}đ</p>
                      <p className="item-note">📝 {item.note}</p>
                    </div>
                  </td>
                  <td>
                    <div className="quantity-control">
                      <button>-</button>
                      <span>{item.qty}</span>
                      <button>+</button>
                    </div>
                  </td>
                  <td className="item-total-price">{(item.price * item.qty).toLocaleString()}đ</td>
                  <td>
                    <div className="action-btns">
                      <button className="edit-btn">⚙️</button>
                      <button className="remove-btn">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="cart-pagination">
            <div className="show-limit">
              Hiển thị <select><option>12</option></select> mục
            </div>
            <div className="page-numbers">
              <button>❮</button>
              <button className="active">1</button>
              <button>2</button>
              <button>❯</button>
            </div>
          </div>
        </section>

        <section className="order-summary-box">
          <h2 className="summary-title">Tóm tắt đơn hàng</h2>
          
          <div className="summary-grid">
            <div className="bill-detail">
              <div className="restaurant-info">
                <h3>Nhà Hàng Lẩu Nướng</h3>
                <p>📍 42 Trần Thủ Độ, Điện Bàn Đông, Đà Nẵng</p>
              </div>
              <div className="bill-rows">
                <div className="row"><span>Tạm tính:</span> <span>1,400,000đ</span></div>
                <div className="row"><span>Phí giao hàng:</span> <span>30,000đ</span></div>
                <div className="row discount-text"><span>Giảm giá Voucher:</span> <span>-50,000đ</span></div>
                <div className="row total-row"><span>Tổng</span> <span>1,380,000đ</span></div>
              </div>
              <div className="customer-info">
                <p>👤 <strong>Nguyen Van A</strong> - 012345678</p>
                <p>🏠 42 Trần Thủ Độ, phường điện bàn đông, đà nẵng</p>
              </div>
            </div>

            <div className="payment-selection">
              {/* VOUCHER STYLE SHOPEE */}
              <div className="shopee-voucher-selector" onClick={() => setIsVoucherModalOpen(true)}>
                <div className="v-left">
                  <span className="v-icon">🎟️</span>
                  <span className="v-label">Voucher nhà hàng</span>
                </div>
                <div className="v-right">
                  <span className="v-code-selected">{selectedVoucher ? `Mã: ${selectedVoucher}` : "Chọn hoặc nhập mã"}</span>
                  <span className="v-arrow">❯</span>
                </div>
              </div>
              
              <h4 className="payment-title">Phương thức thanh toán</h4>
              <div className="payment-methods">
                <div className="method-item active">💵 Tiền Mặt</div>
                <div className="method-item">🏦 VietQR</div>
                <div className="method-item">💳 VNPAY</div>
                <div className="method-item">📱 Ví App</div>
              </div>

              <button className="btn-order-now">Đặt ngay</button>
              <p className="tax-note">Cần hóa đơn đỏ? <a href="#">Xuất hóa đơn VAT</a></p>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL CHỌN VOUCHER (SHOPEE STYLE) */}
      {isVoucherModalOpen && (
        <div className="modal-overlay" onClick={() => setIsVoucherModalOpen(false)}>
          <div className="voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="v-modal-header">
              <h3>Chọn Voucher</h3>
              <button className="v-close" onClick={() => setIsVoucherModalOpen(false)}>✕</button>
            </div>
            <div className="v-modal-search">
              <input type="text" placeholder="Mã Voucher nhà hàng" />
              <button disabled>ÁP DỤNG</button>
            </div>
            <div className="v-modal-list">
              {[1, 2, 3].map((v) => (
                <div className="v-card" key={v}>
                  <div className="v-card-left">Luxury</div>
                  <div className="v-card-right">
                    <div className="v-info">
                      <p className="v-main">Giảm 50.000đ</p>
                      <p className="v-sub">Đơn tối thiểu 500k</p>
                      <p className="v-expiry">HSD: 31.12.2025</p>
                    </div>
                    <div className="v-radio">
                      <input type="radio" name="v-choice" defaultChecked={v === 1} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="v-modal-footer">
              <button className="v-btn-confirm" onClick={() => setIsVoucherModalOpen(false)}>XÁC NHẬN</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Cart;