import React, { useState, useEffect } from 'react';
import '../styles/MyOrders.css';

const MyOrders = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'booking', label: 'Đặt Chỗ' },
    { id: 'event', label: 'Sự Kiện' },
    { id: 'delivery', label: 'Giao Hàng' }
  ];

  // --- FAKE API LOGIC ---
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    // Giả lập gọi API với Promise và setTimeout
    const mockApiResponse = () => new Promise((resolve) => {
      setTimeout(() => {
        const data = [
          { 
            id: 'ORD-1024', type: 'delivery', typeName: 'Giao Hàng', 
            status: 'pending', statusName: 'Đang xử lý', statusClass: 'Warning',
            createdAt: '2025-11-15T08:30:00Z', totalPrice: 250000 
          },
          { 
            id: 'ORD-5521', type: 'booking', typeName: 'Đặt Chỗ', 
            status: 'confirmed', statusName: 'Đã xác nhận', statusClass: 'Success',
            createdAt: '2025-11-14T10:00:00Z', totalPrice: 0 
          },
          { 
            id: 'ORD-9902', type: 'event', typeName: 'Sự Kiện', 
            status: 'pending', statusName: 'Chờ thanh toán', statusClass: 'Warning',
            createdAt: '2025-11-12T15:45:00Z', totalPrice: 1500000 
          }
        ];
        resolve(data);
      }, 800); // Delay 0.8s để thấy loading cực mượt
    });

    try {
      const allOrders = await mockApiResponse();
      
      // Logic lọc dữ liệu tại Frontend giống hệt Backend làm
      const filteredData = activeTab === 'all' 
        ? allOrders 
        : allOrders.filter(order => order.type === activeTab);
        
      setOrders(filteredData);
    } catch (err) {
      setError("Lỗi kết nối máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleCancel = (orderId) => {
    if (window.confirm(`Bạn muốn hủy đơn hàng ${orderId}?`)) {
      // Giả lập xóa thành công
      setOrders(orders.filter(o => o.id !== orderId));
      alert("Đã gửi yêu cầu hủy đơn!");
    }
  };

  return (
    <div className="Content-Card animate-fade-in">
      <h1 className="Content-Title">Đơn Hàng Của Tôi</h1>

      {/* Tabs chuyển đổi */}
      <div className="Order-Tabs-Container">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`Order-Tab-Btn ${activeTab === tab.id ? 'Active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="Orders-List-Wrapper">
        {loading ? (
          <div className="Status-Message">
            <div className="Loading-Spinner"></div>
            <p>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="Status-Message Error-Text">{error}</div>
        ) : orders.length > 0 ? (
          orders.map(order => (
            <div key={order.id} className="Order-Modern-Card">
              <div className="Order-Card-Header">
                <div className="Type-Tag">
                  <i className={order.type === 'delivery' ? "fa-solid fa-truck-fast" : "fa-solid fa-house-chimney"}></i>
                  {order.typeName}
                </div>
                <span className={`Status-Badge ${order.statusClass}`}>
                  {order.statusName}
                </span>
              </div>

              <div className="Order-Card-Body">
                <div className="Order-Info-Grid">
                  <div className="Info-Item">
                    <label>Mã đơn</label>
                    <span className="Highlight-Text">#{order.id}</span>
                  </div>
                  <div className="Info-Item">
                    <label>Ngày đặt</label>
                    <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="Info-Item">
                    <label>Tổng thanh toán</label>
                    <span className="Price-Text">
                      {order.totalPrice > 0 ? `${order.totalPrice.toLocaleString()} đ` : 'Miễn phí'}
                    </span>
                  </div>
                </div>

                <div className="Order-Card-Footer">
                  <div className="Action-Section">
                    {order.status === 'pending' && (
                      <button 
                        className="Btn-Cancel-Modern"
                        onClick={() => handleCancel(order.id)}
                      >
                        Hủy đơn
                      </button>
                    )}
                    <button className="Btn-Detail-Modern">Xem chi tiết</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="Empty-State Status-Message">
            <i className="fa-solid fa-box-open" style={{fontSize: '3rem', opacity: 0.3}}></i>
            <p>Không tìm thấy đơn hàng nào ở mục này.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;