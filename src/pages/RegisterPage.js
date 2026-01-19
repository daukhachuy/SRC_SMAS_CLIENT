import React, { useState } from 'react';
import '../styles/RegisterPage.css';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import RestaurantLogo from '../components/RestaurantLogo';

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

    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Register data:', formData);
      await new Promise(resolve => setTimeout(resolve, 1500));
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
    console.log('Google register clicked');
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <div className="register-form-card">
          <h2 className="form-title">Đăng Ký</h2>
          <p className="form-subtitle">Chào mừng bạn tới với nhà hàng hải sản !</p>

          <button className="google-register-btn" onClick={handleGoogleRegister} type="button">
            <FaGoogle size={18} />
            <span>Đăng kí với google</span>
          </button>

          <div className="form-divider">
            <span>Hoặc</span>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Họ Và Tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            {/* Email & Phone */}
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
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
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
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address">Địa chỉ nhà</label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Số 30/10 Đường ABC"
                value={formData.address}
                onChange={handleChange}
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="error-text">{errors.address}</span>}
            </div>

            {/* Gender */}
            <div className="form-gender">
              <span className="gender-label">Giới tính :</span>
              <div className="gender-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="Nam"
                    checked={formData.gender === 'Nam'}
                    onChange={handleChange}
                  />
                  Nam
                </label>
                <label className="radio-option">
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

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Mật Khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="register-submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </form>

          {/* Toggle to Login */}
          <div className="form-footer">
            <span>Đã có tài khoản? </span>
            <button
              type="button"
              className="login-link"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>

      <div className="register-right">
        <div className="register-info">
          <button
            className="info-logo-btn"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            type="button"
          >
            <div className="info-logo">
              <RestaurantLogo size={64} color="white" />
            </div>
          </button>
          <h3 className="info-title">
            <button
              className="info-title-btn"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              type="button"
            >
              Nhà hàng Lẩu Nướng
            </button>
          </h3>
          <p className="info-desc">Nhà hàng chuyên về món nướng và lẩu</p>
          
          <ul className="info-features">
            <li>Đăng kí lần đầu nhận vouchers</li>
            <li>Đặt độ giao tận nơi</li>
            <li>Phản hồi nhanh chóng</li>
            <li>Đặt tiệc nhanh gọn</li>
            <li>Ưu đãi cư sốc</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
