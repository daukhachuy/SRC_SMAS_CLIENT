import React, { useState } from 'react';
import { 
  UserPlus, CalendarPlus, Sun, Sunset, Moon, 
  Star, CheckCircle, Users, Plus, FileDown, Edit2, X,
  Search, ChevronLeft, ChevronRight, Calendar, Clock,
  MapPin, Save, Trash2
} from 'lucide-react';
import '../../styles/ManagerStaffPage.css';

// Full employee data with all details
const employeesData = [
  { 
    id: 1, 
    name: 'Nguyễn Văn An', 
    email: 'nv.an@example.com',
    avatar: 'https://i.pravatar.cc/150?img=12', 
    role: 'Đầu bếp',
    roleColor: 'orange',
    phone: '090 123 4567',
    joinDate: '12/05/2023',
    rating: 4.9,
    isWorking: true
  },
  { 
    id: 2, 
    name: 'Trần Thị Bình', 
    email: 'tt.binh@example.com',
    avatar: 'https://i.pravatar.cc/150?img=47', 
    role: 'Phục vụ',
    roleColor: 'blue',
    phone: '091 234 5678',
    joinDate: '18/02/2023',
    rating: 4.7,
    isWorking: false
  },
  { 
    id: 3, 
    name: 'Lê Thuỳ Linh', 
    email: 'lt.linh@example.com',
    avatar: 'https://i.pravatar.cc/150?img=31', 
    role: 'Thu ngân',
    roleColor: 'emerald',
    phone: '093 456 7890',
    joinDate: '01/01/2024',
    rating: 5.0,
    isWorking: true
  },
  { 
    id: 4, 
    name: 'Hoàng Anh', 
    email: 'h.anh@example.com',
    avatar: 'https://i.pravatar.cc/150?img=33', 
    role: 'Đầu bếp',
    roleColor: 'orange',
    phone: '094 567 8901',
    joinDate: '10/11/2023',
    rating: 4.8,
    isWorking: true
  },
  { 
    id: 5, 
    name: 'Phạm Minh Tâm', 
    email: 'pm.tam@example.com',
    avatar: 'https://i.pravatar.cc/150?img=45', 
    role: 'Phục vụ',
    roleColor: 'blue',
    phone: '095 678 9012',
    joinDate: '05/03/2024',
    rating: 4.6,
    isWorking: false
  },
  { 
    id: 6, 
    name: 'Đặng Minh Châu', 
    email: 'dm.chau@example.com',
    avatar: 'https://i.pravatar.cc/150?img=48', 
    role: 'Thu ngân',
    roleColor: 'emerald',
    phone: '096 789 0123',
    joinDate: '20/07/2023',
    rating: 4.5,
    isWorking: false
  },
  { 
    id: 7, 
    name: 'Vũ Văn Dũng', 
    email: 'vv.dung@example.com',
    avatar: 'https://i.pravatar.cc/150?img=59', 
    role: 'Phục vụ',
    roleColor: 'blue',
    phone: '097 890 1234',
    joinDate: '15/09/2023',
    rating: 4.4,
    isWorking: false
  },
  { 
    id: 8, 
    name: 'Bùi Thị Hương', 
    email: 'bt.huong@example.com',
    avatar: 'https://i.pravatar.cc/150?img=44', 
    role: 'Đầu bếp',
    roleColor: 'orange',
    phone: '098 901 2345',
    joinDate: '22/06/2023',
    rating: 4.3,
    isWorking: false
  },
  { 
    id: 9, 
    name: 'Ngô Văn Khoa', 
    email: 'nv.khoa@example.com',
    avatar: 'https://i.pravatar.cc/150?img=52', 
    role: 'Thu ngân',
    roleColor: 'emerald',
    phone: '099 012 3456',
    joinDate: '08/04/2024',
    rating: 4.2,
    isWorking: false
  },
  { 
    id: 10, 
    name: 'Dương Thị Lan', 
    email: 'dt.lan@example.com',
    avatar: 'https://i.pravatar.cc/150?img=38', 
    role: 'Phục vụ',
    roleColor: 'blue',
    phone: '089 123 4560',
    joinDate: '30/01/2024',
    rating: 4.1,
    isWorking: false
  },
];

