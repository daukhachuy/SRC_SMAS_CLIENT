import React, { useState } from 'react';
import '../styles/OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!order) return null;

  return (
    <div className="Order-Detail-Overlay" onClick={(e) => e.target.className === 'Order-Detail-Overlay' && onClose()}>
      <div className="Order-Detail-Container animate-pop">
        
        {/* Tiêu đề & Nút đóng */}
        <div className="Detail-Header">
          <h2>Chi tiết đơn hàng</h2>
          <button className="Back-Arrow-Btn" onClick={onClose}>
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>

        <div className="Detail-Main-Content">
          
          {/* CỘT TRÁI: HÓA ĐƠN MÓN ĂN */}
          <div className="Receipt-Column">
            <div className="Shop-Brand">
              <i className="fa-solid fa-shop"></i>
              <h3>Nhà Hàng Lẩu Nướng</h3>
              <p><i className="fa-solid fa-location-dot"></i> 42 Trần Thủ Độ, Điện Bàn Đông, Đà Nẵng</p>
              <p>Đơn hàng : {order.id || '20232501'}</p>
            </div>

            <div className="Items-List">
              {/* Giả lập danh sách món nếu không có trong data */}
              {(order.menuItems || [
                { name: 'Cá chiên mắm', quantity: 2, price: 60000 },
                { name: 'Cá chiên mắm', quantity: 2, price: 60000 },
                { name: 'Cá chiên mắm', quantity: 2, price: 60000 },
                { name: 'Cá chiên mắm', quantity: 2, price: 60000 },
              ]).map((item, idx) => (
                <div className="Receipt-Item" key={idx}>
                  <div className="Item-Name">
                    <span>{idx + 1}. {item.name}</span>
                    <small>sl : {item.quantity}</small>
                  </div>
                  <div className="Item-Price">
                    <span>{(item.price || 0).toLocaleString()}</span>
                    <span>{(item.quantity * item.price || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="Receipt-Summary">
              <div className="Summary-Row">
                <span>Tổng số lượng : {order.totalQuantity || 8}</span>
                <span>Tổng : {(order.totalPrice || 800000).toLocaleString()} đ</span>
              </div>
              <div className="Summary-Row">
                <span></span>
                <span>VAT : 0 %</span>
              </div>
              <div className="Summary-Row">
                <span></span>
                <span>Giảm Giá : {(order.discount || 80000).toLocaleString()} đ</span>
              </div>
              <div className="Summary-Row Final-Total">
                <span></span>
                <span>Giá gốc : {(order.finalPrice || 880000).toLocaleString()} đ</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN VÀ ĐÁNH GIÁ */}
          <div className="Info-Rating-Column">
            <div className="Order-Meta-Info">
              <h3>Thông tin đơn hàng</h3>
              <p>Ngày : <span>{order.date || '13/01/2026'}</span></p>
              <p>Người mua : <span>{order.customer || 'nguyen van a'}</span></p>
              <p>Mã thuế : <span>--</span></p>
              <p>Số HD GTGT : <span>--</span></p>
              <p>Số HD TT : <span>--</span></p>
              <p>Mã CQT : <span>--</span></p>
              <p>Thanh toán : <span>Tiền mặt</span></p>
            </div>

            <div className="Rating-Section">
              <p className="Rating-Prompt">Bạn chưa đánh giá cho đơn hàng này</p>
              <div className="Star-Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i 
                    key={star}
                    className={`fa-star ${star <= rating ? 'fa-solid' : 'fa-regular'}`}
                    onClick={() => setRating(star)}
                  ></i>
                ))}
              </div>

              <div className="Comment-Box">
                <label>Suy nghĩ của bạn</label>
                <textarea 
                  rows="4" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Nhập cảm nhận của bạn..."
                ></textarea>
              </div>

              <button className="Submit-Rating-Btn">Đánh giá</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;