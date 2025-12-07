import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaFacebookF } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/RegisterPage.css';
import bgImage from '../assets/images/about/restaurant-interior.jpg';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    console.log('Registration data:', formData);
    // Add your registration logic here
  };

  return (
    <div className="register-page">
   <div 
        className="login-background" 
        style={{ 
          backgroundImage: `url(${bgImage})`
        }}
      ></div>
      
      <div className="register-container">
        <div className="register-content">
          <div className="welcome-message">
            <div className="logo">NHÀ HÀNG</div>
            <h2>Chào mừng đến với</h2>
            <h1>Nhà Hàng Chúng Tôi</h1>
            <p>Đăng ký ngay để trải nghiệm ẩm thực đẳng cấp và nhận nhiều ưu đãi hấp dẫn</p>
            <div className="features">
              <div className="feature">
                <div className="feature-icon">🎁</div>
                <span>Ưu đãi đặc biệt</span>
              </div>
              <div className="feature">
                <div className="feature-icon">🔔</div>
                <span>Thông báo ưu đãi</span>
              </div>
              <div className="feature">
                <div className="feature-icon">💳</div>
                <span>Tích điểm đổi quà</span>
              </div>
            </div>
          </div>
        </div>

        <div className="register-form-container">
          <div className="register-header">
            <h2>Đăng Ký Tài Khoản</h2>
            <p>Tạo tài khoản để bắt đầu trải nghiệm</p>
          </div>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="fullName"
                placeholder="Họ và tên"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="tel"
                name="phone"
                placeholder="Số điện thoại"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
                minLength="6"
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                required
                minLength="6"
              />
            </div>

            <div className="form-options">
              <label className="terms-checkbox">
                <input 
                  type="checkbox" 
                  className="custom-checkbox" 
                  required 
                />
                <span className="checkmark"></span>
                <span>Tôi đồng ý với <a href="/terms" className="terms-link">Điều khoản dịch vụ</a> và <a href="/privacy" className="terms-link">Chính sách bảo mật</a></span>
              </label>
            </div>

            <button type="submit" className="register-button">
              <span className="button-text">Đăng Ký</span>
              <span className="button-icon">→</span>
            </button>

            <div className="divider">
              <span>HOẶC</span>
            </div>

            <div className="social-login">
              <button type="button" className="social-button google">
                <FaGoogle className="social-icon" />
                <span>Google</span>
              </button>
              <button type="button" className="social-button facebook">
                <FaFacebookF className="social-icon" />
                <span>Facebook</span>
              </button>
            </div>

            <p className="login-link">
              Đã có tài khoản? <Link to="/login" className="login-cta">Đăng nhập ngay</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;