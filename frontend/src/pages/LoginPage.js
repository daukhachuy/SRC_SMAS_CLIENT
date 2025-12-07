import React, { useState } from 'react';
import { FaUser, FaLock, FaGoogle, FaFacebookF } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/LoginPage.css';
import bgImage from '../assets/images/about/restaurant-interior.jpg';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login with:', { email, password });
  };

  return (
    <div className="login-page">
      <div 
        className="login-background" 
        style={{ 
          backgroundImage: `url(${bgImage})`
        }}
      ></div>
      
      <div className="login-container">
        <div className="login-content">
          <div className="welcome-message">
            <div className="logo">NHÀ HÀNG</div>
            <h2>Chào mừng đến với</h2>
            <h1>Nhà Hàng Chúng Tôi</h1>
            <p>Khám phá hương vị ẩm thực đặc biệt và trải nghiệm dịch vụ đẳng cấp</p>
            <div className="features">
              <div className="feature">
                <div className="feature-icon">🍽️</div>
                <span>Ẩm thực đa dạng</span>
              </div>
              <div className="feature">
                <div className="feature-icon">🏆</div>
                <span>Chất lượng hàng đầu</span>
              </div>
              <div className="feature">
                <div className="feature-icon">🌟</div>
                <span>Phục vụ tận tâm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-container">
          <div className="login-header">
            <h2>Đăng Nhập</h2>
            <p>Vui lòng đăng nhập để tiếp tục</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" className="custom-checkbox" />
                <span className="checkmark"></span>
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" className="login-button">
              <span className="button-text">Đăng Nhập</span>
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

            <p className="register-link">
              Chưa có tài khoản? <Link to="/register" className="register-cta">Đăng ký ngay</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;