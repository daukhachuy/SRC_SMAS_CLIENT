import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  MoreHorizontal,
  Download,
  History,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '../../styles/TakeawayOrdersPage.css';

const takeawayTabs = [
  { label: 'Tất cả', count: 12, filterKey: 'all' },
  { label: 'Ăn tại chỗ', count: 3, filterKey: 'dine' },
  { label: 'Mang về', count: 4, filterKey: 'takeaway' },
  { label: 'Vận chuyển', count: 5, filterKey: 'delivery' },
  { label: 'Sự kiện', count: 2, filterKey: 'event' }
];

const takeawayOrders = [
  {
    code: '#MV004',
    type: 'Mang về',
    customerName: 'Chị Lan',
    items: '2 món ăn',
    amount: '150.000đ',
    status: 'Chờ lấy',
    statusClass: 'ready',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjTzNqXWtJqPVFB-FOMDKCYDeMub5yBqVpBab2afWwrMsV1eLuejqvlXX4gol5_nI1LjGXp2fLw0lrFDeKDGZ87yQ2pBg2pkcCiFYVruLgnxqHIn5QcB9iS8kZiIhuFP2OGHhoBkKKKeulJcfij5lp-zSWnYp_E6BxQxC7yLI9X8PE3Q1G6YE2AgJ8zwX8J-9NGSnir88No9kGz4l8Ddp4_xkGxMTRyU9r16WIOx5h2VtI7I20IaxNZGXxQW3xBKMDhHRF8R_nEFI',
    icon: 'takeaway'
  },
  {
    code: '#MV007',
    type: 'Mang về',
    customerName: 'Anh Nam',
    items: '4 món ăn',
    amount: '320.000đ',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD--pKKiLLFbBFyxbHp9pdf2TDQ_oW0wl90W7Gh5nyAsPMdTUu08VqRo1E_4z02Nbld-bKF6uUBsJ7eknI3bCaTMOL5cnQNGJwJ9UP8Bg148IxHfRbkKTxTTpqFccKE8LWeY1Fhzxia4gvJYdVTjcOx3F2JqHexTUNbErrt2Wix_0uGhGOb6DlCevzKZOJCXVRfRUWGuHlsr2qxbJCcD9S2I2nEVDA5h4WaA0XJKoho-o0va1NRIwuiYTjA8DEPCoS6VoftjUCTjuU',
    icon: 'takeaway'
  }
];

const takeawayHistory = [
  {
    code: '#MV0009',
    time: '12:30 - 24/10/2023',
    customerName: 'Chị Mai',
    items: '03 món',
    amount: '215.000đ',
    status: 'Hoàn thành'
  },
  {
    code: '#MV0006',
    time: '11:20 - 24/10/2023',
    customerName: 'Anh Hùng',
    items: '05 món',
    amount: '480.000đ',
    status: 'Hoàn thành'
  },
  {
    code: '#MV0005',
    time: '10:45 - 24/10/2023',
    customerName: 'Chị Thảo',
    items: '02 món',
    amount: '125.000đ',
    status: 'Hoàn thành'
  }
];

const TakeawayOrdersPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('takeaway');

  const filteredOrders = activeTab === 'all' 
    ? takeawayOrders 
    : takeawayOrders.filter(order => order.icon === activeTab);

  const handleTabClick = (filterKey) => {
    setActiveTab(filterKey);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ready':
        return 'status-ready';
      case 'preparing':
        return 'status-preparing';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="takeaway-page-wrapper">
      {/* Header */}
      <div className="takeaway-page-header">
        <div className="takeaway-header-content">
          <div>
            <h1>Quản lý đơn hàng Mang về</h1>
            <p>Hôm nay: <strong>24 tháng 10, 2023</strong></p>
          </div>
          <div className="takeaway-header-actions">
            <button className="takeaway-btn-secondary">
              <Filter size={16} />
              <span>Bộ lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="takeaway-tabs-container">
        {takeawayTabs.map((tab) => (
          <button 
            key={tab.label}
            className={`takeaway-tab ${activeTab === tab.filterKey ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.filterKey)}
          >
            <span>{tab.label}</span>
            <small>{tab.count.toString().padStart(2, '0')}</small>
          </button>
        ))}
      </div>

      {/* Active Orders Section */}
      <section className="takeaway-active-section">
        <div className="takeaway-section-header">
          <div className="takeaway-header-title">
            <div className="takeaway-icon-box">
              <UtensilsCrossed size={20} />
            </div>
            <h2>Đơn hàng mang về đang hoạt động</h2>
            <span className="takeaway-count-badge">{filteredOrders.length} đơn</span>
          </div>
        </div>

        <div className="takeaway-orders-grid">
          {filteredOrders.map((order) => (
            <div 
              key={order.code} 
              className="takeaway-order-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/manager/orders/takeaway/${order.code}`)}
            >
              <div className="takeaway-card-header">
                <div className="takeaway-card-info">
                  <div className="takeaway-card-type">
                    <span className="takeaway-icon">🛍️</span>
                    <span className="takeaway-code">{order.code}</span>
                  </div>
                  <p className="takeaway-customer-name">{order.customerName}</p>
                </div>
                <span className={`takeaway-status-badge ${getStatusClass(order.statusClass)}`}>
                  {order.status}
                </span>
              </div>

              <div 
                className="takeaway-card-image"
                style={{ backgroundImage: `url(${order.image})` }}
              >
                <div className="takeaway-image-overlay"></div>
                <span className="takeaway-items-count">{order.items}</span>
              </div>

              <div className="takeaway-card-footer">
                <p className="takeaway-card-amount">{order.amount}</p>
                <button className="takeaway-more-btn">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="takeaway-pagination-section">
          <p className="takeaway-pagination-text">
            Hiển thị <span className="font-bold">{filteredOrders.length}</span> trên tổng số <span className="font-bold">12</span> đơn hàng
          </p>
          <div className="takeaway-pagination-controls">
            <button className="takeaway-pagination-btn" disabled>
              <ChevronLeft size={18} />
              <span>Trang trước</span>
            </button>
            <div className="takeaway-page-numbers">
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <span>...</span>
              <button>6</button>
            </div>
            <button className="takeaway-pagination-btn">
              <span>Trang sau</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="takeaway-history-section">
        <div className="takeaway-history-header">
          <History size={20} />
          <h2>Lịch sử đơn mang về gần nhất</h2>
        </div>

        <div className="takeaway-history-table-wrapper">
          <table className="takeaway-history-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Thời gian</th>
                <th>Khách hàng</th>
                <th>Số lượng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {takeawayHistory.map((order) => (
                <tr key={order.code}>
                  <td className="takeaway-table-code">{order.code}</td>
                  <td className="takeaway-table-time">{order.time}</td>
                  <td className="takeaway-table-customer">{order.customerName}</td>
                  <td className="takeaway-table-items">{order.items}</td>
                  <td className="takeaway-table-amount">{order.amount}</td>
                  <td>
                    <span className="takeaway-status-completed">{order.status}</span>
                  </td>
                  <td>
                    <button className="takeaway-detail-btn">Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="takeaway-history-footer">
          <p>Hiển thị 3 trên 42 đơn mang về</p>
          <div className="takeaway-history-pagination">
            <button disabled>
              <ChevronLeft size={20} />
            </button>
            <button>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TakeawayOrdersPage;
