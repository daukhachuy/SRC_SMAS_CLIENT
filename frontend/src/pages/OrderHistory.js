import React, { useState, useEffect } from 'react';
import OrderDetailModal from './OrderDetailModal'; // Import cùng thư mục pages
import '../styles/MyOrders.css';

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
    // Fake API lịch sử đơn hàng
    const mockApi = () => new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { 
            id: 'HIS-8892', type: 'completed', typeName: 'Tiệc Sinh Nhật', 
            statusName: 'Đã hoàn thành', statusClass: 'Success', 
            date: '20/12/2025', totalPrice: 2500000 
          },
          { 
            id: 'HIS-1102', type: 'cancelled', typeName: 'Giao Hàng', 
            statusName: 'Đã hủy', statusClass: 'Cancel', 
            date: '10/01/2026', totalPrice: 120000 
          }
        ]);
      }, 800);
    });

    const allData = await mockApi();
    const filtered = activeTab === 'all' ? allData : allData.filter(i => i.type === activeTab);
    setHistory(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  return (
    <div className="Content-Card animate-fade-in">
      <h1 className="Content-Title">Lịch Sử Giao Dịch</h1>

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
            <p>Đang tải lịch sử...</p>
          </div>
        ) : history.length > 0 ? (
          history.map(item => (
            <div key={item.id} className="Order-Modern-Card">
              <div className="Order-Card-Header">
                <div className="Type-Tag">
                  <i className="fa-solid fa-clock-rotate-left"></i> {item.typeName}
                </div>
                <span className={`Status-Badge ${item.statusClass}`}>{item.statusName}</span>
              </div>

              <div className="Order-Card-Body">
                <div className="Order-Info-Grid">
                  <div className="Info-Item">
                    <label>Mã đơn</label>
                    <span className="Highlight-Text">#{item.id}</span>
                  </div>
                  <div className="Info-Item">
                    <label>Ngày giao dịch</label>
                    <span>{item.date}</span>
                  </div>
                  <div className="Info-Item">
                    <label>Tổng thanh toán</label>
                    <span className="Price-Text">{item.totalPrice.toLocaleString()} đ</span>
                  </div>
                </div>

                <div className="Order-Card-Footer">
                  <div className="Action-Section">
                    <button className="Btn-Detail-Modern" onClick={() => setSelectedOrder(item)}>
                      Xem hóa đơn
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="Empty-State Status-Message">
            <i className="fa-solid fa-folder-open" style={{fontSize: '3rem', opacity: 0.3}}></i>
            <p>Không có dữ liệu giao dịch.</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default OrderHistory;