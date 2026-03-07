import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Utensils,
  X,
  Edit,
  Trash2,
  Info,
  Check,
  XCircle,
  Clock3
} from 'lucide-react';
import '../../styles/ManagerReservationsPage.css';

// Sample events data
const eventsData = [
  {
    id: 1,
    customer: 'Công ty Công nghệ Alpha',
    contact: 'Mr. Nam',
    phone: '0909 111 222',
    eventType: 'Tiệc tất niên',
    eventTypeColor: 'blue',
    guests: 120,
    date: '15/01/2024',
    time: '18:00 - 22:00',
    status: 'signed',
    statusText: 'Đã ký kết',
    revenue: 85000000
  },
  {
    id: 2,
    customer: 'Hội thảo Quốc tế Delta',
    contact: 'Ms. Linh',
    phone: '0911 333 444',
    eventType: 'Hội thảo & Buffet',
    eventTypeColor: 'purple',
    guests: 80,
    date: '20/01/2024',
    time: '08:00 - 12:00',
    status: 'pending',
    statusText: 'Chưa có hợp đồng',
    revenue: 45000000,
    urgent: true
  },
  {
    id: 3,
    customer: 'Tiệc cưới Minh Quân & Thảo My',
    contact: 'Gia đình',
    phone: '0988 777 666',
    eventType: 'Tiệc cưới',
    eventTypeColor: 'rose',
    guests: 450,
    date: '05/02/2024',
    time: '17:00 - 21:30',
    status: 'signed',
    statusText: 'Đã ký kết',
    revenue: 320000000
  },
  {
    id: 4,
    customer: 'Sinh nhật Gia Bảo (1 tuổi)',
    contact: 'Phụ huynh',
    phone: '0944 555 444',
    eventType: 'Tiệc sinh nhật',
    eventTypeColor: 'cyan',
    guests: 60,
    date: '12/02/2024',
    time: '11:00 - 14:00',
    status: 'deposit',
    statusText: 'Chờ đặt cọc',
    revenue: 28000000
  }
];

const regularBookingsData = [
  {
    id: 'BK-201',
    customer: 'Trần Thanh Tùng',
    phone: '0905 123 456',
    guests: 4,
    time: '19:30',
    date: '12/10/2023',
    table: 'Bàn 08',
    status: 'dining',
    statusText: 'Đang dùng bữa'
  },
  {
    id: 'BK-202',
    customer: 'Lê Thị Mai',
    phone: '0388 999 111',
    guests: 2,
    time: '20:00',
    date: '12/10/2023',
    table: '',
    status: 'pending',
    statusText: 'Chờ xác nhận'
  },
  {
    id: 'BK-203',
    customer: 'Hoàng Minh Quân',
    phone: '0912 345 678',
    guests: 6,
    time: '18:45',
    date: '12/10/2023',
    table: 'Bàn 12, 14',
    status: 'confirmed',
    statusText: 'Đã xác nhận'
  },
  {
    id: 'BK-204',
    customer: 'Nguyễn Anh Đào',
    phone: '0707 555 666',
    guests: 2,
    time: '12:00',
    date: '12/10/2023',
    table: '',
    status: 'cancelled',
    statusText: 'Đã hủy'
  }
];

const ManagerReservationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('regular');
  const [searchQuery, setSearchQuery] = useState('');
  const currentPage = 1;
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Event tab statistics
  const upcomingEvents = eventsData.length;
  const pendingContracts = eventsData.filter(e => e.status === 'pending' || e.status === 'deposit').length;
  const urgentCount = eventsData.filter(e => e.urgent).length;
  const totalRevenue = eventsData.reduce((sum, e) => sum + e.revenue, 0);

  // Regular booking tab statistics
  const totalTodayBookings = 24;
  const pendingBookings = 8;
  const activeTables = 15;

  const filteredRegularBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return regularBookingsData;
    }
    return regularBookingsData.filter((booking) => (
      booking.customer.toLowerCase().includes(query) || booking.phone.includes(query)
    ));
  }, [searchQuery]);

  // Filter events by search query
  const filteredEvents = eventsData.filter((event) => (
    event.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.contact.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const getEventTypeColor = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700',
      purple: 'bg-purple-50 text-purple-700',
      rose: 'bg-rose-50 text-rose-700',
      cyan: 'bg-cyan-50 text-cyan-700',
      green: 'bg-green-50 text-green-700',
      amber: 'bg-amber-50 text-amber-700'
    };
    return colors[color] || colors.blue;
  };

  const getStatusConfig = (status) => {
    const configs = {
      signed: {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: <CheckCircle size={14} />
      },
      pending: {
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: <AlertCircle size={14} />
      },
      deposit: {
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: <AlertCircle size={14} />
      }
    };
    return configs[status] || configs.pending;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const getRegularStatusConfig = (status) => {
    const configs = {
      dining: {
        className: 'regular-status dining',
        icon: <Utensils size={14} />
      },
      pending: {
        className: 'regular-status pending',
        icon: <Clock3 size={14} />
      },
      confirmed: {
        className: 'regular-status confirmed',
        icon: <CheckCircle size={14} />
      },
      cancelled: {
        className: 'regular-status cancelled',
        icon: <XCircle size={14} />
      }
    };
    return configs[status] || configs.pending;
  };

  const openCancelModal = (booking) => {
    setCancelTarget(booking);
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason('');
  };

  return (
    <div className="reservations-page-container">
      {/* Header */}
      <header className="reservations-header">
        <div className="header-content">
          <div className="header-text">
            <h2>{activeTab === 'regular' ? 'Quản lý Đặt bàn' : 'Quản lý Sự kiện & Đặt tiệc'}</h2>
            <p>
              {activeTab === 'regular'
                ? 'Theo dõi và điều phối lịch đặt bàn thường nhật tại nhà hàng.'
                : 'Điều phối và quản lý các đơn đặt tiệc quy mô lớn, hội nghị và sự kiện.'}
            </p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder={activeTab === 'regular' ? 'Tìm tên khách hàng/SĐT...' : 'Tìm tên khách hàng/công ty...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn-create-event">
              <Plus size={20} />
              {activeTab === 'regular' ? 'Đặt bàn mới' : 'Tạo sự kiện mới'}
            </button>
          </div>
        </div>
      </header>

      {/* Statistics Cards */}
      {activeTab === 'regular' ? (
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-header">
              <p className="stat-label">Tổng đặt bàn hôm nay</p>
              <Calendar className="stat-icon text-blue-500" size={24} />
            </div>
            <p className="stat-value">{totalTodayBookings}</p>
            <p className="stat-info">Lượt đặt bàn trong ngày</p>
          </div>

          <div className="stat-card stat-card-amber">
            <div className="stat-header">
              <p className="stat-label">Đang chờ xác nhận</p>
              <AlertCircle className="stat-icon text-amber-500" size={24} />
            </div>
            <p className="stat-value text-amber-600">{String(pendingBookings).padStart(2, '0')}</p>
            <p className="stat-info text-amber-600">Cần xử lý ngay</p>
          </div>

          <div className="stat-card stat-card-green">
            <div className="stat-header">
              <p className="stat-label">Bàn đang sử dụng</p>
              <Utensils className="stat-icon text-green-600" size={24} />
            </div>
            <p className="stat-value text-green-600">{activeTables}</p>
            <p className="stat-info">Công suất 75%</p>
          </div>
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Sự kiện sắp tới</p>
              <Calendar className="stat-icon text-primary" size={24} />
            </div>
            <p className="stat-value">{upcomingEvents}</p>
            <p className="stat-change positive">+2 so với tuần trước</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Chờ ký hợp đồng</p>
              <AlertCircle className="stat-icon text-amber-500" size={24} />
            </div>
            <p className="stat-value text-amber-600">{String(pendingContracts).padStart(2, '0')}</p>
            <p className="stat-info">Cần xử lý gấp {String(urgentCount).padStart(2, '0')} đơn</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Doanh thu dự kiến</p>
              <FileText className="stat-icon text-green-600" size={24} />
            </div>
            <p className="stat-value">{formatCurrency(totalRevenue)}</p>
            <p className="stat-info">Tháng hiện tại</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="content-card">
        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'regular' ? 'active' : ''}`}
            onClick={() => setActiveTab('regular')}
          >
            <Calendar size={18} />
            Lịch đặt bàn thường
          </button>
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Users size={18} />
            Đặt tiệc / Sự kiện
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          {activeTab === 'regular' ? (
            <table className="events-table regular-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Số lượng</th>
                  <th>Thời gian đặt</th>
                  <th>Số bàn</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegularBookings.map((booking) => {
                  const regularStatus = getRegularStatusConfig(booking.status);
                  return (
                    <tr key={booking.id} className={booking.status === 'cancelled' ? 'muted-row' : ''}>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{booking.customer}</div>
                          <div className="customer-contact">SĐT: {booking.phone}</div>
                        </div>
                      </td>
                      <td className="regular-value">{booking.guests} Khách</td>
                      <td>
                        <div className="date-time-info">
                          <div className="time">{booking.time}</div>
                          <div className="date">{booking.date}</div>
                        </div>
                      </td>
                      <td>
                        {booking.table ? (
                          <span className="table-chip">{booking.table}</span>
                        ) : (
                          <span className="table-empty">Chưa chỉ định</span>
                        )}
                      </td>
                      <td>
                        <span className={regularStatus.className}>
                          {regularStatus.icon}
                          {booking.statusText}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {booking.status === 'pending' ? (
                            <>
                              <button className="btn-confirm-inline">
                                <Check size={14} />
                                Xác nhận
                              </button>
                              <button className="btn-cancel-inline" onClick={() => openCancelModal(booking)}>
                                <X size={14} />
                                Hủy
                              </button>
                            </>
                          ) : booking.status === 'cancelled' ? (
                            <button className="btn-icon-only" title="Chi tiết">
                              <Info size={16} />
                            </button>
                          ) : (
                            <>
                              <button className="btn-icon-only" title="Chỉnh sửa">
                                <Edit size={16} />
                              </button>
                              <button className="btn-icon-only danger" title="Hủy đặt bàn" onClick={() => openCancelModal(booking)}>
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="events-table">
              <thead>
                <tr>
                  <th>Khách hàng / Công ty</th>
                  <th>Loại sự kiện</th>
                  <th>Số lượng khách</th>
                  <th>Ngày tổ chức</th>
                  <th>Trạng thái hợp đồng</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const statusConfig = getStatusConfig(event.status);
                  return (
                    <tr
                      key={event.id}
                      className={event.urgent ? 'urgent-row' : ''}
                    >
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{event.customer}</div>
                          <div className="customer-contact">
                            Người liên hệ: {event.contact} ({event.phone})
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`event-type-badge ${getEventTypeColor(event.eventTypeColor)}`}>
                          {event.eventType}
                        </span>
                      </td>
                      <td>
                        <div className="guests-info">
                          <Users className="guests-icon" size={18} />
                          <span className="guests-count">{event.guests} khách</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-time-info">
                          <div className="time">{event.time}</div>
                          <div className="date">{event.date}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          {statusConfig.icon}
                          {event.statusText}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-detail"
                            onClick={() => navigate('/manager/reservations/SK-2024-001')}
                          >
                            <Eye size={14} />
                            Chi tiết
                          </button>
                          <button
                            className="btn-contract"
                            onClick={() => navigate('/manager/reservations/SK-2024-001/contract')}
                          >
                            <FileText size={14} />
                            Hợp đồng
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="table-footer">
          <p className="pagination-info">
            {activeTab === 'regular'
              ? `Hiển thị ${filteredRegularBookings.length} trên ${totalTodayBookings} lượt đặt bàn`
              : `Hiển thị ${filteredEvents.length} trong số ${eventsData.length} sự kiện sắp tới`}
          </p>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {cancelTarget && (
        <div className="cancel-modal-overlay" onClick={closeCancelModal}>
          <div className="cancel-modal" onClick={(event) => event.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-modal-title-wrap">
                <div className="cancel-icon-wrap">
                  <Trash2 size={18} />
                </div>
                <h3 className="cancel-modal-title">Xác nhận hủy đặt bàn</h3>
              </div>
              <button className="cancel-close-btn" onClick={closeCancelModal}>
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <p className="cancel-modal-text">
                Bạn có chắc chắn muốn hủy lượt đặt bàn của khách hàng{' '}
                <strong>{cancelTarget.customer}</strong> không?
              </p>

              <div className="cancel-warning-box">
                <AlertCircle size={18} />
                <p>
                  Hành động này không thể hoàn tác. Lịch đặt bàn sẽ được chuyển sang trạng thái "Đã hủy".
                </p>
              </div>

              <label className="cancel-label" htmlFor="cancel-reason">
                Lý do hủy <span>*</span>
              </label>
              <textarea
                id="cancel-reason"
                className="cancel-textarea"
                placeholder="Nhập lý do hủy (ví dụ: Khách gọi báo hủy, hết bàn...)"
                rows={4}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
              <p className="cancel-note">Thông tin này sẽ được lưu vào lịch sử đặt bàn.</p>
            </div>

            <div className="cancel-modal-footer">
              <button className="btn-cancel-secondary" onClick={closeCancelModal}>
                Hủy bỏ
              </button>
              <button
                className="btn-cancel-danger"
                disabled={!cancelReason.trim()}
                onClick={closeCancelModal}
              >
                <Trash2 size={14} />
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReservationsPage;
