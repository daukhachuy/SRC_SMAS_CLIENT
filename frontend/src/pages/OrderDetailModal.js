import React from 'react';
import '../styles/OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose }) => {
  return (
    <div className="Modal-Overlay" onClick={onClose}>
      <div className="Modal-Content animate-zoom-in" onClick={e => e.stopPropagation()}>
        <div className="Bill-Header">
          <button className="Close-X" onClick={onClose}>&times;</button>
          <div className="Bill-Logo">
             <i className="fa-solid fa-utensils"></i>
             <h2>NHÀ HÀNG SMAS</h2>
          </div>
          <p className="Bill-ID">Mã hóa đơn: #{order.id}</p>
        </div>

        <div className="Bill-Body">
          <div className="Bill-Info">
            <div className="Info-Row"><span>Khách hàng:</span> <span>Khánh Hồ</span></div>
            <div className="Info-Row"><span>Ngày đặt:</span> <span>{order.date}</span></div>
            <div className="Info-Row"><span>Trạng thái:</span> <span className={order.statusClass}>{order.statusName}</span></div>
          </div>

          <div className="Bill-Items">
             <label>Chi tiết món ăn</label>
             <table className="Bill-Table">
                <thead>
                  <tr>
                    <th>Món</th>
                    <th>SL</th>
                    <th>Giá</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Lẩu thái</td><td>1</td><td>350.000đ</td></tr>
                  <tr><td>Coca</td><td>2</td><td>30.000đ</td></tr>
                </tbody>
             </table>
          </div>

          <div className="Bill-Total">
            <div className="Total-Row Grand-Total">
              <span>TỔNG THANH TOÁN:</span>
              <span>{order.totalPrice.toLocaleString()} đ</span>
            </div>
          </div>

          <div className="Bill-Rating-Section">
            <p>Đánh giá của bạn</p>
            <div className="Stars">
              {[1, 2, 3, 4, 5].map(i => <i key={i} className="fa-regular fa-star"></i>)}
            </div>
            <textarea placeholder="Chia sẻ cảm nhận về dịch vụ..."></textarea>
            <button className="Btn-Submit-Rating">Gửi đánh giá</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;