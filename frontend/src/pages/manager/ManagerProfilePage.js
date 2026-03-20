import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Building2, X, Calendar } from 'lucide-react';
import axios from 'axios';
import { staffApi } from '../../api/staffApi';
import '../../styles/ManagerProfilePage.css';

const ManagerProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    address: '',
    avatarUrl: '',
    bankAccountNumber: '',
    bankName: ''
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await staffApi.getProfile();
      const data = res.data ?? res;
      setProfile(data);
      const rawDob = data.dob || '';
      const dobStr = rawDob ? (rawDob.includes('T') ? rawDob.split('T')[0] : rawDob) : '';
      const gender = data.gender === 'Female' ? 'Nữ' : (data.gender === 'Male' ? 'Nam' : data.gender || 'Male');
      setFormData({
        fullname: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        gender,
        dob: dobStr,
        address: data.address || '',
        avatarUrl: data.avatarUrl || '',
        bankAccountNumber: data.bankAccountNumber || '',
        bankName: data.bankName || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Không thể tải thông tin profile'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cloudinary config (cùng ManagerLayout)
  const cloudName = 'dmzuier4p';
  const uploadPreset = 'Image_profile';
  const folderName = 'image_SEP490';

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage({ type: '', text: '' });

    // Hiển thị ảnh tạm thời
    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatarUrl: localUrl }));

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', uploadPreset);
    uploadFormData.append('folder', folderName);

    try {
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        uploadFormData
      );
      const imageUrl = cloudinaryRes.data.secure_url;
      setFormData((prev) => ({ ...prev, avatarUrl: imageUrl }));
    } catch (error) {
      console.error('Lỗi upload avatar:', error);
      setMessage({ type: 'error', text: 'Không thể tải ảnh lên Cloudinary.' });
      // Giữ ảnh cũ nếu upload lỗi
      setFormData((prev) => ({ ...prev, avatarUrl: profile?.avatarUrl || '' }));
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      await staffApi.updateProfile({
        fullname: formData.fullname,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender === 'Nam' ? 'Male' : (formData.gender === 'Nữ' ? 'Female' : formData.gender),
        dob: formData.dob || null,
        address: formData.address,
        avatarUrl: formData.avatarUrl,
        bankAccountNumber: formData.bankAccountNumber,
        bankName: formData.bankName
      });
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      fetchProfile();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Cập nhật thất bại. Vui lòng thử lại.'
      });
    }
  };

  const handleClose = () => {
    navigate('/manager/dashboard');
  };

  if (loading) {
    return (
      <div className="manager-profile-page manager-profile-modal-wrap">
        <div className="manager-profile-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-profile-page manager-profile-modal-wrap">
      <div className="manager-profile-modal-backdrop" onClick={handleClose} aria-hidden="true" />
      <div className="manager-profile-modal" role="dialog" aria-labelledby="profile-modal-title">
        <header className="manager-profile-modal-header">
          <h2 id="profile-modal-title">Cập nhật thông tin cá nhân</h2>
          <button type="button" className="manager-profile-modal-close" onClick={handleClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>

        {message.text && (
          <div className={`manager-profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="manager-profile-modal-body" onSubmit={handleSubmit}>
          <div className="manager-profile-modal-content">
            <aside className="manager-profile-avatar-block">
              <div className="manager-profile-avatar-wrap">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="manager-profile-avatar-img" />
                ) : (
                  <div className="manager-profile-avatar-placeholder">
                    <User size={48} />
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className={`manager-profile-avatar-edit ${uploading ? 'uploading' : ''}`}
                  title={uploading ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
                  style={{ cursor: uploading ? 'wait' : 'pointer' }}
                >
                  {uploading ? (
                    <div className="avatar-upload-spinner" />
                  ) : (
                    <Camera size={16} />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>
              <span className="manager-profile-avatar-label">ẢNH ĐẠI DIỆN</span>
              {profile?.position && (
                <span className="manager-profile-position-badge">{profile.position}</span>
              )}
            </aside>

            <div className="manager-profile-form-block">
              <section className="manager-profile-section">
                <h3 className="manager-profile-section-title">
                  <User size={18} className="manager-profile-section-icon" />
                  Thông tin cơ bản
                </h3>
                <div className="manager-profile-form-row manager-profile-form-row--2">
                  <div className="manager-profile-field">
                    <label>Họ và tên</label>
                    <input
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div className="manager-profile-field">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>
                <div className="manager-profile-form-row manager-profile-form-row--1">
                  <div className="manager-profile-field">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
                <div className="manager-profile-form-row manager-profile-form-row--2">
                  <div className="manager-profile-field">
                    <label>Giới tính</label>
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                  <div className="manager-profile-field">
                    <label>Ngày sinh</label>
                    <div className="manager-profile-date-wrap">
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                      />
                      <Calendar size={18} className="manager-profile-date-icon" />
                    </div>
                  </div>
                </div>
                <div className="manager-profile-form-row manager-profile-form-row--1">
                  <div className="manager-profile-field">
                    <label>Địa chỉ thường trú</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Nhập địa chỉ"
                      rows={3}
                    />
                  </div>
                </div>
              </section>

              <section className="manager-profile-section manager-profile-section--salary">
                <h3 className="manager-profile-section-title">
                  <Building2 size={18} className="manager-profile-section-icon" />
                  Thông tin nhận lương
                </h3>
                <div className="manager-profile-form-row manager-profile-form-row--2">
                  <div className="manager-profile-field">
                    <label>Số tài khoản</label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      placeholder="Nhập số tài khoản"
                    />
                  </div>
                  <div className="manager-profile-field">
                    <label>Tên ngân hàng</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="Ví dụ: Vietcombank"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <footer className="manager-profile-modal-footer">
            <button type="button" className="manager-profile-btn manager-profile-btn-cancel" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="manager-profile-btn manager-profile-btn-save">
              Lưu thay đổi
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ManagerProfilePage;
