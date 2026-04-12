import React, { useState, useEffect } from 'react';
import instance from '../api/axiosInstance';
import Header from '../components/Header'; 
import Footer from '../components/Footer'; 
import { getProfile } from '../api/userApi'; 
import { myOrderAPI } from '../api/myOrderApi';
import { discountAPI } from '../api/discountApi';
import { useNavigate } from 'react-router-dom';
import CustomerNoticeModal from '../components/CustomerNoticeModal';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);

  // --- PHÂN TRANG ---
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
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Tiền Mặt');
  const [paymentError, setPaymentError] = useState('');
  const [customerNotice, setCustomerNotice] = useState(null);

  // --- LOGIC VALIDATE SỐ ĐIỆN THOẠI ---
  const handleGoToStep2 = () => {
    const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
    if (!customerInfo.recipientPhone.trim()) {
      setCustomerNotice({
        kind: 'alert',
        title: 'Thiếu số điện thoại',
        message: 'Vui lòng nhập số điện thoại để nhà hàng liên hệ giao hàng.',
        variant: 'warning',
      });
      return;
    }
    if (!phoneRegex.test(customerInfo.recipientPhone.trim())) {
      setCustomerNotice({
        kind: 'alert',
        title: 'Số điện thoại chưa hợp lệ',
        message: 'Vui lòng nhập đúng định dạng số điện thoại Việt Nam (ví dụ 09xxxxxxxx).',
        variant: 'warning',
      });
      return;
    }
    if (!customerInfo.recipientName.trim() || !customerInfo.address.trim()) {
      setCustomerNotice({
        kind: 'alert',
        title: 'Thiếu thông tin giao hàng',
        message: 'Vui lòng điền đầy đủ họ tên và địa chỉ nhận hàng.',
        variant: 'warning',
      });
      return;
    }
    setModalStep(2);
  };

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
    setCustomerNotice({
      kind: 'confirm',
      title: 'Xóa món khỏi giỏ?',
      message:
        'Bạn có chắc chắn muốn xóa món này? Bạn luôn có thể thêm lại từ thực đơn.',
      variant: 'danger',
      confirmLabel: 'Xóa món',
      cancelLabel: 'Giữ lại',
      onConfirm: () => {
        const newCart = cartItems.filter((_, i) => i !== actualIndex);
        updateCart(newCart);
      },
    });
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0);

  const deliveryFeeRaw = process.env.REACT_APP_DELIVERY_FEE;
  const deliveryFee =
    deliveryFeeRaw === undefined || deliveryFeeRaw === ''
      ? 25000
      : Math.max(0, Number(deliveryFeeRaw) || 0);

  const handleCloseModal = () => {
    if (isOrdering) return; 
    setShowInfoModal(false);
    setModalStep(1);
    setPaymentError('');
    setDiscountError('');
  };

  // --- LOGIC APPLY DISCOUNT CODE ---
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Vui lòng nhập mã giảm giá");
      return;
    }

    setDiscountLoading(true);
    setDiscountError('');

    try {
      const result = await discountAPI.validateDiscount(discountCode);
      
      // Check minimum order amount
      if (result.minOrderAmount && totalPrice < result.minOrderAmount) {
        setDiscountError(`Đơn hàng tối thiểu ${result.minOrderAmount.toLocaleString()}đ để áp dụng mã này`);
        setAppliedDiscount(null);
        return;
      }

      setAppliedDiscount(result);
      setDiscountError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn";
      setDiscountError(errorMsg);
      setAppliedDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  // Calculate discount amount
  const calculateDiscount = () => {
    if (!appliedDiscount) return 0;
    
    let discountAmount = 0;
    if (appliedDiscount.discountType === 'Percentage') {
      discountAmount = (totalPrice * appliedDiscount.value) / 100;
      // Apply max discount cap if exists
      if (appliedDiscount.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, appliedDiscount.maxDiscountAmount);
      }
    } else if (appliedDiscount.discountType === 'Fixed') {
      discountAmount = appliedDiscount.value;
    }
    
    return discountAmount;
  };

  const discountAmount = calculateDiscount();
  const finalPrice = totalPrice - discountAmount + deliveryFee;

  // --- LOGIC ĐẶT HÀNG & THANH TOÁN (THEO QUY TRÌNH 3 BƯỚC) ---
  const handleFinalOrder = async () => {
    if (isOrdering) return;
    setIsOrdering(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // BƯỚC 1: TẠO ĐƠN HÀNG (POST /api/order/create/delivery)
      const formattedItems = cartItems.map(item => {
        const isCombo = (item.comboId && Number(item.comboId) > 0) || (item.name?.toLowerCase().includes('combo'));
        return {
          foodId: !isCombo ? Number(item.foodId || item.id) : null,
          comboId: isCombo ? Number(item.comboId || item.id) : null,
          quantity: Number(item.quantity)
        };
      }).filter(i => i.foodId || i.comboId);

      const orderPayload = {
        discountCode: appliedDiscount?.code || discountCode || null,
        note: customerInfo.note || null,
        items: formattedItems,
        deliveryInfo: {
          recipientName: customerInfo.recipientName,
          recipientPhone: customerInfo.recipientPhone,
          address: customerInfo.address,
          note: customerInfo.note || null
        }
      };

      const orderRes = await instance.post('/order/create/delivery', orderPayload);

      // Lấy orderId từ response (Cấu trúc: { success: true, orderId: 123, ... })
      const orderId = orderRes.data.orderId || orderRes.data.id;

      // BƯỚC 2: TẠO LINK THANH TOÁN NẾU KHÔNG PHẢI TIỀN MẶT
      if (paymentMethod === 'Tiền Mặt') {
        setCustomerNotice({
          kind: 'alert',
          title: 'Đặt hàng thành công',
          message:
            orderRes.data.message ||
            'Cảm ơn bạn! Đơn hàng đã được ghi nhận. Nhà hàng sẽ liên hệ sớm nhất có thể.',
          variant: 'success',
          confirmLabel: 'Xem đơn của tôi',
          afterClose: finishOrderSuccess,
        });
      } else {
        const payRes = await instance.post('/payment/create-link', {
          orderId: Number(orderId),
          returnUrl: `${window.location.origin}/payment-result?success=true&orderId=${orderId}`,
          cancelUrl: `${window.location.origin}/payment-result?success=false&orderId=${orderId}`
        });

        if (payRes.data.success && payRes.data.checkoutUrl) {
          // Lưu orderId vào sessionStorage để xử lý sau khi thanh toán
          sessionStorage.setItem('pendingOrderId', orderId);
          // Chuyển hướng sang PayOS - KHÔNG xóa giỏ hàng ở đây
          // Giỏ hàng sẽ được xóa khi thanh toán thành công tại PaymentResult
          window.location.href = payRes.data.checkoutUrl;
        } else {
          // Failed to create payment link - cancel the order and stay on cart
          try {
            await myOrderAPI.cancelOrder(orderId);
          } catch (cancelErr) {
            console.error("Failed to cancel order:", cancelErr);
          }
          setPaymentError("Lỗi tạo link thanh toán: " + (payRes.data.message || "Không xác định"));
          setModalStep(2); // Stay on order summary
        }
      }
    } catch (err) {
      console.error("Lỗi quy trình:", err);
      const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi xử lý đơn hàng.";
      
      // Check if this is a payment failure
      if (err.response?.status === 400 && errorMessage.toLowerCase().includes('payment')) {
        setPaymentError("Payment failed, please choose another payment method.");
        setModalStep(2); // Stay on order summary
      } else {
        setCustomerNotice({
          kind: 'alert',
          title: 'Không thể hoàn tất đơn',
          message: errorMessage,
          variant: 'warning',
        });
      }
    } finally {
      setIsOrdering(false);
    }
  };

  const finishOrderSuccess = () => {
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('storage'));
    navigate('/my-orders');
  };

  if (loading) return <div className="loading-spinner">Đang tải...</div>;

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
                  currentItems.map((item, index) => {
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
                          <div className="Item-Price">{((item.price || 0) * item.quantity).toLocaleString()}đ</div>
                        </td>
                        <td>
                          <div className="Action-Icons">
                            <i className="fa-regular fa-trash-can delete-icon" onClick={() => removeItem(actualIndex)}></i>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
              {appliedDiscount && (
                <div className="Sum-Item" style={{ color: 'green' }}>
                  Giảm giá: <strong>-{discountAmount.toLocaleString()} đ</strong>
                </div>
              )}
              <div className="Sum-Item">
                Phí vận chuyển:{' '}
                <strong>{deliveryFee > 0 ? `+${deliveryFee.toLocaleString()} đ` : 'Miễn phí'}</strong>
              </div>
              <div className="Sum-Item" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                Tổng cộng: <strong className="text-orange">{finalPrice.toLocaleString()} đ</strong>
              </div>
            </div>
            <div className="Summary-Right">
              <button className="Btn-Order-Now" disabled={cartItems.length === 0} onClick={() => setShowInfoModal(true)}>Đặt ngay</button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL THANH TOÁN 2 BƯỚC (GIỮ NGUYÊN UI CỦA BẠN) */}
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
                            onChange={(e) => setCustomerInfo({...customerInfo, recipientPhone: e.target.value.replace(/[^0-9]/g, '')})}
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
                  <button className="Btn-Confirm-Order" onClick={handleGoToStep2}>Xác Nhận</button>
                </>
              ) : (
                <div className="Summary-Main-Layout">
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

                    <div className="Bill-Items-Scroll-Area" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {cartItems.map((item, idx) => (
                            <div key={idx} className="Bill-Row">
                                <span>{item.name} x{item.quantity}</span>
                                <span>{((item.price || 0) * item.quantity).toLocaleString()}đ</span>
                            </div>
                        ))}
                    </div>

                    <div className="Bill-Footer-Fixed">
                      <div className="Bill-Divider"></div>
                      {appliedDiscount && (
                        <div className="Bill-Row" style={{ color: 'green' }}>
                          <span>Giảm giá ({appliedDiscount.code}):</span> <span>-{discountAmount.toLocaleString()}đ</span>
                        </div>
                      )}
                      <div className="Bill-Row"><span>Tạm tính:</span> <span>{totalPrice.toLocaleString()}đ</span></div>
                      <div className="Bill-Row">
                        <span>Phí vận chuyển</span>
                        <span>{deliveryFee > 0 ? `+${deliveryFee.toLocaleString()}đ` : 'Miễn phí'}</span>
                      </div>
                      <div className="Bill-Total"><span>Tổng cộng:</span> <span>{finalPrice.toLocaleString()}đ</span></div>
                    </div>
                  </div>

                  <div className="Summary-Payment-Section">
                    {paymentError && (
                      <div className="Payment-Error-Message" style={{ color: 'red', marginBottom: '10px', padding: '10px', background: '#ffe6e6', borderRadius: '8px' }}>
                        {paymentError}
                      </div>
                    )}
                    <div className="Promo-Input-Box">
                      <label>Mã giảm giá :</label>
                      <div className="Input-With-Icon">
                        <input 
                          type="text" 
                          placeholder="Nhập mã..." 
                          value={discountCode} 
                          onChange={(e) => setDiscountCode(e.target.value)} 
                        />
                        <button 
                          className="Apply-Btn" 
                          onClick={handleApplyDiscount}
                          disabled={discountLoading}
                        >
                          {discountLoading ? '...' : 'Áp dụng'}
                        </button>
                      </div>
                      {discountError && (
                        <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{discountError}</p>
                      )}
                      {appliedDiscount && (
                        <div style={{ color: 'green', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-check-circle"></i>
                          <span>Đã áp dụng: {appliedDiscount.code} (-{discountAmount.toLocaleString()}đ)</span>
                          <button 
                            onClick={() => { setAppliedDiscount(null); setDiscountCode(''); }} 
                            style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', padding: '0 5px' }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                    <h5 className="Section-Title">Lựa chọn thanh toán</h5>
                    <div className="Payment-Grid">
                      {['Tiền Mặt', 'PayOS'].map((method) => (
                        <div key={method} className={`Payment-Card ${paymentMethod === method ? 'active' : ''}`} onClick={() => setPaymentMethod(method)} >
                          <span>{method}</span>
                        </div>
                      ))}
                    </div>
                    <button className="Btn-Final-Order" onClick={handleFinalOrder} disabled={isOrdering}>
                        {isOrdering ? "Đang xử lý..." : paymentMethod === 'Tiền Mặt' ? "Xác nhận đặt hàng" : `Thanh toán qua ${paymentMethod}`}
                    </button>
                    <button className="Btn-Back-Step" onClick={() => setModalStep(1)} style={{marginTop: '10px', width: '100%', background: '#eee', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer'}}>
                      Quay lại thông tin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />

      <CustomerNoticeModal
        config={customerNotice}
        onRequestClose={() => setCustomerNotice(null)}
      />
    </div>
  );
};

export default Cart;