import React, { useEffect, useState } from 'react';
import '../styles/RegisterPage.css';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import RestaurantLogo from '../components/RestaurantLogo';
import { register, googleRegister } from '../api/authApi';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Ensure Google shows account chooser instead of silently reusing last account
    if (window.google?.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Clear GIS state cookie created for auto-select heuristics
    document.cookie = 'g_state=; Max-Age=0; path=/';
  }, []);

  const parseRegisterMessage = (msgCode, fallbackMessage = '') => {
    if (msgCode === 'MSG_003') return 'Đăng ký thành công!';
    if (msgCode === 'MSG_005') return 'Email đã tồn tại. Vui lòng dùng email khác hoặc đăng nhập.';

    if (fallbackMessage?.trim()) {
      return fallbackMessage;
    }

    return 'Đăng ký thất bại. Vui lòng thử lại.';
  };

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
    setSuccessMessage('');
    setErrors({});

    try {
      // Backend chỉ yêu cầu: email, password, fullname
      const userData = {
        email: formData.email,
        password: formData.password,
        fullname: formData.fullName
      };

      const response = await register(userData);
      console.log('Register response:', response);

      const hasToken = Boolean(response?.token);
      const msgCode = response?.msgCode;

      if (hasToken || msgCode === 'MSG_003') {
        setSuccessMessage('Đăng ký thành công! Chuyển hướng đến đăng nhập...');
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
      } else {
        setErrors({ submit: parseRegisterMessage(msgCode, response?.message) });
      }
    } catch (error) {
      console.error('Registration error:', error);
      const msgCode = error?.code || error?.response?.data?.msgCode;
      const fallbackMessage = error?.response?.data?.message || error?.message || 'Lỗi kết nối. Kiểm tra API backend.';

      setErrors({ submit: parseRegisterMessage(msgCode, fallbackMessage) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      if (!credentialResponse?.credential) {
        throw new Error('Không nhận được token từ Google');
      }

      const googleToken = credentialResponse.credential;
      console.log('🔐 Google token received for registration:', googleToken.substring(0, 20) + '...');

      // Send token to backend for Google registration
      const response = await googleRegister(googleToken);
      const hasToken = Boolean(response?.token);
      const msgCode = response?.msgCode;

      // Google sign-up: only create account, then direct user to sign in page
      if (hasToken || msgCode === 'MSG_003') {
        setSuccessMessage('✅ Đăng ký Google thành công! Vui lòng đăng nhập bằng Google.');
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
        return;
      }

      if (msgCode === 'MSG_005') {
        setErrors({ submit: 'Email Google đã tồn tại. Vui lòng chuyển sang Đăng nhập bằng Google.' });
        return;
      }

      setErrors({ submit: response.message || 'Đăng ký Google thất bại' });
    } catch (error) {
      console.error('Google registration error:', error);
      const msgCode = error?.code || error?.response?.data?.msgCode;
      const message = error?.message?.toLowerCase() || '';

      if (msgCode === 'MSG_005' || message.includes('exist') || message.includes('đã tồn tại')) {
        setErrors({ submit: 'Email Google đã tồn tại. Vui lòng chuyển sang Đăng nhập bằng Google.' });
      } else {
        setErrors({ submit: error?.message || 'Lỗi đăng ký Google. Vui lòng thử lại hoặc đăng ký với email.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterError = () => {
    setErrors({ submit: '❌ Lỗi đăng ký Google. Vui lòng thử lại.' });
    console.error('Google registration failed');
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <div className="register-form-card">
          <h2 className="form-title">Đăng Ký</h2>
          <p className="form-subtitle">Chào mừng bạn tới với nhà hàng hải sản !</p>

          <div className="google-register-wrap">
            <GoogleLogin
              onSuccess={handleGoogleRegisterSuccess}
              onError={handleGoogleRegisterError}
              auto_select={false}
              useOneTap={false}
              text="signup_with"
              type="standard"
              shape="pill"
              size="large"
              logo_alignment="left"
              width="320"
              theme="outline"
              locale="vi"
            />
          </div>

          <div className="form-divider">
            <span>Hoặc</span>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="message-alert message-error">
              <span className="message-icon">❌</span>
              <span className="message-text">{errors.submit}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="message-alert message-success">
              <span className="message-icon">✅</span>
              <span className="message-text">{successMessage}</span>
            </div>
          )}

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
            <div className="form-group password-group">
              <label htmlFor="password">Mật Khẩu</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
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
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group password-group">
              <label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
                navigate('/auth');
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