// Weekly schedule data
const weekSchedule = [
  { day: 'Thứ 2', date: 12, highlight: false },
  { day: 'Thứ 3', date: 13, highlight: false },
  { day: 'Thứ 4', date: 14, highlight: true }, // today
  { day: 'Thứ 5', date: 15, highlight: false },
  { day: 'Thứ 6', date: 16, highlight: false },
  { day: 'Thứ 7', date: 17, highlight: false },
  { day: 'Chủ nhật', date: 18, highlight: false },
];

// Schedule assignments (employee IDs assigned to each shift and day)
const scheduleData = {
  morning: [
    [1, 2], // Monday
    [3], // Tuesday
    [4, 5], // Wednesday (today)
    [6], // Thursday
    [7], // Friday
    [8], // Saturday
    [9], // Sunday
  ],
  afternoon: [
    [10], [11, 12], [1], [2], [3], [4], [5]
  ],
  evening: [
    [6, 7], [8], [9], [10], [11], [12], [1]
  ]
};

// Currently working staff
const currentlyWorking = [
  { id: 1, name: 'Lê Thuỳ Linh', role: 'Phục vụ', location: 'Bàn A12', startTime: '12:15 PM', avatar: 'https://i.pravatar.cc/150?img=49' },
  { id: 2, name: 'Hoàng Anh', role: 'Bếp trưởng', location: 'Bếp chính', startTime: '08:00 AM', avatar: 'https://i.pravatar.cc/150?img=13' },
  { id: 3, name: 'Đặng Minh', role: 'Thu ngân', location: 'Quầy bar', startTime: '11:45 AM', avatar: 'https://i.pravatar.cc/150?img=27' },
];

