import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/PaymentResult.css'; // Bạn có thể tạo thêm file CSS này

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, fail

  // Lấy các tham số từ URL (Ví dụ: ?success=true&orderId=123)
  const isSuccess = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId');
  const errorCode = searchParams.get('errorCode'); // Nếu có từ cổng thanh toán

  useEffect(() => {
    // Giả lập kiểm tra hoặc đợi phản hồi từ server
    if (isSuccess) {
      setStatus('success');
    } else {
      setStatus('fail');
    }
  }, [isSuccess]);

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
                <button className="Btn-History" onClick={() => navigate('/order-history')}>Xem lịch sử đơn</button>
              </div>
            </div>
          ) : (
            <div className="Result-Content">
              <div className="Icon-Circle fail">
                <i className="fa-solid fa-xmark"></i>
              </div>
              <h1>Thanh Toán Thất Bại</h1>
              <p>Rất tiếc, quá trình giao dịch đã bị gián đoạn hoặc bị hủy.</p>
              {errorCode && <p>Mã lỗi: {errorCode}</p>}
              <p>Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
              <div className="Action-Btns">
                <button className="Btn-Retry" onClick={() => navigate('/cart')}>Quay lại giỏ hàng</button>
                <button className="Btn-Support">Liên hệ hỗ trợ</button>
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