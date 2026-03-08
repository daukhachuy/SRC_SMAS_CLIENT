import React, { useState } from 'react';
import {
  Activity,
  Award,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  Edit3,
  TrendingUp,
  User,
  X
} from 'lucide-react';

const KitchenProfilePage = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'Trần Văn Bếp',
    phone: '0901 234 567',
    email: 'tranvanbep@gmail.com',
    gender: 'male',
    birthDate: '1990-05-15',
    address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    bankAccount: '190345678910',
    bankName: 'Techcombank'
  });

  // Stats data
  const stats = [
    {
      icon: CreditCard,
      label: 'Lương dự tính (Tháng này)',
      value: '16.200.000đ',
      change: '+8%',
      changeType: 'positive',
      color: 'primary'
    },
    {
      icon: Clock,
      label: 'Tổng giờ làm',
      value: '176 giờ',
      change: '+3%',
      changeType: 'positive',
      color: 'blue'
    },
    {
      icon: CheckCircle,
      label: 'Số ca hoàn thành',
      value: '44 ca',
      change: '+12%',
      changeType: 'positive',
      color: 'green'
    }
  ];

  // Salary trend data (last 6 months)
  const salaryTrend = [
    { month: 'Tháng 5', value: 13.5, percentage: 70 },
    { month: 'Tháng 6', value: 14.2, percentage: 75 },
    { month: 'Tháng 7', value: 15.8, percentage: 85 },
    { month: 'Tháng 8', value: 15.1, percentage: 82 },
    { month: 'Tháng 9', value: 15.9, percentage: 87 },
    { month: 'T10 (Nay)', value: 16.2, percentage: 90 }
  ];

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    console.log('Update profile:', profileData);
    setShowEditModal(false);
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="kitchen-profile-container">
      <header className="profile-header">
        <h2 className="profile-title">Hồ sơ & Lương</h2>
        <p className="profile-subtitle">Quản lý thông tin cá nhân và theo dõi thu nhập hàng tháng của bạn</p>
      </header>

      {/* Profile Card */}
      <div className="profile-card-main">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAFhiJCMPN_TMVoREnRtwAeFQgzytu9EkrxfepCWj4lNTu8RIgDtcLOxdXDC_CQ55Yt-qqVZtsvmsOrSNJZPp-8FhbH7_tXYlli3VtXuAoQjaFLu9hTmTDaDYZRwczz9H7L5Sc0oVDYSc026xrj70NK10D64OAAOIWyEYcrfCwbBAs7AGxsPOiUdKxC2yYRXfFj8wcE4HYFVhIdI8sZykDj6rtJwSSoaSRBryiv-6hnTN-ea_0zzL8JFcGiLWRaYGN84UUG0zcfA4" 
              alt="Avatar nhân viên bếp"
              className="profile-avatar-img"
            />
            <div className="profile-verified-badge">
              <CheckCircle size={16} />
            </div>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <p className="info-label">Họ và tên</p>
            <p className="info-value">{profileData.fullName}</p>
          </div>
          <div className="profile-info-item">
            <p className="info-label">Số điện thoại</p>
            <p className="info-value">{profileData.phone}</p>
          </div>
          <div className="profile-info-item full-width">
            <p className="info-label">Địa chỉ thường trú</p>
            <p className="info-value">{profileData.address}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            className="profile-edit-btn"
            onClick={() => setShowEditModal(true)}
          >
            <Edit3 size={18} />
            Cập nhật hồ sơ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="profile-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="profile-stat-card">
              <div className="stat-card-header">
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={22} />
                </div>
                <span className={`stat-change ${stat.changeType}`}>
                  {stat.change}
                </span>
              </div>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Salary Trend Chart */}
      <div className="salary-trend-card">
        <div className="salary-trend-header">
          <h3 className="salary-trend-title">
            <Activity size={22} />
            Xu hướng lương 6 tháng gần nhất
          </h3>
          <div className="salary-trend-legend">
            <span className="legend-dot"></span>
            <span className="legend-label">Lương thực nhận</span>
          </div>
        </div>

        <div className="salary-chart">
          {salaryTrend.map((item, index) => (
            <div key={index} className="chart-bar-wrapper">
              <div 
                className="chart-bar"
                style={{ height: `${item.percentage}%` }}
              >
                <span className="chart-tooltip">{item.value}M</span>
              </div>
              <span className={`chart-label ${index === salaryTrend.length - 1 ? 'current' : ''}`}>
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="kitchen-modal-overlay active" onClick={() => setShowEditModal(false)}>
          <div className="kitchen-modal profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kitchen-modal-header">
              <h3 className="kitchen-modal-title">Cập nhật thông tin cá nhân</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="kitchen-modal-content">
                <div className="profile-edit-layout">
                  <div className="profile-avatar-edit">
                    <div className="avatar-edit-wrapper">
                      <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAFhiJCMPN_TMVoREnRtwAeFQgzytu9EkrxfepCWj4lNTu8RIgDtcLOxdXDC_CQ55Yt-qqVZtsvmsOrSNJZPp-8FhbH7_tXYlli3VtXuAoQjaFLu9hTmTDaDYZRwczz9H7L5Sc0oVDYSc026xrj70NK10D64OAAOIWyEYcrfCwbBAs7AGxsPOiUdKxC2yYRXfFj8wcE4HYFVhIdI8sZykDj6rtJwSSoaSRBryiv-6hnTN-ea_0zzL8JFcGiLWRaYGN84UUG0zcfA4" 
                        alt="Avatar"
                        className="avatar-preview"
                      />
                      <button type="button" className="avatar-change-btn">
                        <Camera size={20} />
                      </button>
                    </div>
                    <p className="avatar-label">Ảnh đại diện</p>
                  </div>

                  <div className="profile-form-fields">
                    <section className="form-section">
                      <div className="form-section-header">
                        <User size={18} />
                        <h4>Thông tin cơ bản</h4>
                      </div>
                      
                      <div className="form-grid">
                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Họ và tên</label>
                          <input
                            type="text"
                            className="kitchen-input"
                            value={profileData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Số điện thoại</label>
                          <input
                            type="tel"
                            className="kitchen-input"
                            value={profileData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group full-width">
                          <label className="kitchen-form-label">Email</label>
                          <input
                            type="email"
                            className="kitchen-input"
                            value={profileData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Giới tính</label>
                          <select
                            className="kitchen-select"
                            value={profileData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                          >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>

                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Ngày sinh</label>
                          <input
                            type="date"
                            className="kitchen-input"
                            value={profileData.birthDate}
                            onChange={(e) => handleInputChange('birthDate', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group full-width">
                          <label className="kitchen-form-label">Địa chỉ thường trú</label>
                          <textarea
                            className="kitchen-textarea"
                            rows={2}
                            value={profileData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="form-section">
                      <div className="form-section-header">
                        <CreditCard size={18} />
                        <h4>Thông tin nhận lương</h4>
                      </div>
                      
                      <div className="form-grid bank-info">
                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Số tài khoản</label>
                          <input
                            type="text"
                            className="kitchen-input"
                            value={profileData.bankAccount}
                            onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Tên ngân hàng</label>
                          <input
                            type="text"
                            className="kitchen-input"
                            value={profileData.bankName}
                            onChange={(e) => handleInputChange('bankName', e.target.value)}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="kitchen-modal-footer">
                <button 
                  type="button"
                  className="kitchen-btn secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="kitchen-btn primary"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenProfilePage;
