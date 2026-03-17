import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Shield, Edit3, X, Camera, Save } from 'lucide-react';
import { getProfile, updateProfile } from '../../api/userApi';
import '../../styles/ManagerPages.css';

const ManagerProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [profileData, setProfileData] = useState({
    fullname: '',
    email: '',
    phone: '',
    gender: 'Nam',
    dob: '',
    address: ''
  });

  const [editForm, setEditForm] = useState({ ...profileData });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      const fullname = (data.fullname && data.fullname !== 'string') ? data.fullname : '';
      const phone = (data.phone && data.phone !== 'string') ? (data.phone || '').replace('+84', '0') : '';
      const address = (data.address && data.address !== 'string') ? data.address : '';
      const dob = data.dob ? data.dob.split('T')[0] : '';
      const gender = (data.gender && data.gender !== 'string') ? data.gender : 'Nam';

      const userData = {
        fullname,
        email: data.email || '',
        phone,
        address,
        dob,
        gender: gender === 'Nữ' ? 'Nữ' : 'Nam'
      };

      setProfileData(userData);
      setEditForm(userData);
    } catch (error) {
      console.error('Error loading profile:', error);
      setErrorMessage('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'phone') {
      value = value.replace(/[^0-9]/g, '');
    }
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!editForm.fullname?.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên');
      return;
    }

    try {
      setSaving(true);
      const phone = editForm.phone?.startsWith('0') 
        ? '+84' + editForm.phone.slice(1) 
        : editForm.phone;

      await updateProfile({
        ...editForm,
        phone
      });

      setProfileData({ ...editForm });
      setSuccessMessage('Cập nhật hồ sơ thành công!');
      setShowEditModal(false);
      
      // Update localStorage user info
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          localStorage.setItem('user', JSON.stringify({
            ...user,
            fullname: editForm.fullname,
            email: editForm.email
          }));
        } catch {}
      }
    } catch (error) {
      setErrorMessage(error.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getInitials = (name) => {
    if (!name) return 'MG';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  if (loading) {
    return (
      <div className="manager-page-container">
        <div className="manager-loading-state">
          <div className="manager-spinner"></div>
          <p>Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-page-container">
      {/* Header */}
      <header className="manager-page-header">
        <div>
          <h2 className="manager-page-title">Hồ sơ quản lý</h2>
          <p className="manager-page-subtitle">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </div>
        <button 
          className="manager-btn primary"
          onClick={() => {
            setEditForm({ ...profileData });
            setShowEditModal(true);
          }}
        >
          <Edit3 size={16} />
          Chỉnh sửa hồ sơ
        </button>
      </header>

      {/* Messages */}
      {successMessage && (
        <div className="manager-alert success">{successMessage}</div>
      )}
      {errorMessage && (
        <div className="manager-alert error">{errorMessage}</div>
      )}

      {/* Profile Card */}
      <div className="manager-profile-card">
        <div className="manager-profile-header">
          <div className="manager-profile-avatar">
            <span className="avatar-initials">{getInitials(profileData.fullname)}</span>
          </div>
          <div className="manager-profile-title">
            <h3>{profileData.fullname || 'Quản lý'}</h3>
            <span className="manager-role-badge">
              <Shield size={14} />
              Quản lý nhà hàng
            </span>
          </div>
        </div>

        <div className="manager-profile-details">
          <div className="manager-detail-item">
            <div className="detail-icon">
              <Mail size={18} />
            </div>
            <div className="detail-content">
              <label>Email</label>
              <p>{profileData.email || 'Chưa cập nhật'}</p>
            </div>
          </div>

          <div className="manager-detail-item">
            <div className="detail-icon">
              <Phone size={18} />
            </div>
            <div className="detail-content">
              <label>Số điện thoại</label>
              <p>{profileData.phone || 'Chưa cập nhật'}</p>
            </div>
          </div>

          <div className="manager-detail-item">
            <div className="detail-icon">
              <User size={18} />
            </div>
            <div className="detail-content">
              <label>Giới tính</label>
              <p>{profileData.gender || 'Chưa cập nhật'}</p>
            </div>
          </div>

          <div className="manager-detail-item">
            <div className="detail-icon">
              <Calendar size={18} />
            </div>
            <div className="detail-content">
              <label>Ngày sinh</label>
              <p>{formatDate(profileData.dob)}</p>
            </div>
          </div>

          <div className="manager-detail-item full-width">
            <div className="detail-icon">
              <MapPin size={18} />
            </div>
            <div className="detail-content">
              <label>Địa chỉ</label>
              <p>{profileData.address || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="manager-info-card">
        <h3 className="manager-card-title">Thông tin tài khoản</h3>
        <div className="manager-account-info">
          <div className="account-info-item">
            <span className="account-label">Loại tài khoản</span>
            <span className="account-value">Quản lý (Manager)</span>
          </div>
          <div className="account-info-item">
            <span className="account-label">Trạng thái</span>
            <span className="account-value status-active">Hoạt động</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="manager-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="manager-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-header">
              <h3 className="manager-modal-title">Chỉnh sửa hồ sơ</h3>
              <button 
                className="manager-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="manager-modal-content">
                {/* Avatar Section */}
                <div className="manager-edit-avatar-section">
                  <div className="manager-edit-avatar">
                    <span className="avatar-initials large">{getInitials(editForm.fullname)}</span>
                  </div>
                  <button type="button" className="manager-change-avatar-btn">
                    <Camera size={16} />
                    Đổi ảnh
                  </button>
                </div>

                {/* Form Fields */}
                <div className="manager-form-grid">
                  <div className="manager-form-group">
                    <label className="manager-form-label">
                      <User size={14} />
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      className="manager-input"
                      value={editForm.fullname || ''}
                      onChange={(e) => handleInputChange('fullname', e.target.value)}
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div className="manager-form-group">
                    <label className="manager-form-label">
                      <Phone size={14} />
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      className="manager-input"
                      value={editForm.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="0901234567"
                      maxLength={11}
                    />
                  </div>

                  <div className="manager-form-group">
                    <label className="manager-form-label">
                      <Mail size={14} />
                      Email
                    </label>
                    <input
                      type="email"
                      className="manager-input"
                      value={editForm.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="manager-form-group">
                    <label className="manager-form-label">
                      <Calendar size={14} />
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      className="manager-input"
                      value={editForm.dob || ''}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                    />
                  </div>

                  <div className="manager-form-group">
                    <label className="manager-form-label">
                      <User size={14} />
                      Giới tính
                    </label>
                    <select
                      className="manager-select"
                      value={editForm.gender || 'Nam'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div className="manager-form-group full-width">
                    <label className="manager-form-label">
                      <MapPin size={14} />
                      Địa chỉ
                    </label>
                    <textarea
                      className="manager-textarea"
                      rows={2}
                      value={editForm.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>
              </div>

              <div className="manager-modal-footer">
                <button 
                  type="button"
                  className="manager-btn secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="manager-btn primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="manager-spinner-small"></span>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerProfilePage;
