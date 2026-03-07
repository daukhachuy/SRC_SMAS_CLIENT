import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Heart,
  Cake,
  Users,
  Briefcase,
  Crown,
  Calendar,
  History,
} from 'lucide-react';
import EventDetailModal from './EventDetailModal';

const ManagerEventOrdersPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const eventTabs = [
    { id: 'all', label: 'Tất cả', count: 32 },
    { id: 'dine-in', label: 'Ăn tại chỗ', count: 12 },
    { id: 'takeaway', label: 'Mang về', count: 6 },
    { id: 'delivery', label: 'Vận chuyển', count: 10 },
    { id: 'events', label: 'Sự kiện', count: 8 },
  ];

  const eventCards = [
    {
      id: 'SK001',
      type: 'Tiệc cưới',
      name: 'Đám cưới Minh & Hạnh',
      status: 'Đã ký hợp đồng',
      statusClass: 'green',
      guestCount: '250 khách',
      date: '30/11/2023',
      amount: '45.000.000đ',
      icon: 'heart',
      color: 'purple',
    },
    {
      id: 'SK002',
      type: 'Workshop',
      name: 'Digital Marketing 2023',
      status: 'Chưa có hợp đồng',
      statusClass: 'amber',
      guestCount: '50 khách',
      date: '05/12/2023',
      amount: '12.500.000đ',
      icon: 'briefcase',
      color: 'blue',
    },
    {
      id: 'SK003',
      type: 'Sinh nhật',
      name: 'Thôi nôi bé Bún',
      status: 'Đã ký hợp đồng',
      statusClass: 'green',
      guestCount: '30 khách',
      date: '28/10/2023',
      amount: '8.200.000đ',
      icon: 'cake',
      color: 'pink',
      // Detailed data for modal
      menuItems: [
        {
          name: 'Gỏi ngó sen tôm thịt',
          quantity: '10',
          unitPrice: '185.000đ',
          totalPrice: '1.850.000đ',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD--pKKiLLFbBFyxbHp9pdf2TDQ_oW0wl90W7Gh5nyAsPMdTUu08VqRo1E_4z02Nbld-bKF6uUBsJ7eknI3bCaTMOL5cnQNGJwJ9UP8Bg148IxHfRbkKTxTTpqFccKE8LWeY1Fhzxia4gvJYdVTjcOx3F2JqHexTUNbErrt2Wix_0uGhGOb6DlCevzKZOJCXVRfRUWGuHlsr2qxbJCcD9S2I2nEVDA5h4WaA0XJKoho-o0va1NRIwuiYTjA8DEPCoS6VoftjUCTjuU'
        },
        {
          name: 'Gà quay mật ong (Con)',
          quantity: '05',
          unitPrice: '420.000đ',
          totalPrice: '2.100.000đ',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAFhkqirmoFN_flgfsh1gx_upLY6RFtouNfYSwM6HAMfY5yuFCCdf-cjijg_E69xhWRxZaMjCw57ZwrFg7W9-ZRB437UE4ZMwiHLNVygvelD9HWx3q9soSnEu3-VUhCDVvTZh_eDk9OL3XstP7lp0tWrNCvhlg1cvPU9r1tnom3aOR0S4UA41p-BF1ISNxlKqyrrWrSIq_wd6PeS3HH6enSNqRh9-N7L2rsH-ggvqljLJDg75xLW1eYFcksp3Kznz2uii5vtQEAfY'
        },
        {
          name: 'Lẩu thái hải sản (Lớn)',
          quantity: '03',
          unitPrice: '550.000đ',
          totalPrice: '1.650.000đ',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD--pKKiLLFbBFyxbHp9pdf2TDQ_oW0wl90W7Gh5nyAsPMdTUu08VqRo1E_4z02Nbld-bKF6uUBsJ7eknI3bCaTMOL5cnQNGJwJ9UP8Bg148IxHfRbkKTxTTpqFccKE8LWeY1Fhzxia4gvJYdVTjcOx3F2JqHexTUNbErrt2Wix_0uGhGOb6DlCevzKZOJCXVRfRUWGuHlsr2qxbJCcD9S2I2nEVDA5h4WaA0XJKoho-o0va1NRIwuiYTjA8DEPCoS6VoftjUCTjuU'
        }
      ],
      customer: {
        name: 'Nguyễn Hoàng Nam',
        type: 'Khách hàng thân thiết',
        phone: '090 123 4567',
        eventType: 'Sinh nhật',
        eventDate: '28/10/2023',
        guestCount: '30 người'
      },
      contractStatus: {
        status: 'Đã ký kết',
        code: 'Mã HĐ: #SK-2310-003'
      },
      paymentInfo: {
        menuTotal: '5.600.000đ',
        tax: '560.000đ',
        deposit: '2.000.000đ',
        remaining: '4.160.000đ'
      }
    },
    {
      id: 'SK004',
      type: 'Tất niên',
      name: 'Công ty TechPro',
      status: 'Chưa có hợp đồng',
      statusClass: 'amber',
      guestCount: '120 khách',
      date: '20/12/2023',
      amount: '25.800.000đ',
      icon: 'briefcase',
      color: 'orange',
    },
    {
      id: 'SK005',
      type: 'Tiệc cưới',
      name: 'Tiệc cưới Anh Quân',
      status: 'Đã ký hợp đồng',
      statusClass: 'green',
      guestCount: '300 khách',
      date: '15/01/2024',
      amount: '62.000.000đ',
      icon: 'heart',
      color: 'purple',
    },
    {
      id: 'SK006',
      type: 'Sinh nhật',
      name: 'Sinh nhật chị Mai',
      status: 'Chưa có hợp đồng',
      statusClass: 'amber',
      guestCount: '20 khách',
      date: '10/11/2023',
      amount: '5.500.000đ',
      icon: 'cake',
      color: 'pink',
    },
    {
      id: 'SK007',
      type: 'Hội nghị',
      name: 'Hội nghị Khách hàng',
      status: 'Đã ký hợp đồng',
      statusClass: 'green',
      guestCount: '80 khách',
      date: '22/11/2023',
      amount: '18.000.000đ',
      icon: 'users',
      color: 'blue',
    },
    {
      id: 'SK008',
      type: 'Khai trương',
      name: 'Cửa hàng Thời trang X',
      status: 'Chưa có hợp đồng',
      statusClass: 'amber',
      guestCount: '45 khách',
      date: '12/11/2023',
      amount: '9.600.000đ',
      icon: 'crown',
      color: 'yellow',
    },
  ];

  const historyEvents = [
    {
      id: 'SK0001',
      name: 'Tiệc cuối năm AB',
      date: '15/10/2023',
      guests: '150 khách',
      amount: '35.000.000đ',
    },
    {
      id: 'SK0002',
      name: 'Sinh nhật 18 tuổi Linh',
      date: '12/10/2023',
      guests: '40 khách',
      amount: '12.500.000đ',
    },
  ];

  const EventIcon = ({ type }) => {
    switch (type) {
      case 'heart':
        return <Heart className="w-5 h-5 text-purple-500" />;
      case 'cake':
        return <Cake className="w-5 h-5 text-pink-500" />;
      case 'users':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'briefcase':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'crown':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="events-header">
        <div className="events-header-search">
          <div className="events-search-input">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm tên sự kiện, mã đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="events-header-actions">
          <button className="events-header-btn-icon">
            <Bell className="w-5 h-5" />
          </button>
          <button className="events-header-btn-primary">
            <Plus className="w-5 h-5" />
            <span>Tạo đơn sự kiện</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="events-main">
        {/* Title Section */}
        <div className="events-page-header">
          <div className="events-title-block">
            <h1 className="events-title">Quản lý đơn hàng Sự kiện</h1>
            <p className="events-subtitle">
              Hôm nay: <span className="font-semibold">24 tháng 10, 2023</span>
            </p>
          </div>
          <div className="events-filter-buttons">
            <button className="events-filter-btn">
              <Filter className="w-5 h-5" />
              Bộ lọc
            </button>
            <button className="events-filter-btn">
              <Download className="w-5 h-5" />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="events-tabs">
          {eventTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`events-tab ${
                activeTab === tab.id ? 'events-tab-active' : ''
              }`}
            >
              {tab.label}
              <span
                className={`events-tab-badge ${
                  activeTab === tab.id ? 'events-tab-badge-active' : ''
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Events Section */}
        <section className="events-section">
          <div className="events-section-header">
            <div className="events-section-title">
              <Calendar className="w-6 h-6" />
              <h2>Danh sách sự kiện</h2>
              <span className="events-section-badge">08 đơn / trang</span>
            </div>
          </div>

          {/* Events Grid */}
          <div className="events-grid">
            {eventCards.map((event) => (
              <div
                key={event.id}
                className="events-card"
                onClick={() => {
                  setSelectedEvent(event);
                  setIsModalOpen(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="events-card-header">
                  <div className="events-card-title">
                    <div className="events-card-meta">
                      <EventIcon type={event.icon} />
                      <span className="events-card-code">
                        #{event.id} • {event.type}
                      </span>
                    </div>
                    <p className="events-card-name">{event.name}</p>
                  </div>
                  <div>
                    <span
                      className={`events-status-badge events-status-${event.statusClass}`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>

                <div className="events-card-content">
                  <div className="events-card-info">
                    <div className="events-card-info-item">
                      <Users className="w-4 h-4" />
                      <span>{event.guestCount}</span>
                    </div>
                    <div className="events-card-info-item">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                  </div>
                </div>

                <div className="events-card-footer">
                  <p className="events-card-amount">{event.amount}</p>
                  <button
                    className="events-card-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="events-pagination">
            <p className="events-pagination-text">
              Hiển thị <span className="font-bold">1-8</span> trong tổng số{' '}
              <span className="font-bold">32</span> đơn hàng sự kiện
            </p>
            <div className="events-pagination-controls">
              <button
                className="events-pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Trang trước
              </button>
              <div className="events-pagination-numbers">
                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`events-page-btn ${
                      currentPage === page
                        ? 'events-page-btn-active'
                        : 'events-page-btn-inactive'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="events-pagination-btn"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Trang sau
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section className="events-history-section">
          <div className="events-history-header">
            <History className="w-6 h-6" />
            <h2>Lịch sử sự kiện gần đây</h2>
          </div>

          <div className="events-history-table">
            <table className="w-full">
              <thead className="events-table-head">
                <tr>
                  <th>Mã sự kiện</th>
                  <th>Tên sự kiện</th>
                  <th>Ngày tổ chức</th>
                  <th>Số khách</th>
                  <th>Tổng tiền</th>
                  <th className="text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="events-table-body">
                {historyEvents.map((event) => (
                  <tr key={event.id} className="events-table-row">
                    <td className="events-table-cell font-bold">
                      {event.id}
                    </td>
                    <td className="events-table-cell font-medium">
                      {event.name}
                    </td>
                    <td className="events-table-cell text-slate-500">
                      {event.date}
                    </td>
                    <td className="events-table-cell text-slate-500">
                      {event.guests}
                    </td>
                    <td className="events-table-cell font-bold">
                      {event.amount}
                    </td>
                    <td className="events-table-cell text-right">
                      <button className="events-table-action">Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="events-history-footer">
              <p className="text-xs text-slate-500 font-medium">
                Hiển thị 2 trên 150 sự kiện đã qua
              </p>
              <div className="events-history-pagination">
                <button className="events-history-btn" disabled>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="events-history-btn">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="events-footer">
        <p>© 2023 Restaurant POS System • Designed by TechDine</p>
      </footer>

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        event={selectedEvent}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={() => {
          console.log('Save event changes:', selectedEvent);
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default ManagerEventOrdersPage;
