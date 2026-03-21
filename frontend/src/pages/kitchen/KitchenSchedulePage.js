import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  MapPin,
  Bell
} from 'lucide-react';

const KitchenSchedulePage = () => {
  const [viewMode, setViewMode] = useState('week');
  const [currentWeek, setCurrentWeek] = useState('Tuần 42 (16/10 - 22/10/2023)');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [selectedManager, setSelectedManager] = useState('');

  // Mock data cho lịch làm việc
  const weekSchedule = [
    { 
      day: 'Thứ 2', 
      date: '16',
      shifts: [
        { id: 'shift-1', name: 'Ca Sáng', time: '07:00 - 12:00', color: 'blue', location: null }
      ]
    },
    { 
      day: 'Thứ 3', 
      date: '17',
      shifts: [
        { id: 'shift-2', name: 'Ca Chiều', time: '12:00 - 17:00', color: 'green', location: null }
      ]
    },
    { 
      day: 'Thứ 4', 
      date: '18',
      isToday: true,
      shifts: [
        { id: 'shift-3', name: 'Ca Tối', time: '17:00 - 22:00', color: 'primary', location: 'Khu vực VIP' }
      ]
    },
    { 
      day: 'Thứ 5', 
      date: '19',
      shifts: [
        { id: 'shift-4', name: 'Ca Sáng', time: '07:00 - 12:00', color: 'blue', location: null }
      ]
    },
    { 
      day: 'Thứ 6', 
      date: '20',
      shifts: [
        { id: 'shift-5', name: 'Ca Chiều', time: '12:00 - 17:00', color: 'green', location: null },
        { id: 'shift-6', name: 'Ca Tối', time: '17:00 - 22:00', color: 'purple', location: null }
      ]
    },
    { 
      day: 'Thứ 7', 
      date: '21',
      shifts: [],
      isOff: true
    },
    { 
      day: 'Chủ Nhật', 
      date: '22',
      shifts: [
        { id: 'shift-7', name: 'Ca Tối', time: '17:00 - 22:00', color: 'purple', location: null }
      ]
    }
  ];

  const notifications = [
    {
      id: 1,
      type: 'update',
      title: 'Cập nhật ca làm',
      content: 'Bạn đã được phân công thêm Ca Tối vào Thứ 6 này.',
      time: '10 phút trước',
      isNew: true
    },
    {
      id: 2,
      type: 'approved',
      title: 'Đã phê duyệt',
      content: 'Yêu cầu đổi ca Thứ 3 (17/10) đã được Quản lý chấp nhận.',
      time: '2 giờ trước',
      isNew: false
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Nhắc nhở',
      content: 'Đừng quên check-in đúng giờ cho ca làm hôm nay tại Khu vực VIP.',
      time: 'Hôm qua',
      isNew: false
    }
  ];

  const handlePrevWeek = () => {
    console.log('Previous week');
  };

  const handleNextWeek = () => {
    console.log('Next week');
  };

  const handleSwapRequest = () => {
    if (!selectedShift) {
      alert('Vui lòng chọn ca làm việc cần đổi');
      return;
    }
    if (!swapReason.trim()) {
      alert('Vui lòng nhập lý do đổi ca');
      return;
    }
    if (!selectedManager) {
      alert('Vui lòng chọn quản lý phê duyệt');
      return;
    }
    console.log('Swap request:', { selectedShift, swapReason, selectedManager });
    setShowSwapModal(false);
    setSelectedShift('');
    setSwapReason('');
    setSelectedManager('');
  };

  return (
    <div className="kitchen-schedule-container">
      <div className="schedule-header">
        <div className="schedule-header-left">
          <h2 className="schedule-title">Lịch làm việc của tôi</h2>
          <p className="schedule-subtitle">Theo dõi và quản lý lịch trình làm việc hàng tuần của bạn.</p>
        </div>
        <div className="schedule-view-toggle">
          <button 
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => setViewMode('month')}
          >
            Tháng
          </button>
          <button 
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Tuần
          </button>
          <button 
            className={viewMode === 'day' ? 'active' : ''}
            onClick={() => setViewMode('day')}
          >
            Ngày
          </button>
        </div>
      </div>

      <div className="schedule-content-wrapper">
        <div className="schedule-calendar-section">
          <div className="calendar-card">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={handlePrevWeek}>
                <ChevronLeft size={20} />
              </button>
              <h3 className="calendar-title">{currentWeek}</h3>
              <button className="calendar-nav-btn" onClick={handleNextWeek}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="calendar-grid">
              {weekSchedule.map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-day ${day.isToday ? 'today' : ''}`}
                >
                  <div className="calendar-day-header">
                    <span className="day-label">{day.isToday ? 'Hôm nay' : day.day}</span>
                    <span className="day-date">{day.date}</span>
                  </div>
                  <div className="calendar-day-content">
                    {day.isOff ? (
                      <div className="day-off-label">Nghỉ lễ</div>
                    ) : (
                      day.shifts.map((shift) => (
                        <div 
                          key={shift.id} 
                          className={`shift-card ${shift.color} ${day.isToday ? 'current' : ''}`}
                        >
                          <p className="shift-name">{shift.name}</p>
                          <p className="shift-time">{shift.time}</p>
                          {shift.location && (
                            <div className="shift-location">
                              <MapPin size={12} />
                              <span>{shift.location}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="schedule-sidebar">
          <button 
            className="swap-request-btn"
            onClick={() => setShowSwapModal(true)}
          >
            <RefreshCw size={20} />
            Gửi yêu cầu đổi ca
          </button>

          <div className="notifications-card">
            <div className="notifications-header">
              <h3 className="notifications-title">
                <Bell size={18} />
                Thông báo & Yêu cầu
              </h3>
              <span className="notifications-badge">3 mới</span>
            </div>
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${notif.isNew ? 'new' : ''}`}
                >
                  <div className="notification-header">
                    <span className={`notification-type ${notif.type}`}>{notif.title}</span>
                    <span className="notification-time">{notif.time}</span>
                  </div>
                  <p className="notification-content">{notif.content}</p>
                </div>
              ))}
            </div>
            <div className="notifications-footer">
              <a href="#" className="view-all-link">Xem tất cả thông báo</a>
            </div>
          </div>

          <div className="stats-card">
            <h4 className="stats-title">Thống kê tuần này</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <p className="stat-label">Số ca</p>
                <p className="stat-value">5/7</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Tổng giờ</p>
                <p className="stat-value">28h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Shift Modal */}
      {showSwapModal && (
        <div className="kitchen-modal-overlay" onClick={() => setShowSwapModal(false)}>
          <div className="kitchen-modal swap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kitchen-modal-header">
              <div className="modal-header-content">
                <div className="modal-icon primary">
                  <RefreshCw size={24} />
                </div>
                <h3 className="kitchen-modal-title">Yêu cầu đổi ca làm việc</h3>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setShowSwapModal(false)}
              >
                ×
              </button>
            </div>

            <div className="kitchen-modal-content">
              <div className="kitchen-form-group">
                <label className="kitchen-form-label">
                  Chọn ca làm cần đổi
                </label>
                <select
                  className="kitchen-select"
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                >
                  <option value="">-- Chọn ca làm việc trong tuần --</option>
                  <option value="1">Thứ 4, 18/10 - Ca Tối (17:00 - 22:00)</option>
                  <option value="2">Thứ 5, 19/10 - Ca Sáng (07:00 - 12:00)</option>
                  <option value="3">Thứ 6, 20/10 - Ca Chiều (12:00 - 17:00)</option>
                  <option value="4">Thứ 6, 20/10 - Ca Tối (17:00 - 22:00)</option>
                </select>
              </div>

              <div className="kitchen-form-group">
                <label className="kitchen-form-label">
                  Lý do đổi ca
                </label>
                <textarea
                  className="kitchen-textarea"
                  placeholder="Vui lòng nhập lý do cụ thể..."
                  rows={4}
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                />
              </div>

              <div className="kitchen-form-group">
                <label className="kitchen-form-label">
                  Chọn quản lý phê duyệt
                </label>
                <select
                  className="kitchen-select"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                >
                  <option value="">-- Danh sách quản lý --</option>
                  <option value="m1">Quản lý Lê Minh Tâm</option>
                  <option value="m2">Quản lý Trần Hoàng Nam</option>
                  <option value="m3">Quản lý Phạm Thu Hương</option>
                </select>
              </div>
            </div>

            <div className="kitchen-modal-footer">
              <button 
                className="kitchen-btn secondary"
                onClick={() => setShowSwapModal(false)}
              >
                Hủy
              </button>
              <button 
                className="kitchen-btn primary"
                onClick={handleSwapRequest}
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenSchedulePage;
