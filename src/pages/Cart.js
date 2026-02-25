import React, { useState } from 'react';
import Header from '../components/Header'; 
import Footer from '../components/Footer'; 
import '../styles/Cart.css';

const Cart = () => {
  // --- CODE CŨ CỦA BẠN (GIỮ NGUYÊN) ---
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Tôm hùm nướng phô mai', price: 350000, quantity: 1, note: 'Ghi chú: ít cay', image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Cua hoàng đế hấp', price: 1200000, quantity: 1, note: '', image: 'https://via.placeholder.com/150' },
    { id: 3, name: 'Lẩu hải sản đặc biệt', price: 550000, quantity: 1, note: '', image: 'https://via.placeholder.com/150' },
  ]);

  const [showInfoModal, setShowInfoModal] = useState(false);

  const increaseQty = (id) => {
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decreaseQty = (id) => {
    setCartItems(cartItems.map(item => 
      item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    ));
  };

  const removeItem = (id) => {
    if(window.confirm("Bạn có chắc chắn muốn xóa món này?")) {
      setCartItems(cartItems.filter(item => item.id !== id));
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // --- CODE MỚI THÊM VÀO ---
  const [modalStep, setModalStep] = useState(1); // Bước 1: Thông tin, Bước 2: Tóm tắt
  const [paymentMethod, setPaymentMethod] = useState('Tiền Mặt');

  const handleCloseModal = () => {
    setShowInfoModal(false);
    setModalStep(1); // Reset về bước 1 khi đóng
  };

  return (
    <div className="Cart-Page-Wrapper">
      <Header />
      <div className="header-spacer"></div>

      <main className="Cart-Main-Content">
        <div className="Cart-Container">
          <h1 className="Page-Title">Giỏ Hàng Của Tôi</h1>

          <div className="Cart-Table-Card">
            <table className="Cart-Table">
              <thead>
                <tr>
                  <th>Tên món</th>
                  <th>Số lượng</th>
                  <th>Giá</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="Item-Info">
                          <img src={item.image} alt={item.name} className="Item-Img" />
                          <div className="Item-Text">
                            <div className="Item-Name">{item.name}</div>
                            {item.note && <div className="Item-Note">{item.note}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="Quantity-Control">
                          <button className="Qty-Btn" onClick={() => decreaseQty(item.id)}>-</button>
                          <input type="text" value={item.quantity} readOnly />
                          <button className="Qty-Btn" onClick={() => increaseQty(item.id)}>+</button>
                        </div>
                      </td>
                      <td>
                        <div className="Item-Price">{(item.price * item.quantity).toLocaleString()}đ</div>
                      </td>
                      <td>
                        <div className="Action-Icons">
                          <i className="fa-regular fa-note-sticky note-icon" title="Sửa ghi chú"></i>
                          <i className="fa-regular fa-circle-xmark delete-icon" title="Xóa món" onClick={() => removeItem(item.id)}></i>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="Empty-Cart-Msg">
                      Giỏ hàng của bạn đang trống. <a href="/menu">Quay lại thực đơn</a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Phân trang (Giữ nguyên của bạn) */}
            <div className="Cart-Pagination">
              <span>Hiển thị: <strong>12</strong> <i className="fa-solid fa-chevron-down"></i></span>
              <span>Tổng <strong>{cartItems.length}</strong></span>
              <div className="Page-Numbers">
                <button className="Active">1</button>
                <button>2</button>
                <button>3</button>
                <span>...</span>
                <button>5</button>
              </div>
            </div>
          </div>

          <div className="Cart-Summary-Card">
            <div className="Summary-Left">
              <div className="Sum-Item">Tất cả : <strong>{cartItems.length} Món</strong></div>
              <div className="Sum-Item">Tạm tính : <strong>{totalPrice.toLocaleString()} đ</strong></div>
              <div className="Sum-Item">Tiền cọc : <strong>{totalPrice > 5000000 ? (totalPrice * 0.3).toLocaleString() : 0} đ</strong></div>
            </div>
            <div className="Summary-Right">
              <p className="Deposit-Policy">Đơn có giá trên 5 triệu chúng tôi xin thu phí cọc 30% cho đơn hàng</p>
              <button className="Btn-Order-Now" onClick={() => setShowInfoModal(true)}>Đặt ngay</button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL ĐA BƯỚC */}
      {showInfoModal && (
        <div className="Modal-Overlay" onClick={handleCloseModal}>
          <div className={`Info-Modal-Box ${modalStep === 2 ? 'summary-modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            {/* Nút quay lại chỉ hiện ở bước 2 */}
            {modalStep === 2 && (
              <button className="Back-Btn" onClick={() => setModalStep(1)}>
                <i className="fa-solid fa-chevron-left"></i> Quay lại
              </button>
            )}

            <div className="Modal-Header">
              <h3>{modalStep === 1 ? "Thông tin giao hàng" : "Tóm tắt đơn hàng"}</h3>
              <button className="Close-Modal-Btn" onClick={handleCloseModal}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>

            <div className="Modal-Body">
              {modalStep === 1 ? (
                /* BƯỚC 1: NHẬP THÔNG TIN (Code cũ của bạn) */
                <>
                  <div className="Input-Row">
                    <div className="Input-Group flex-1">
                      <label>SĐT :</label>
                      <div className="Input-With-Icon">
                        <i className="fa-solid fa-phone orange-icon"></i>
                        <input type="text" placeholder="Nhập số điện thoại..." />
                        <i className="fa-solid fa-magnifying-glass search-icon"></i>
                      </div>
                    </div>
                    <div className="Input-Group flex-1">
                      <label>Tên :</label>
                      <input type="text" placeholder="Nhập tên khách hàng..." />
                    </div>
                  </div>
                  <div className="Input-Group">
                    <label>Địa chỉ :</label>
                    <input type="text" placeholder="Nhập địa chỉ giao hàng..." />
                  </div>
                  <div className="Input-Group">
                    <label>Ghi chú :</label>
                    <textarea rows="3" placeholder="Ghi chú cho nhà hàng..."></textarea>
                  </div>
                  <button className="Btn-Confirm-Order" onClick={() => setModalStep(2)}>Xác Nhận</button>
                </>
              ) : (
                /* BƯỚC 2: TÓM TẮT ĐƠN HÀNG (Phần mới thêm) */
                <div className="Summary-Main-Layout">
                  {/* Cột trái: Chi tiết Bill */}
                  <div className="Summary-Bill-Detail">
                    <div className="Bill-Brand">NHÀ HÀNG LẨU NƯỚNG</div>
                    <p className="Bill-Address">42 Trần Thủ Độ, Điện Bàn, Đà Nẵng</p>
                    <div className="Bill-Divider"></div>
                    <div className="Bill-Row"><span>Tạm tính:</span> <span>{totalPrice.toLocaleString()}đ</span></div>
                    <div className="Bill-Row"><span>Phí giao hàng:</span> <span>0đ</span></div>
                    <div className="Bill-Row"><span>Giảm giá:</span> <span className="text-red">-50.000đ</span></div>
                    <div className="Bill-Row"><span>VAT (0%):</span> <span>0đ</span></div>
                    <div className="Bill-Divider"></div>
                    <div className="Bill-Total"><span>Tổng:</span> <span>{(totalPrice - 50000).toLocaleString()}đ</span></div>
                    
                    <div className="Customer-Brief">
                      <p>Khách hàng: <strong>Nguyễn Văn A</strong></p>
                      <p>SĐT: 0905 123 456</p>
                      <p>Địa chỉ: 42 Trần Thủ Độ, Điện Nam Bắc...</p>
                    </div>
                  </div>

                  {/* Cột phải: Thanh toán */}
                  <div className="Summary-Payment-Section">
                    <div className="Promo-Input-Box">
                      <label>Áp dụng mã giảm giá :</label>
                      <div className="Input-With-Icon">
                        <input type="text" placeholder="Nhập mã..." />
                        <button className="Apply-Btn">Áp dụng</button>
                      </div>
                    </div>

                    <h5 className="Section-Title">Lựa chọn thanh toán</h5>
                    <div className="Payment-Grid">
                      {['Tiền Mặt', 'VietQR', 'VNPAY', 'ZaloPay'].map((method) => (
                        <div 
                          key={method} 
                          className={`Payment-Card ${paymentMethod === method ? 'active' : ''}`}
                          onClick={() => setPaymentMethod(method)}
                        >
                          <i className={`fa-solid ${method === 'Tiền Mặt' ? 'fa-money-bill-1' : 'fa-qrcode'}`}></i>
                          <span>{method}</span>
                        </div>
                      ))}
                    </div>

                    <button className="Btn-Final-Order">Đặt ngay</button>
                    <p className="E-Invoice-Link">
                      Bạn có muốn xuất hóa đơn điện tử? <span className="Orange-Link" onClick={() => alert("Chuyển trang hóa đơn")}>Xuất hóa đơn điện tử</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Cart;