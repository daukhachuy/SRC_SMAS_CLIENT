import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header'; 
import Footer from '../components/Footer'; 
import { getProfile } from '../api/userApi'; 
import '../styles/Cart.css';

const Cart = () => {
  const BASE_URL = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net";
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- PHẦN PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  // 1. LẤY DỮ LIỆU TỪ LOCALSTORAGE
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(savedCart);
    setLoading(false);
  }, []);

  // 2. STATE THÔNG TIN KHÁCH HÀNG
  const [customerInfo, setCustomerInfo] = useState({
    recipientName: '',
    recipientPhone: '',
    address: '',
    note: '' 
  });

  // 3. TỰ ĐỘNG ĐỔ DỮ LIỆU TỪ PROFILE API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileData = await getProfile();
        if (profileData) {
          setCustomerInfo(prev => ({
            ...prev,
            recipientName: (profileData.fullname && profileData.fullname !== 'string') ? profileData.fullname : prev.recipientName,
            recipientPhone: (profileData.phone && profileData.phone !== 'string') 
              ? profileData.phone.replace('+84', '0') 
              : prev.recipientPhone,
            address: (profileData.address && profileData.address !== 'string') ? profileData.address : prev.address,
          }));
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin Profile trong Cart:", err);
      }
    };
    fetchUserProfile();
  }, []);

  const [discountCode, setDiscountCode] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Tiền Mặt');

  // --- LOGIC TÍNH TOÁN PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = cartItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(cartItems.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('storage'));

    const newTotalPages = Math.ceil(newCart.length / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };

  const increaseQty = (actualIndex) => {
    const newCart = [...cartItems];
    newCart[actualIndex] = { ...newCart[actualIndex], quantity: newCart[actualIndex].quantity + 1 };
    updateCart(newCart);
  };

  const decreaseQty = (actualIndex) => {
    const newCart = [...cartItems];
    if (newCart[actualIndex].quantity > 1) {
      newCart[actualIndex] = { ...newCart[actualIndex], quantity: newCart[actualIndex].quantity - 1 };
      updateCart(newCart);
    }
  };

  const removeItem = (actualIndex) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa món này?")) {
      const newCart = cartItems.filter((_, i) => i !== actualIndex);
      updateCart(newCart);
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const getDepositInfo = (price) => {
    if (price > 10000000) return { percent: 50, amount: price * 0.5 };
    if (price > 3000000) return { percent: 10, amount: price * 0.1 };
    return { percent: 0, amount: 0 };
  };
  const deposit = getDepositInfo(totalPrice);

  const handleCloseModal = () => {
    setShowInfoModal(false);
    setModalStep(1);
  };

  const handleFinalOrder = async () => {
    try {
      if(!customerInfo.recipientName || !customerInfo.recipientPhone || !customerInfo.address) {
          alert("Vui lòng điền đầy đủ thông tin giao hàng!");
          setModalStep(1);
          return;
      }

      const orderData = {
        discountCode: discountCode || "",
        note: customerInfo.note || "",
        items: cartItems.map(item => ({
          foodId: item.foodId ? Number(item.foodId) : 0,   
          comboId: item.comboId ? Number(item.comboId) : 0, 
          quantity: Number(item.quantity)
        })),
        deliveryInfo: {
          recipientName: customerInfo.recipientName,
          recipientPhone: customerInfo.recipientPhone,
          address: customerInfo.address,
          note: customerInfo.note
        }
      };

      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${BASE_URL}/api/order/create/delivery`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200 || response.status === 201) {
        alert("Đặt hàng thành công!");
        localStorage.removeItem('cart');
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Lỗi đặt hàng:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi gọi API đặt hàng.");
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Đang tải...</div>;

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
                  <th>SẢN PHẨM</th>
                  <th>SỐ LƯỢNG</th>
                  <th>GIÁ</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.length > 0 ? (
                  <>
                    {currentItems.map((item, index) => {
                      const actualIndex = indexOfFirstItem + index; 
                      const isActuallyCombo = (item.comboId && Number(item.comboId) > 0) || 
                                              (item.name && item.name.toLowerCase().includes('combo'));
                      
                      return (
                        <tr key={`cart-item-${actualIndex}`}>
                          <td>
                            <div className="Item-Info">
                              <img src={item.image} alt={item.name} className="Item-Img" />
                              <div className="Item-Text">
                                <span className={`Item-Badge ${isActuallyCombo ? 'badge-combo' : 'badge-food'}`}>
                                  {isActuallyCombo ? 'Combo' : 'Món lẻ'}
                                </span>
                                <div className="Item-Name">{item.name}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="Quantity-Control">
                              <button className="Qty-Btn" onClick={() => decreaseQty(actualIndex)}>-</button>
                              <input type="text" value={item.quantity} readOnly />
                              <button className="Qty-Btn" onClick={() => increaseQty(actualIndex)}>+</button>
                            </div>
                          </td>
                          <td>
                            <div className="Item-Price">{(item.price * item.quantity).toLocaleString()}đ</div>
                          </td>
                          <td>
                            <div className="Action-Icons">
                              <i className="fa-regular fa-trash-can delete-icon" onClick={() => removeItem(actualIndex)}></i>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ) : (
                  <tr>
                    <td colSpan="4" className="Empty-Cart-Msg">
                      Giỏ hàng của bạn đang trống. <a href="/menu">Quay lại thực đơn</a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="Pagination-Wrapper">
                <div className="Pagination-Right">
                    <button className="Page-Nav-Btn" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>
                      <i className="fa-solid fa-angle-left"></i>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} className={`Page-Number ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => paginate(i + 1)}>
                        {i + 1}
                      </button>
                    ))}
                    <button className="Page-Nav-Btn" disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)}>
                      <i className="fa-solid fa-angle-right"></i>
                    </button>
                </div>
              </div>
            )}
          </div>

          <div className="Cart-Total-Note-Section">
              <div className="Cart-Note-Input-Box">
                <i className="fa-regular fa-comment-dots"></i>
                <input 
                  type="text" 
                  placeholder="Nhập ghi chú cho toàn bộ đơn hàng tại đây..." 
                  value={customerInfo.note}
                  onChange={(e) => setCustomerInfo({...customerInfo, note: e.target.value})}
                />
              </div>
          </div>

          <div className="Cart-Summary-Card">
            <div className="Summary-Left">
              <div className="Sum-Item">Tất cả: <strong>{cartItems.length} Món</strong></div>
              <div className="Sum-Item">Tạm tính: <strong>{totalPrice.toLocaleString()} đ</strong></div>
              <div className="Sum-Item">Tiền cọc ({deposit.percent}%): <strong className="text-orange">{deposit.amount.toLocaleString()} đ</strong></div>
            </div>
            <div className="Summary-Right">
              <p className="Deposit-Policy">Chính sách cọc: 10% cho đơn trên 3tr, 50% cho đơn trên 10tr.</p>
              <button className="Btn-Order-Now" disabled={cartItems.length === 0} onClick={() => setShowInfoModal(true)}>Đặt ngay</button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL THANH TOÁN */}
      {showInfoModal && (
        <div className="Modal-Overlay" onClick={handleCloseModal}>
          <div className={`Info-Modal-Box ${modalStep === 2 ? 'summary-modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
            

            <div className="Modal-Header">
              <h3>{modalStep === 1 ? "Thông tin giao hàng" : "Tóm tắt đơn hàng"}</h3>
              <button className="Close-Modal-Btn" onClick={handleCloseModal}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>

            <div className="Modal-Body">
              {modalStep === 1 ? (
                <>
                  <div className="Input-Row">
                    <div className="Input-Group flex-1">
                      <label>SĐT :</label>
                      <div className="Input-With-Icon">
                        <i className="fa-solid fa-phone orange-icon"></i>
                        <input 
                            type="text" 
                            placeholder="Nhập số điện thoại..." 
                            value={customerInfo.recipientPhone}
                            onChange={(e) => setCustomerInfo({...customerInfo, recipientPhone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="Input-Group flex-1">
                      <label>Tên :</label>
                      <input 
                        type="text" 
                        placeholder="Nhập tên khách hàng..." 
                        value={customerInfo.recipientName}
                        onChange={(e) => setCustomerInfo({...customerInfo, recipientName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="Input-Group">
                    <label>Địa chỉ :</label>
                    <input 
                        type="text" 
                        placeholder="Nhập địa chỉ giao hàng..." 
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    />
                  </div>
                  <div className="Input-Group">
                    <label>Ghi chú đơn hàng :</label>
                    <textarea 
                        rows="3" 
                        placeholder="Ghi chú thêm cho nhà hàng..."
                        value={customerInfo.note}
                        onChange={(e) => setCustomerInfo({...customerInfo, note: e.target.value})}
                    ></textarea>
                  </div>
                  <button className="Btn-Confirm-Order" onClick={() => setModalStep(2)}>Xác Nhận</button>
                </>
              ) : (
                <div className="Summary-Main-Layout">
                  {/* PHẦN HÓA ĐƠN CÓ THANH CUỘN */}
                  <div className="Summary-Bill-Detail">
                    <div className="Bill-Header-Fixed">
                      <div className="Bill-Brand">NHÀ HÀNG LẨU NƯỚNG</div>
                      <p className="Bill-Address">42 Trần Thủ Độ, Điện Bàn, Đà Nẵng</p>
                      <div className="Bill-Divider"></div>
                      <div className="Bill-Customer-Info">
                          <div className="Info-Item"><strong>Khách hàng:</strong> {customerInfo.recipientName}</div>
                          <div className="Info-Item"><strong>SĐT:</strong> {customerInfo.recipientPhone}</div>
                          <div className="Info-Item"><strong>Địa chỉ:</strong> {customerInfo.address}</div>
                      </div>
                      <div className="Bill-Divider"></div>
                    </div>

                    <div className="Bill-Items-Scroll-Area">
                        {cartItems.map((item, idx) => (
                            <div key={idx} className="Bill-Row">
                                <span>{item.name} x{item.quantity}</span>
                                <span>{(item.price * item.quantity).toLocaleString()}đ</span>
                            </div>
                        ))}
                    </div>

                    <div className="Bill-Footer-Fixed">
                      <div className="Bill-Divider"></div>
                      {customerInfo.note && (
                        <div className="Bill-Note-Preview">
                          <strong>Ghi chú:</strong> {customerInfo.note}
                        </div>
                      )}
                      <div className="Bill-Row"><span>Tạm tính:</span> <span>{totalPrice.toLocaleString()}đ</span></div>
                      <div className="Bill-Row"><span>Tiền cọc ({deposit.percent}%):</span> <span className="text-orange">{deposit.amount.toLocaleString()}đ</span></div>
                      <div className="Bill-Total"><span>Tổng cộng:</span> <span>{totalPrice.toLocaleString()}đ</span></div>
                    </div>
                  </div>

                  <div className="Summary-Payment-Section">
                    <div className="Promo-Input-Box">
                      <label>Mã giảm giá :</label>
                      <div className="Input-With-Icon">
                        <input type="text" placeholder="Nhập mã..." value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
                        <button className="Apply-Btn">Áp dụng</button>
                      </div>
                    </div>
                    <h5 className="Section-Title">Lựa chọn thanh toán</h5>
                    <div className="Payment-Grid">
                      {['Tiền Mặt', 'VietQR', 'VNPAY', 'ZaloPay'].map((method) => (
                        <div key={method} className={`Payment-Card ${paymentMethod === method ? 'active' : ''}`} onClick={() => setPaymentMethod(method)} >
                          <span>{method}</span>
                        </div>
                      ))}
                    </div>
                    <button className="Btn-Final-Order" onClick={handleFinalOrder}>Xác nhận đặt hàng</button>
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