import React, { useState } from 'react';
import { 
  User, Calendar, Phone, Mail, Download, Edit, 
  TrendingUp, Award, AlertCircle, Utensils, 
  XCircle, Info, Camera, X, Lock, CreditCard 
} from 'lucide-react';
import '../../styles/ManagerSalaryPage.css';

const ManagerSalaryPage = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'Nguyễn Văn A',
    gender: 'Nam',
    dob: '1995-05-15',
    address: '123 Đường ABC, Quận 1, TP. HCM',
    phone: '0901.234.567',
    email: 'vana.nguyen@nha-hang.vn',
    bankName: 'Techcombank',
    bankAccount: '19034567890123',
    // Read-only fields
    role: 'Đầu bếp chính',
    department: 'Bộ phận Bếp',
    joinDate: '01/01/2023',
    taxId: '8492019385'
  });

  // Sample salary data for 6 months
  const salaryChartData = [
    { month: 'T.3', amount: 14200000, height: 75, label: '14.2M' },
    { month: 'T.4', amount: 14800000, height: 82, label: '14.8M' },
    { month: 'T.5', amount: 15500000, height: 100, label: '15.5M', active: true },
    { month: 'T.6', amount: 15100000, height: 88, label: '15.1M' },
    { month: 'T.7', amount: 15400000, height: 92, label: '15.4M' },
    { month: 'T.8', amount: 15500000, height: 100, label: '15.5M', current: true }
  ];

  // Current month salary breakdown
  const salaryBreakdown = [
    {
      id: 1,
      icon: <CreditCard />,
      label: 'Lương cơ bản',
      description: 'Bậc 4 - Ngạch đầu bếp',
      amount: 12000000,
      type: 'base',
      color: 'slate'
    },
    {
      id: 2,
      icon: <Award />,
      label: 'Thưởng KPI & Chuyên cần',
      description: 'Hoàn thành 110% định mức',
      amount: 3500000,
      type: 'bonus',
      color: 'green'
    },
    {
      id: 3,
      icon: <XCircle />,
      label: 'Khấu trừ kỷ luật',
      description: 'Đi muộn 2 lần (thẻ đỏ)',
      amount: -200000,
      type: 'deduction',
      color: 'red'
    },
    {
      id: 4,
      icon: <Utensils />,
      label: 'Phụ cấp ăn ca',
      description: 'Hỗ trợ 1 bữa/ca trực',
      amount: 200000,
      type: 'allowance',
      color: 'slate'
    }
  ];

  const totalSalary = salaryBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const averageSalary = salaryChartData.reduce((sum, item) => sum + item.amount, 0) / salaryChartData.length;

  // Salary history
  const salaryHistory = [
    { month: 'Tháng 08/2023', amount: 15500000, date: '10/09/2023', status: 'Xong' },
    { month: 'Tháng 07/2023', amount: 15400000, date: '10/08/2023', status: 'Xong' },
    { month: 'Tháng 06/2023', amount: 15100000, date: '10/07/2023', status: 'Xong' },
    { month: 'Tháng 05/2023', amount: 15500000, date: '10/06/2023', status: 'Xong' }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    // TODO: API call to save profile data
    console.log('Saving profile:', profileData);
    setShowEditModal(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
  };

  return (
    <div className="salary-page">
      {/* Header Section */}
      <header className="salary-header">
        <div className="header-blur-effect"></div>
        <div className="header-content">
          <div className="employee-info-section">
            <div className="employee-avatar-wrapper">
              <div className="avatar-ring">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm1-h1ClUmJW3IrXjbqlO5r9PKQKeusSi6iu2Itu_X1VeX8xEpTNl1x8ljCCgTNd3Xiox9HikMTcqErOaV52oFeGzKKugPEDLYhMVZPk-6eSAFcnfiNlkNU8AE1ZxIEdozGIgwkBi508H8PnW3QdUWQlDyH9uvixC0mNeIxj5R8HN_MTKFHKuMMRQKp7ifVL-sAXxKyBgvPmooWr48mNCTopAlrRQneKQDnbvnO7ivHzx1QONVKhlm7ebnMhvJTqh4EVYMu_OQAmY"
                  alt={profileData.fullName}
                  className="avatar-img"
                />
              </div>
              <div className="status-indicator"></div>
            </div>
            <div className="employee-details">
              <h2 className="employee-name">{profileData.fullName}</h2>
              <div className="employee-role">
                <Utensils size={18} className="role-icon" />
                <span>{profileData.role} - {profileData.department}</span>
              </div>
              <div className="employee-meta">
                <span className="meta-item">
                  <Phone size={14} />
                  {profileData.phone}
                </span>
                <span className="meta-item">
                  <Calendar size={14} />
                  Vào làm: {profileData.joinDate}
                </span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-secondary"
              onClick={() => setShowEditModal(true)}
            >
              Sửa hồ sơ
            </button>
            <button className="btn-primary">
              <Download size={20} />
              Xuất PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="salary-content-grid">
        {/* Left Column - Charts and Details */}
        <div className="salary-main-column">
          {/* Salary Chart Section */}
          <section className="salary-chart-section">
            <div className="chart-header">
              <div>
                <h3 className="section-title">
                  <TrendingUp className="title-icon" />
                  Thu nhập 6 tháng gần nhất
                </h3>
                <p className="section-subtitle">Biểu đồ tổng hợp lương thực nhận</p>
              </div>
              <div className="average-display">
                <p className="average-label">Trung bình</p>
                <p className="average-amount">
                  {formatCurrency(averageSalary)} <span className="currency">VNĐ</span>
                </p>
              </div>
            </div>
            <div className="salary-chart">
              {salaryChartData.map((data, index) => (
                <div key={index} className="chart-bar-wrapper">
                  <div 
                    className={`chart-bar ${data.active ? 'bar-active' : ''} ${data.current ? 'bar-current' : ''}`}
                    style={{ height: `${data.height}%` }}
                  >
                    <div className="bar-tooltip">{data.label}</div>
                  </div>
                  <span className={`chart-label ${data.active ? 'label-active' : ''}`}>
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Salary Breakdown Section */}
          <section className="salary-breakdown-section">
            <div className="breakdown-header">
              <div>
                <h3 className="section-title">Chi tiết lương tháng 08/2023</h3>
                <p className="section-subtitle">Kỳ thanh toán: 01/08 - 31/08</p>
              </div>
              <span className="status-badge status-completed">Đã quyết toán</span>
            </div>
            <div className="breakdown-list">
              {salaryBreakdown.map((item) => (
                <div key={item.id} className={`breakdown-item item-${item.color}`}>
                  <div className="item-left">
                    <div className={`item-icon icon-${item.color}`}>
                      {item.icon}
                    </div>
                    <div className="item-info">
                      <p className={`item-label label-${item.color}`}>{item.label}</p>
                      <p className="item-description">{item.description}</p>
                    </div>
                  </div>
                  <span className={`item-amount amount-${item.color}`}>
                    {item.amount > 0 ? '+' : ''} {formatCurrency(item.amount)} VNĐ
                  </span>
                </div>
              ))}
            </div>
            <div className="breakdown-total">
              <span className="total-label">Tổng thực lĩnh</span>
              <span className="total-amount">
                {formatCurrency(totalSalary)} <span className="currency-sm">VNĐ</span>
              </span>
            </div>
          </section>
        </div>

        {/* Right Column - History Sidebar */}
        <aside className="salary-sidebar">
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Lịch sử nhận lương</h3>
              <button className="view-all-btn">Tất cả</button>
            </div>
            <div className="history-list">
              {salaryHistory.map((record, index) => (
                <div 
                  key={index} 
                  className={`history-card ${index === 0 ? 'card-highlight' : ''}`}
                >
                  <div className="history-card-header">
                    <span className="history-month">{record.month}</span>
                    <span className="history-status">{record.status}</span>
                  </div>
                  <div className="history-card-body">
                    <p className="history-amount">{formatCurrency(record.amount)}</p>
                    <span className="history-date">{record.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="payment-note">
              <Info className="note-icon" />
              <div className="note-content">
                <p className="note-title">Ghi chú thanh toán</p>
                <p className="note-text">
                  Lương được chuyển khoản vào ngày 10 hàng tháng qua ngân hàng Techcombank. 
                  Vui lòng phản hồi trước ngày 05 nếu phát hiện sai lệch.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <div className="modal-icon">
                  <User />
                </div>
                <div>
                  <h2 className="modal-title">Chỉnh sửa thông tin cá nhân</h2>
                  <p className="modal-subtitle">Cập nhật thông tin định danh và liên hệ của bạn</p>
                </div>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <X />
              </button>
            </div>

            <div className="modal-body">
              {/* Avatar Section */}
              <div className="avatar-section">
                <div className="avatar-preview-wrapper">
                  <div className="avatar-preview">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm1-h1ClUmJW3IrXjbqlO5r9PKQKeusSi6iu2Itu_X1VeX8xEpTNl1x8ljCCgTNd3Xiox9HikMTcqErOaV52oFeGzKKugPEDLYhMVZPk-6eSAFcnfiNlkNU8AE1ZxIEdozGIgwkBi508H8PnW3QdUWQlDyH9uvixC0mNeIxj5R8HN_MTKFHKuMMRQKp7ifVL-sAXxKyBgvPmooWr48mNCTopAlrRQneKQDnbvnO7ivHzx1QONVKhlm7ebnMhvJTqh4EVYMu_OQAmY"
                      alt="Avatar"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="avatar-title">Ảnh đại diện</h4>
                  <div className="avatar-actions">
                    <button className="btn-upload">
                      <Camera size={16} />
                      Thay đổi ảnh
                    </button>
                    <button className="btn-remove">Gỡ bỏ</button>
                  </div>
                  <p className="avatar-note">
                    Định dạng hỗ trợ: JPG, PNG. Dung lượng tối đa 2MB.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="form-grid">
                {/* Basic Information */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <span className="title-line"></span>
                    Thông tin cơ bản
                  </h3>
                  <div className="form-field">
                    <label className="field-label">Họ và tên</label>
                    <input 
                      type="text" 
                      className="field-input"
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="field-label">Giới tính</label>
                      <select 
                        className="field-input"
                        value={profileData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                      >
                        <option>Nam</option>
                        <option>Nữ</option>
                        <option>Khác</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Ngày sinh</label>
                      <input 
                        type="date" 
                        className="field-input"
                        value={profileData.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="field-label">Địa chỉ</label>
                    <input 
                      type="text" 
                      className="field-input"
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                </div>

                {/* Contact & Payment Information */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <span className="title-line"></span>
                    Liên hệ & Thanh toán
                  </h3>
                  <div className="form-field">
                    <label className="field-label">Số điện thoại</label>
                    <input 
                      type="tel" 
                      className="field-input"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Email</label>
                    <input 
                      type="email" 
                      className="field-input"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="field-label">Tên ngân hàng</label>
                      <input 
                        type="text" 
                        className="field-input"
                        value={profileData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-label">Số tài khoản</label>
                      <input 
                        type="text" 
                        className="field-input"
                        value={profileData.bankAccount}
                        onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Read-Only Admin Section */}
              <div className="admin-section">
                <div className="admin-header">
                  <Lock size={18} className="admin-icon" />
                  <h3 className="admin-title">Thông tin do quản trị viên quản lý</h3>
                </div>
                <div className="admin-fields">
                  <div className="admin-field">
                    <label className="admin-label">Vai trò</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      value={profileData.role}
                      readOnly
                    />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">Ngày vào làm</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      value={profileData.joinDate}
                      readOnly
                    />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">Mã số thuế</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      value={profileData.taxId}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-save"
                onClick={handleSaveProfile}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerSalaryPage;
