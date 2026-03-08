import React, { useState } from 'react';
import '../styles/OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!order) return null;

  // Ánh xạ dữ liệu từ API sang giao diện Modal
  const items = order.items || [];
  const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');

  return (
    <div className="Order-Detail-Overlay" onClick={(e) => e.target.className === 'Order-Detail-Overlay' && onClose()}>
      <div className="Order-Detail-Container animate-pop">
        
        <div className="Detail-Header">
          <h2>Chi tiết đơn hàng</h2>
          <button className="Back-Arrow-Btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i> {/* Đổi icon thành X cho trực quan */}
          </button>
        </div>

        <div className="Detail-Main-Content">
          
          {/* CỘT TRÁI: BIÊN LAI */}
          <div className="Receipt-Column">
            <div className="Shop-Brand">
              <i className="fa-solid fa-shop"></i>
              <h3>NHÀ HÀNG SMAS</h3>
              <p><i className="fa-solid fa-location-dot"></i> 42 Trần Thủ Độ, Đà Nẵng</p>
              <p>Mã đơn : <strong>{order.orderCode}</strong></p>
            </div>

            <div className="Items-List">
              {items.length > 0 ? items.map((item, idx) => (
                <div className="Receipt-Item" key={idx}>
                  <div className="Item-Name">
                    <span>{idx + 1}. {item.itemName}</span>
                    <small>sl : {item.quantity}</small>
                  </div>
                  <div className="Item-Price">
                    <span>{item.unitPrice?.toLocaleString()}</span>
                    <span>{(item.quantity * item.unitPrice).toLocaleString()}</span>
                  </div>
                </div>
              )) : <p>Không có thông tin món ăn</p>}
            </div>

            <div className="Receipt-Summary">
              <div className="Summary-Row">
                <span>Tổng số món: {items.reduce((acc, curr) => acc + curr.quantity, 0)}</span>
                <span>Cộng: {order.totalAmount?.toLocaleString()} đ</span>
              </div>
              <div className="Summary-Row">
                <span>Thuế VAT</span>
                <span>0 %</span>
              </div>
              <div className="Summary-Row Final-Total">
                <span>THÀNH TIỀN</span>
                <span>{order.totalAmount?.toLocaleString()} đ</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN VÀ ĐÁNH GIÁ */}
          <div className="Info-Rating-Column">
            <div className="Order-Meta-Info">
              <h3>Thông tin vận chuyển</h3>
              <p>Ngày đặt : <span>{orderDate}</span></p>
              <p>Người nhận : <span>{order.delivery?.recipientName || order.customer?.fullname || 'Khách hàng'}</span></p>
              <p>Số ĐT : <span>{order.delivery?.phone || 'N/A'}</span></p>
              <p>Thanh toán : <span>{order.paymentMethod || 'Tiền mặt'}</span></p>
              <p>Loại đơn : <span className="Order-Type-Badge">{order.orderType}</span></p>
            </div>

            <div className="Rating-Section">
              <p className="Rating-Prompt">Đánh giá trải nghiệm của bạn</p>
              <div className="Star-Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i 
                    key={star}
                    className={`fa-star ${star <= rating ? 'fa-solid' : 'fa-regular'}`}
                    onClick={() => setRating(star)}
                    style={{color: '#FF7A21', cursor: 'pointer', fontSize: '1.5rem'}}
                  ></i>
                ))}
              </div>

              <div className="Comment-Box">
                <label>Lời nhắn cho nhà hàng</label>
                <textarea 
                  rows="3" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Món ăn rất ngon..."
                ></textarea>
              </div>

              <button className="Submit-Rating-Btn" onClick={() => alert("Cảm ơn bạn đã đánh giá!")}>
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;