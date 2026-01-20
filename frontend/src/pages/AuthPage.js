import React, { useState } from 'react';
import '../styles/AuthPage.css';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import RestaurantLogo from '../components/RestaurantLogo';

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // TODO: Thêm logic xác thực thực tế ở đây
    console.log('Form submitted:', { email, password, rememberMe });
    
    setTimeout(() => {
      setLoading(false);
      // Chuyển hướng sau khi đăng nhập thành công
    }, 1000);
  };

  const handleGoogleLogin = () => {
    // TODO: Thêm logic Google OAuth ở đây
    console.log('Google login clicked');
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-content">
          <button 
            className="restaurant-logo-btn"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            type="button"
          >
            <RestaurantLogo size={56} color="white" />
          </button>
          <h1 className="restaurant-name">
            <button
              className="restaurant-name-btn"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              type="button"
            >
              Nhà hàng Lẩu Nướng
            </button>
          </h1>
          <p className="restaurant-subtitle">Nhà hàng chuyên về các món nướng và lẩu</p>
          
          <ul className="restaurant-features">
            <li>Nguyên liệu tươi sông bảo quản kỹ kàng</li>
            <li>Bếp trưởng chuyên nghiệp , tận tâm</li>
            <li>Gọi món nhanh chóng</li>
            <li>Phục vụ tận tâm với nhiều loại dịch vụ</li>
            <li>Nhiều combo ưu đãi đặc biệt</li>
          </ul>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h2 className="auth-title">Đăng Nhập</h2>
          <p className="auth-subtitle">Chào mừng bạn quay trở lại !</p>

          {/* Google Login Button */}
          <button className="google-login-btn" onClick={handleGoogleLogin}>
            <FaGoogle size={18} />
            <span>Đăng nhập với google</span>
          </button>

          {/* Divider */}
          <div className="divider">
            <span>Hoặc</span>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="abc123@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-group password-group">
              <label htmlFor="password">Mật Khẩu</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-footer">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#!" className="forgot-password" onClick={(e) => {
                e.preventDefault();
                navigate('/forgot-password');
              }}>
                Quên mật khẩu ?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>

          {/* Toggle to Register */}
          <div className="auth-toggle">
            <span>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                className="toggle-btn"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
              >
                Đăng kí ngay
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
