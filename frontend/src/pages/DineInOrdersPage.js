import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, MoreHorizontal, Download, History, ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import '../styles/DineInOrdersPage.css';

function DineInOrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dine');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const dineInTabs = [
    { label: 'Tất cả', count: 12, filterKey: 'all' },
    { label: 'Ăn tại chỗ', count: 3, filterKey: 'dine' },
    { label: 'Mang về', count: 4, filterKey: 'takeaway' },
    { label: 'Vận chuyển', count: 5, filterKey: 'delivery' },
    { label: 'Sự kiện', count: 2, filterKey: 'event' }
  ];

  const dineInOrders = [
    {
      code: '#HD001',
      tableNumber: 'Bàn 05',
      waiter: 'Lê Văn Khoa',
      duration: '45 phút',
      items: '4 món ăn',
      amount: '250.000đ',
      status: 'Đang phục vụ',
      statusClass: 'serving',
      image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: 'dine'
    },
    {
      code: '#HD002',
      tableNumber: 'Bàn 12',
      waiter: 'Nguyễn Thị Mai',
      duration: '30 phút',
      items: '3 món ăn',
      amount: '180.000đ',
      status: 'Đã đủ món',
      statusClass: 'ready',
      image: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: 'dine'
    },
    {
      code: '#HD014',
      tableNumber: 'Bàn 03',
      waiter: 'Phạm Văn Hùng',
      duration: '20 phút',
      items: '2 món ăn',
      amount: '120.000đ',
      status: 'Đang chuẩn bị',
      statusClass: 'preparing',
      image: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: 'dine'
    },
    {
      code: '#HD020',
      tableNumber: 'Bàn 08',
      waiter: 'Trần Minh Đức',
      duration: '15 phút',
      items: '5 món ăn',
      amount: '350.000đ',
      status: 'Mới đặt',
      statusClass: 'pending',
      image: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      icon: 'dine'
    }
  ];

  const dineInHistory = [
    {
      code: '#HD0031',
      tableNumber: 'Bàn 15',
      waiter: 'Lê Văn Khoa',
      amount: '280.000đ',
      status: 'Đã thanh toán',
      completedDate: '14/01/2025'
    },
    {
      code: '#HD0028',
      tableNumber: 'Bàn 09',
      waiter: 'Nguyễn Thị Mai',
      amount: '220.000đ',
      status: 'Đã thanh toán',
      completedDate: '14/01/2025'
    },
    {
      code: '#HD0022',
      tableNumber: 'Bàn 02',
      waiter: 'Phạm Văn Hùng',
      amount: '150.000đ',
      status: 'Đã thanh toán',
      completedDate: '13/01/2025'
    }
  ];

  const handleTabClick = (filterKey) => {
    setActiveTab(filterKey);
    setCurrentPage(1);
  };

  const filteredOrders = activeTab === 'all' ? dineInOrders : dineInOrders.filter(order => order.icon === activeTab);
  
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="dinein-page-wrapper">
      {/* Header */}
      <div className="dinein-page-header">
        <div className="dinein-header-content">
          <div>
            <h1>Quản lý Ăn tại chỗ</h1>
            <p>Tổng cộng <strong>{dineInOrders.length} đơn hàng</strong> trong hệ thống</p>
          </div>
          <div className="dinein-header-actions">
            <button className="dinein-btn-secondary">
              <Filter size={16} />
              Bộ lọc
            </button>
            <button className="dinein-btn-secondary">
              <Download size={16} />
              Tải xuống
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dinein-tabs-container">
        {dineInTabs.map((tab) => (
          <button
            key={tab.filterKey}
            className={`dinein-tab ${activeTab === tab.filterKey ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.filterKey)}
          >
            {tab.label}
            <small>{tab.count}</small>
          </button>
        ))}
      </div>

      {/* Active Orders */}
      <div className="dinein-active-section">
        <div className="dinein-section-header">
          <div className="dinein-header-title">
            <div className="dinein-icon-box">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <h2>Đơn hàng đang phục vụ</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                {displayedOrders.length} đơn hàng
              </p>
            </div>
          </div>
          <span className="dinein-count-badge">{displayedOrders.length} BÀN</span>
        </div>

        {displayedOrders.length > 0 ? (
          <div className="dinein-orders-grid">
            {displayedOrders.map((order) => (
              <div 
                key={order.code} 
                className="dinein-order-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/manager/orders/dine-in/${encodeURIComponent(order.code)}`)}
              >
                <div className="dinein-card-header">
                  <div className="dinein-card-info">
                    <div className="dinein-card-type">
                      <span className="dinein-icon">🍽️</span>
                      <span className="dinein-code">{order.code}</span>
                    </div>
                    <h3 className="dinein-table-number">{order.tableNumber}</h3>
                    <div className="dinein-waiter-info">
                      <p>{order.waiter}</p>
                      <p className="dinein-duration">Phục vụ: {order.duration}</p>
                    </div>
                  </div>
                  <button 
                    className="dinein-more-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add menu actions here
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                <div
                  className="dinein-card-image"
                  style={{ background: order.image }}
                >
                  <div className="dinein-image-overlay"></div>
                  <span className="dinein-items-count">{order.items}</span>
                </div>

                <div className="dinein-card-status">
                  <span className={`dinein-status-badge status-${order.statusClass}`}>
                    {order.status}
                  </span>
                </div>

                <div className="dinein-card-footer">
                  <p className="dinein-card-amount">{order.amount}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            Không có đơn hàng nào
          </div>
        )}

        {filteredOrders.length > itemsPerPage && (
          <div className="dinein-pagination-section">
            <p className="dinein-pagination-text">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredOrders.length)} trong {filteredOrders.length}
            </p>
            <div className="dinein-pagination-controls">
              <button 
                className="dinein-pagination-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                Trước
              </button>

              <div className="dinein-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`${page === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                className="dinein-pagination-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="dinein-history-section">
        <div className="dinein-history-header">
          <History size={20} />
          <h2>Lịch sử phục vụ</h2>
        </div>

        <div className="dinein-history-table-wrapper">
          <table className="dinein-history-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Bàn</th>
                <th>Phục vụ bởi</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày hoàn thành</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dineInHistory.map((order) => (
                <tr key={order.code}>
                  <td className="dinein-table-code">{order.code}</td>
                  <td>{order.tableNumber}</td>
                  <td>{order.waiter}</td>
                  <td className="dinein-table-amount">{order.amount}</td>
                  <td>
                    <span className="dinein-status-completed">{order.status}</span>
                  </td>
                  <td>{order.completedDate}</td>
                  <td>
                    <button className="dinein-detail-btn">Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dinein-history-footer">
            <span>Tổng {dineInHistory.length} đơn hàng đã hoàn thành</span>
            <div className="dinein-history-pagination">
              <button disabled>
                <ChevronLeft size={14} />
              </button>
              <button>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DineInOrdersPage;
