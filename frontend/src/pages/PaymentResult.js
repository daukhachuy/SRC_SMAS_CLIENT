import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { myOrderAPI } from '../api/myOrderApi';
import '../styles/PaymentResult.css';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  const isSuccess = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId');
  const errorCode = searchParams.get('errorCode');
  const errorDesc = searchParams.get('errorDesc');

  useEffect(() => {
    const handlePaymentResult = async () => {
      if (isSuccess) {
        // Clear cart only on successful payment
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('storage'));
        // Tự động chuyển về trang đơn hàng
        navigate('/my-orders');
      } else {
        // On payment failure - cancel the order so it doesn't appear in MyOrders
        if (orderId) {
          try {
            console.log("Cancelling order:", orderId);
            await myOrderAPI.cancelOrder(orderId);
            console.log("Order cancelled successfully");
          } catch (err) {
            console.error("Failed to cancel order:", err.response || err.message);
          }
        }
        setStatus('fail');
      }
    };

    handlePaymentResult();
  }, [isSuccess, orderId]);

  const handleGoToMyOrders = () => {
    navigate('/my-orders');
  };

  const handleGoBackToCart = () => {
    navigate('/cart');
  };

  return (
    <div className="Payment-Result-Page">
      <Header />
      <div className="header-spacer" style={{ height: '100px' }}></div>
      
      <main className="Result-Container">
        <div className={`Result-Card ${status}`}>
          {status === 'success' ? (
            <div className="Result-Content">
              <div className="Icon-Circle success">
                <i className="fa-solid fa-check"></i>
              </div>
              <h1>Thanh Toán Thành Công!</h1>
              <p>Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn là: <strong>#{orderId}</strong></p>
              <p>Nhà hàng sẽ sớm liên hệ xác nhận và giao hàng cho bạn.</p>
              <div className="Action-Btns">
                <button className="Btn-Home" onClick={() => navigate('/')}>Về trang chủ</button>
                <button className="Btn-History" onClick={handleGoToMyOrders}>Xem lịch sử đơn</button>
              </div>
            </div>
          ) : (
            <div className="Result-Content">
              <div className="Icon-Circle fail">
                <i className="fa-solid fa-xmark"></i>
              </div>
              <h1>Thanh Toán Thất Bại</h1>
              <p>Payment failed, please choose another payment method.</p>
              {errorCode && <p>Mã lỗi: {errorCode}</p>}
              {errorDesc && <p>{errorDesc}</p>}
              <div className="Action-Btns">
                <button className="Btn-Retry" onClick={handleGoBackToCart}>Quay lại giỏ hàng</button>
                <button className="Btn-Support" onClick={() => navigate('/')}>Liên hệ hỗ trợ</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentResult;