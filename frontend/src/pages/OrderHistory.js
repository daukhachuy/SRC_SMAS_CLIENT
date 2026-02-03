import React, { useState, useEffect } from 'react';
import OrderDetailModal from './OrderDetailModal'; 
import '../styles/OrderHistory.css';

const OrderHistory = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' }
  ];

  const fetchHistory = async () => {
    setLoading(true);
    const mockApi = () => new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { 
            id: 'EVT-001', type: 'completed', typeName: 'Đặt sự kiện tại cửa hàng', 
            statusName: 'Đã thanh toán', statusClass: 'Success', 
            customer: 'Nguyen Van A', email: 'abc123@gmail.com', eventName: 'Họp lớp',
            guests: 30, tables: 5, phone: '0123456789', date: '09/11/2025'
          },
          { 
            id: 'EVT-002', type: 'pending', typeName: 'Đặt sự kiện tại cửa hàng', 
            statusName: 'Đang chờ ký hợp đồng', statusClass: 'Waiting', 
            customer: 'Nguyen Van B', email: 'vanb@gmail.com', eventName: 'Sinh nhật',
            guests: 30, tables: 5, phone: '0987654321', date: '10/11/2025'
          }
        ]);
      }, 600);
    });

    const allData = await mockApi();
    const filtered = activeTab === 'all' ? allData : allData.filter(i => {
        if(activeTab === 'completed') return i.statusClass === 'Success';
        if(activeTab === 'cancelled') return i.statusClass === 'Cancel';
        return true;
    });
    setHistory(filtered);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [activeTab]);

  return (
    <div className="Order-History-Page">
      <h1 className="Page-Title">Lịch Sử Giao Dịch</h1>

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
          <div className="Loading-State"><div className="Spinner"></div></div>
        ) : (
          history.map(item => (
            <div key={item.id} className="Order-Horizontal-Card">
              <div className="Card-Top-Row">
                <div className="Type-Header">
                  <i className="fa-solid fa-house-chimney orange-icon"></i>
                  <strong>{item.typeName}</strong>
                </div>
                <div className={`Status-Label ${item.statusClass}`}>
                  <i className={`fa-solid ${item.statusClass === 'Success' ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                  {item.statusName}
                </div>
                <button className="Btn-View-Detail" onClick={() => setSelectedOrder(item)}>
                  Chi tiết
                </button>
              </div>

              <div className="Card-Main-Grid">
                <div className="Grid-Col">
                  <p>Người đặt : <span>{item.customer}</span></p>
                  <p>Email: <span>{item.email}</span></p>
                  <p>Sự kiện : <span>{item.eventName}</span></p>
                </div>
                <div className="Grid-Col">
                  <p>Số người : <span>{item.guests}</span></p>
                  <p>Liên Hệ : <span>{item.phone}</span></p>
                </div>
                <div className="Grid-Col">
                  <p>Số bàn : <span>{item.tables}</span></p>
                  <p>Đặt Ngày : <span>{item.date}</span></p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default OrderHistory;