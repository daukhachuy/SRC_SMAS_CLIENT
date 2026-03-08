import React, { useState, useEffect } from 'react';
import { myOrderAPI } from '../api/myOrderApi';
import OrderDetailModal from './OrderDetailModal';
import '../styles/MyOrders.css';

const MyOrders = () => {
  const [activeTab, setActiveTab] = useState('Delivery');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const tabs = [
    { id: 'Delivery', label: 'GIAO HÀNG', icon: 'fa-truck' },
    { id: 'Booking', label: 'ĐẶT CHỖ', icon: 'fa-utensils' },
    { id: 'Event', label: 'SỰ KIỆN', icon: 'fa-calendar-star' }
  ];

  const getStatusDisplay = (status) => {
    const config = {
      'Pending': { text: 'Chờ xác nhận', class: 'Waiting' },
      'Confirmed': { text: 'Đã xác nhận', class: 'Success' },
      'Processing': { text: 'Đang xử lý', class: 'Processing' },
      'Completed': { text: 'Hoàn thành', class: 'Success' },
      'Cancelled': { text: 'Đã hủy', class: 'Cancelled' }
    };
    return config[status] || { text: status, class: 'Waiting' };
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const statuses = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'];
      const data = await myOrderAPI.getOrders(activeTab, statuses);
      setOrders(data || []);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [activeTab]);

  return (
    <div className="Order-History-Page">
      <h1 className="Page-Title">ĐƠN HÀNG CỦA TÔI</h1>

      <div className="Order-Tabs-Container">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            className={`Order-Tab-Btn ${activeTab === tab.id ? 'Active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      <div className="Orders-List-Flow">
        {loading ? (
          <div className="Spinner-Wrapper"><div className="Spinner"></div><p>Đang tải dữ liệu...</p></div>
        ) : orders.length > 0 ? (
          orders.map((order) => {
            const status = getStatusDisplay(order.orderStatus);
            return (
              <div key={order.orderId} className="Order-Horizontal-Card">
                <div className="Card-Top-Row">
                  <div className="Type-Header">
                    <i className={`fa-solid ${order.orderType === 'Delivery' ? 'fa-truck' : 'fa-house-user'} orange-icon`}></i>
                    <span>{order.orderType.toUpperCase()} <small className="Order-Code-Tag">#{order.orderCode}</small></span>
                  </div>
                  <div className="Right-Action-Header">
                    <div className={`Status-Label ${status.class}`}>{status.text}</div>
                    <button className="Btn-View-Detail" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
                      CHI TIẾT
                    </button>
                  </div>
                </div>

                <div className="Card-Main-Grid">
                  <div className="Grid-Col">
                    <p>NGƯỜI NHẬN: <span>{order.delivery?.recipientName || order.customer?.fullname}</span></p>
                    <p>ĐIỆN THOẠI: <span>{order.delivery?.recipientPhone || order.customer?.phone}</span></p>
                  </div>
                  <div className="Grid-Col">
                    <p>HÌNH THỨC: <span>{order.paymentMethod || 'Tiền mặt'}</span></p>
                    <p>THỜI GIAN: <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span></p>
                  </div>
                  <div className="Grid-Col Total-Col">
                    <p>TỔNG THANH TOÁN</p>
                    <h2 className="Price-Text">{order.totalAmount?.toLocaleString()} đ</h2>
                  </div>
                </div>

                <div className="Card-Bottom-Address">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>ĐỊA CHỈ: {order.delivery?.address || "Nhận tại cửa hàng"}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="Empty-Box">Không tìm thấy đơn hàng nào trong mục này.</div>
        )}
      </div>

      {showModal && <OrderDetailModal order={selectedOrder} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default MyOrders;