import React, { useState, useEffect } from 'react';
import '../styles/MyOrders.css';

const MyOrders = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'Tất cả đơn hàng' },
    { id: 'booking', label: 'Đặt Chỗ' },
    { id: 'event', label: 'Sự Kiện' },
    { id: 'delivery', label: 'Giao Hàng' }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    const mockData = [
      { 
        id: 'ORD-001', type: 'booking', typeName: 'Đặt chỗ tại cửa hàng', 
        status: 'confirmed', statusName: 'Đã xác nhận', statusClass: 'Success',
        customer: 'Nguyen Van A', phone: '0123456789', 
        people: 9, tables: 1, 
        createdAt: '09/11/2025', bookingTime: '12/11/2025 09:00',
        note: 'Chuẩn bị bàn gần cửa sổ', policy: 'Chỉ được hủy trước 2 ngày'
      },
      { 
        id: 'ORD-002', type: 'event', typeName: 'Đặt sự kiện tại cửa hàng', 
        status: 'waiting', statusName: 'Đang chờ ký hợp đồng', statusClass: 'Waiting',
        customer: 'Nguyen Van B', phone: '0987654321', 
        people: 30, tables: 5, eventType: 'Họp lớp',
        createdAt: '10/11/2025', bookingTime: '20/11/2025 18:00',
        note: 'Cần dàn âm thanh và máy chiếu',
        policy: 'Chỉ được hủy trước 5 ngày'
      },
      { 
        id: 'ORD-003', type: 'delivery', typeName: 'Đặt giao hàng', 
        status: 'processing', statusName: 'Đang chế biến', statusClass: 'Processing',
        customer: 'Nguyen Van A', phone: '0123456789', 
        address: '42 Trần Thủ Độ, Đà Nẵng',
        createdAt: '11/11/2025', deliveryTime: '11/11/2025 11:30',
        totalPrice: 1000000,
        items: [
          {name: 'Cá diêu hồng hấp', sl: 1, total: 150000},
          {name: 'Combo vỏ đời', sl: 2, total: 350000}
        ],
        note: 'Giảm cay cho tất cả món ăn'
      }
    ];
    
    setTimeout(() => {
      setOrders(activeTab === 'all' ? mockData : mockData.filter(o => o.type === activeTab));
      setLoading(false);
    }, 500);
  };

  useEffect(() => { fetchOrders(); }, [activeTab]);

  return (
    <div className="MyOrders-Wrapper">
      {/* Tiêu đề trang giống OrderHistory */}
      <h1 className="Page-Title">Đơn Hàng Của Tôi</h1>

      {/* Tabs Gradient */}
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

      <div className="Orders-List-Container">
        {loading ? (
          <div className="Loading-State">
             <div className="Spinner"></div>
             <p>Đang tải đơn hàng...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map(order => (
            <div key={order.id} className="Order-Horizontal-Card">
              
              <div className="Card-Top-Row">
                <div className="Type-Header">
                  <i className={`fa-solid ${order.type === 'delivery' ? 'fa-truck' : 'fa-house-chimney'} orange-icon`}></i> 
                  <strong>{order.typeName}</strong>
                </div>
                <div className={`Status-Label ${order.statusClass}`}>
                  <i className="fa-solid fa-circle-dot"></i> {order.statusName}
                </div>
                <div className="Order-Time-Badge">
                  <i className="fa-regular fa-calendar-check"></i> {order.bookingTime || order.deliveryTime}
                </div>
              </div>

              <div className="Card-Main-Grid">
                <div className="Grid-Col">
                  <p>Người đặt : <span>{order.customer}</span></p>
                  <p>Đặt Ngày : <span>{order.createdAt}</span></p>
                  <p>Liên Hệ : <span>{order.phone}</span></p>
                </div>

                <div className="Grid-Col">
                   {order.people && <p>Số người : <span>{order.people}</span></p>}
                   {order.tables && <p>Số bàn : <span>{order.tables}</span></p>}
                   <p>Ghi chú : <span className="Note-Text">{order.note}</span></p>
                </div>

                <div className="Grid-Col">
                   {order.address && (
                      <p>Địa chỉ : <span className="Highlight-Address">{order.address}</span></p>
                   )}
                   {order.type === 'event' && (
                      <div className="Event-Action-Box">
                         <span className="Link-Action">Xem thực đơn</span>
                         <span className="Link-Action blue">Xem hợp đồng</span>
                      </div>
                   )}
                   {order.totalPrice > 0 && (
                      <p className="Total-Text">Tổng thanh toán: <strong>{order.totalPrice.toLocaleString()} đ</strong></p>
                   )}
                </div>
              </div>

              {/* Phần danh sách món ăn cho Delivery */}
              {order.items && (
                <div className="Order-Table-Wrapper">
                  <table className="Minimal-Table">
                    <thead>
                      <tr>
                        <th>Món ăn</th>
                        <th>SL</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td>{item.sl}</td>
                          <td>{item.total.toLocaleString()}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="Card-Footer-Actions">
                {order.policy && <span className="Cancel-Policy">Chính sách: {order.policy}</span>}
                <button className="Btn-Cancel-Order">Hủy Đơn</button>
              </div>

            </div>
          ))
        ) : (
          <div className="Empty-State">
            <i className="fa-solid fa-box-open"></i>
            <p>Hiện tại bạn không có đơn hàng nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;