const ManagerStaffPage = () => {
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' or 'list'
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const departments = ['all', 'kitchen', 'service', 'cashier'];
  const departmentLabels = {
    all: 'Tất cả',
    kitchen: 'Bếp',
    service: 'Phục vụ',
    cashier: 'Thu ngân'
  };

  const getRoleColorClass = (color) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return colors[color] || colors.blue;
  };

  const getEmployeeById = (id) => employeesData.find(emp => emp.id === id);

  const renderEmployeeAvatar = (employeeId) => {
    const employee = getEmployeeById(employeeId);
    if (!employee) return null;
    
    return (
      <div 
        key={employeeId}
        className="staff-avatar" 
        title={employee.name}
        onClick={() => {
          setSelectedEmployee(employee);
          setShowDetailModal(true);
        }}
      >
        <img src={employee.avatar} alt={employee.name} />
      </div>
    );
  };

  const filteredEmployees = employeesData.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || 
      (selectedDepartment === 'kitchen' && emp.role === 'Đầu bếp') ||
      (selectedDepartment === 'service' && emp.role === 'Phục vụ') ||
      (selectedDepartment === 'cashier' && emp.role === 'Thu ngân');
    
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="staff-page-container">
      {/* Header */}
      <div className="staff-header">
        <div className="staff-header-content">
          <div className="staff-header-text">
            <h2>{activeTab === 'schedule' ? 'Quản lý Nhân sự & Phân ca' : 'Danh sách nhân viên'}</h2>
            <p>{activeTab === 'schedule' 
              ? 'Theo dõi và sắp xếp lịch làm việc hàng tuần cho nhân viên'
              : 'Quản lý thông tin và hiệu suất làm việc của đội ngũ nhân sự'
            }</p>
          </div>
          <div className="staff-header-actions">
            {activeTab === 'list' && (
              <button className="btn-secondary">
                <FileDown size={20} />
                Xuất báo cáo
              </button>
            )}
            <button 
              className="btn-secondary"
              onClick={() => alert('Chức năng thêm nhân viên mới')}
            >
              <UserPlus size={20} />
              Thêm nhân viên mới
            </button>
            {activeTab === 'schedule' && (
              <button 
                className="btn-primary"
                onClick={() => setShowAssignModal(true)}
              >
                <CalendarPlus size={20} />
                Tạo ca làm việc
              </button>
            )}
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="staff-filters">
          <div className="department-filters">
            {departments.map(dept => (
              <button
                key={dept}
                className={`filter-btn ${selectedDepartment === dept ? 'active' : ''}`}
                onClick={() => setSelectedDepartment(dept)}
              >
                {departmentLabels[dept]}
              </button>
            ))}
          </div>

          {activeTab === 'list' && (
            <div className="search-box">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          <div className="staff-tabs">
            <button 
              className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              Lịch làm việc
            </button>
            <button 
              className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              Danh sách nhân viên
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="staff-main-content">
        {activeTab === 'schedule' ? (
          <>
            {/* Weekly Planner */}
            <div className="staff-planner">
              <div className="planner-card">
                {/* Week Header */}
                <div className="week-header">
                  <div className="week-cell"></div>
                  {weekSchedule.map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`week-day-cell ${day.highlight ? 'today' : ''}`}
                    >
                      <p className="day-name">{day.day}</p>
                      <p className="day-date">{day.date}</p>
                    </div>
                  ))}
                </div>

                {/* Morning Shift */}
                <div className="shift-row">
                  <div className="shift-label">
                    <Sun className="shift-icon morning" size={24} />
                    <p className="shift-name">Sáng</p>
                    <p className="shift-time">06:00 - 12:00</p>
                  </div>
                  {scheduleData.morning.map((employees, dayIdx) => (
                    <div 
                      key={dayIdx} 
                      className={`shift-cell ${weekSchedule[dayIdx].highlight ? 'today' : ''}`}
                    >
                      {employees.map(empId => renderEmployeeAvatar(empId))}
                      <button 
                        className="add-employee-btn"
                        onClick={() => setShowAssignModal(true)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Afternoon Shift */}
                <div className="shift-row">
                  <div className="shift-label">
                    <Sunset className="shift-icon afternoon" size={24} />
                    <p className="shift-name">Chiều</p>
                    <p className="shift-time">12:00 - 18:00</p>
                  </div>
                  {scheduleData.afternoon.map((employees, dayIdx) => (
                    <div 
                      key={dayIdx} 
                      className={`shift-cell ${weekSchedule[dayIdx].highlight ? 'today' : ''}`}
                    >
                      {employees.map(empId => renderEmployeeAvatar(empId))}
                      <button 
                        className="add-employee-btn"
                        onClick={() => setShowAssignModal(true)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Evening Shift */}
                <div className="shift-row">
                  <div className="shift-label">
                    <Moon className="shift-icon evening" size={24} />
                    <p className="shift-name">Tối</p>
                    <p className="shift-time">18:00 - 23:00</p>
                  </div>
                  {scheduleData.evening.map((employees, dayIdx) => (
                    <div 
                      key={dayIdx} 
                      className={`shift-cell ${weekSchedule[dayIdx].highlight ? 'today' : ''}`}
                    >
                      {employees.map(empId => renderEmployeeAvatar(empId))}
                      <button 
                        className="add-employee-btn"
                        onClick={() => setShowAssignModal(true)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar Statistics */}
            <aside className="staff-sidebar">
              {/* Currently Working */}
              <div className="sidebar-card">
                <h3 className="sidebar-title">Nhân viên đang làm việc</h3>
                <div className="working-staff-list">
                  {currentlyWorking.map(staff => (
                    <div key={staff.id} className="working-staff-item">
                      <div className="staff-avatar-wrapper">
                        <img src={staff.avatar} alt={staff.name} className="staff-avatar-img" />
                        <div className="online-indicator"></div>
                      </div>
                      <div className="staff-info">
                        <p className="staff-name">{staff.name}</p>
                        <p className="staff-details">{staff.role} • {staff.location}</p>
                      </div>
                      <span className="staff-time">{staff.startTime}</span>
                    </div>
                  ))}
                </div>
                <button className="view-all-btn">
                  Xem tất cả 12 người
                </button>
              </div>

              {/* Average Rating */}
              <div className="sidebar-card rating-card">
                <h3 className="sidebar-title">Rating trung bình</h3>
                <div className="rating-display">
                  <span className="rating-number">4.8</span>
                  <div className="rating-stars">
                    <div className="stars">
                      <Star size={16} fill="#fbbf24" color="#fbbf24" />
                      <Star size={16} fill="#fbbf24" color="#fbbf24" />
                      <Star size={16} fill="#fbbf24" color="#fbbf24" />
                      <Star size={16} fill="#fbbf24" color="#fbbf24" />
                      <Star size={16} fill="#fbbf24" color="#fbbf24" />
                    </div>
                    <p className="reviews-count">Dựa trên 150 đánh giá</p>
                  </div>
                </div>
                
                <div className="rating-breakdown">
                  <div className="rating-item">
                    <div className="rating-label">
                      <span>Thái độ phục vụ</span>
                      <span className="rating-score">4.9</span>
                    </div>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: '95%'}}></div>
                    </div>
                  </div>
                  <div className="rating-item">
                    <div className="rating-label">
                      <span>Tốc độ ra món</span>
                      <span className="rating-score">4.6</span>
                    </div>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Status */}
              <div className="sidebar-card status-card">
                <div className="status-header">
                  <CheckCircle className="status-icon" size={24} />
                  <p className="status-label">TRẠNG THÁI TUẦN</p>
                </div>
                <p className="status-text">Đã phân 100% ca làm việc cho tuần này.</p>
                <p className="status-subtext">Không có yêu cầu nghỉ phép chờ duyệt.</p>
              </div>
            </aside>
          </>
        ) : (
          /* Employee List Table */
          <div className="employee-list-container">
            <div className="employee-table-card">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Ảnh đại diện & Họ tên</th>
                    <th>Vai trò</th>
                    <th>Số điện thoại</th>
                    <th>Ngày vào làm</th>
                    <th className="text-center">Rating</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-info">
                          <div className="employee-avatar-wrapper">
                            <img src={employee.avatar} alt={employee.name} />
                          </div>
                          <div className="employee-details">
                            <span className="employee-name">{employee.name}</span>
                            <span className="employee-email">{employee.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${getRoleColorClass(employee.roleColor)}`}>
                          {employee.role}
                        </span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-400 font-medium">{employee.phone}</td>
                      <td className="text-slate-600 dark:text-slate-400">{employee.joinDate}</td>
                      <td>
                        <div className="rating-cell">
                          <span className="rating-value">{employee.rating}</span>
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="detail-btn"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowDetailModal(true);
                            }}
                          >
                            Chi tiết
                          </button>
                          <button className="edit-btn">
                            <Edit2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="table-footer">
                <p className="pagination-info">
                  Hiển thị {filteredEmployees.length} trên tổng số {employeesData.length} nhân viên
                </p>
                <div className="pagination-buttons">
                  <button className="pagination-btn">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="pagination-btn active">1</button>
                  <button className="pagination-btn">2</button>
                  <button className="pagination-btn">3</button>
                  <button className="pagination-btn">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Shift Modal */}
      {showAssignModal && (
        <AssignShiftModal onClose={() => setShowAssignModal(false)} />
      )}

      {/* Shift Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <ShiftDetailModal 
          employee={selectedEmployee}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

// Assign Shift Modal Component
const AssignShiftModal = ({ onClose }) => {
  const [selectedShift, setSelectedShift] = useState('morning');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <Calendar className="text-primary" size={24} />
            <h2>Phân công ca làm việc</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {/* Employee Selection */}
          <div className="form-group">
            <label>Chọn nhân viên</label>
            <div className="select-wrapper">
              <Search className="select-icon" size={20} />
              <select className="form-select">
                <option value="">Tìm kiếm nhân viên theo tên...</option>
                {employeesData.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
              <ChevronRight className="select-arrow" size={20} />
            </div>
          </div>

          {/* Date Selection  */}
          <div className="form-group">
            <label>Chọn ngày làm việc</label>
            <div className="calendar-widget">
              <div className="calendar-header">
                <button className="calendar-nav-btn">
                  <ChevronLeft size={20} />
                </button>
                <p className="calendar-month">Tháng 10, 2023</p>
                <button className="calendar-nav-btn">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="calendar-grid">
                <div className="calendar-day-header">CN</div>
                <div className="calendar-day-header">T2</div>
                <div className="calendar-day-header">T3</div>
                <div className="calendar-day-header">T4</div>
                <div className="calendar-day-header">T5</div>
                <div className="calendar-day-header">T6</div>
                <div className="calendar-day-header">T7</div>
                
                {Array.from({length: 35}, (_, i) => {
                  const day = i - 2;
                  if (day < 1 || day > 31) {
                    return <div key={i} className="calendar-day disabled">{day < 1 ? 30 + day : day - 31}</div>;
                  }
                  return (
                    <button 
                      key={i} 
                      className={`calendar-day ${day === 5 ? 'active' : ''}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Shift Selection */}
          <div className="form-group">
            <label>Chọn ca làm việc</label>
            <div className="shift-selector">
              <label className="shift-option">
                <input 
                  type="radio" 
                  name="shift" 
                  value="morning"
                  checked={selectedShift === 'morning'}
                  onChange={(e) => setSelectedShift(e.target.value)}
                />
                <div className="shift-card">
                  <Sun size={24} />
                  <span>Ca Sáng</span>
                </div>
              </label>
              <label className="shift-option">
                <input 
                  type="radio" 
                  name="shift" 
                  value="afternoon"
                  checked={selectedShift === 'afternoon'}
                  onChange={(e) => setSelectedShift(e.target.value)}
                />
                <div className="shift-card">
                  <Sunset size={24} />
                  <span>Ca Chiều</span>
                </div>
              </label>
              <label className="shift-option">
                <input 
                  type="radio" 
                  name="shift" 
                  value="evening"
                  checked={selectedShift === 'evening'}
                  onChange={(e) => setSelectedShift(e.target.value)}
                />
                <div className="shift-card">
                  <Moon size={24} />
                  <span>Ca Tối</span>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Ghi chú</label>
            <textarea 
              className="form-textarea"
              placeholder="Nhập ghi chú thêm cho nhân viên (ví dụ: khu vực bàn 1-10, trực quầy bar...)"
              rows="4"
            ></textarea>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">
            Hủy bỏ
          </button>
          <button className="btn-confirm">
            <CheckCircle size={18} />
            Xác nhận phân ca
          </button>
        </div>
      </div>
    </div>
  );
};

// Shift Detail Modal Component
const ShiftDetailModal = ({ employee, onClose }) => {
  const [isWorking, setIsWorking] = useState(employee.isWorking);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chi tiết ca làm việc</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {/* Employee Profile */}
          <div className="employee-profile">
            <div className="employee-profile-avatar">
              <img src={employee.avatar} alt={employee.name} />
              {isWorking && <div className="online-badge"></div>}
            </div>
            <div className="employee-profile-info">
              <p className="employee-profile-name">{employee.name}</p>
              <div className="employee-profile-role">
                <MapPin size={16} />
                <p>{employee.role.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Replacement Selection */}
          <div className="form-group">
            <label>Thay thế nhân viên</label>
            <div className="select-wrapper">
              <Search className="select-icon" size={20} />
              <select className="form-select">
                <option value="">Chọn nhân viên thay thế...</option>
                {employeesData.filter(emp => emp.id !== employee.id).map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
              <ChevronRight className="select-arrow" size={20} />
            </div>
          </div>

          {/* Time Selection */}
          <div className="time-group">
            <div className="form-group">
              <label>Giờ bắt đầu</label>
              <input type="time" className="form-input" defaultValue="08:00" />
            </div>
            <div className="form-group">
              <label>Giờ kết thúc</label>
              <input type="time" className="form-input" defaultValue="17:00" />
            </div>
          </div>

          {/* Total Hours Display */}
          <div className="total-hours-card">
            <div className="total-hours-info">
              <Clock className="text-primary" size={24} />
              <p className="total-hours-label">Tổng thời gian làm việc</p>
            </div>
            <div className="total-hours-value">
              <p className="hours">9.0 giờ</p>
              <p className="hours-note">Đã bao gồm nghỉ trưa</p>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="status-toggle-card">
            <div className="status-toggle-info">
              <div className="status-toggle-header">
                <CheckCircle className="text-green-500" size={20} />
                <p className="status-toggle-title">Trạng thái hiện tại</p>
              </div>
              <p className="status-toggle-text">
                {isWorking ? 'Nhân viên đang làm việc' : 'Nhân viên không làm việc'}
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={isWorking}
                onChange={(e) => setIsWorking(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="detail-actions">
            <button className="btn-save">
              <Save size={20} />
              Cập nhật ca làm
            </button>
            <button className="btn-delete">
              <Trash2 size={20} />
              Xóa ca
            </button>
          </div>
        </div>

        <div className="modal-footer-brand">
          <p>QUẢN LÝ NHÂN SỰ • RESTAURANT PRO</p>
        </div>
      </div>
    </div>
  );
};

export default ManagerStaffPage;
