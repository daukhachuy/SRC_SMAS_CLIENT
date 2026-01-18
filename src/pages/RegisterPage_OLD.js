import React, { useState } from 'react';
import '../styles/RegisterPage.css';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    gender: 'Nam',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Số điện thoại phải có 10 chữ số';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ không được để trống';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không trùng khớp';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      console.log('Register data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After successful registration, redirect to login
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // TODO: Implement Google OAuth
    console.log('Google register clicked');
  };

  return (
    <div className="register-page-container">
      <div className="register-page-left">
        <div className="register-form-card">
          <div className="register-form-header">
          <h2 className="auth-title">Đăng Kí</h2>
          <p className="auth-subtitle">
            Chào mừng bạn tới với nhà hàng hải sản !
          </p>

          {/* Google Register Button */}
          <button className="google-signup-btn" onClick={handleGoogleRegister}>
            <FaGoogle size={18} />
            <span>Đăng kí với google</span>
          </button>

          {/* Divider */}
          <div className="divider">
            <span>Hoặc</span>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Full Name Field */}
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            {/* Email and Phone Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="abc123@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="0123456789"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            {/* Address Field */}
            <div className="form-group">
              <label htmlFor="address">Địa chỉ nhà</label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Số 30/10 Đường ABC"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            {/* Gender Field */}
            <div className="form-row gender-row">
              <span className="gender-label">Giới tính :</span>
              <div className="gender-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="Nam"
                    checked={formData.gender === 'Nam'}
                    onChange={handleChange}
                  />
                  Nam
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="Nữ"
                    checked={formData.gender === 'Nữ'}
                    onChange={handleChange}
                  />
                  Nữ
                </label>
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Mật Khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật Khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            {/* Submit Error */}
            {errors.submit && <span className="error-message">{errors.submit}</span>}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng Kí'}
            </button>
          </form>

          {/* Toggle to Login */}
          <div className="auth-toggle">
            <span>
              Đã có tài khoản?{' '}
              <button
                type="button"
                className="toggle-btn"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
              >
                Đăng nhập ngay
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
