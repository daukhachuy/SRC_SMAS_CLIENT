import React, { useState } from 'react';
import '../styles/ForgotPasswordPage.css';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import RestaurantLogo from '../components/RestaurantLogo';
import { forgotPassword, verifyOtp, resetPassword } from '../api/authApi';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // Step 1-5
  const [formData, setFormData] = useState({
    emailPhone: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [accountFound, setAccountFound] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Step 1: Validate email/phone input
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.emailPhone.trim()) {
      newErrors.emailPhone = 'Vui lòng nhập email hoặc số điện thoại';
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailPhone);
      const isPhone = /^\d{10}$/.test(formData.emailPhone.replace(/\D/g, ''));
      
      if (!isEmail && !isPhone) {
        newErrors.emailPhone = 'Email hoặc số điện thoại không hợp lệ';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Call API to send password reset email
      await forgotPassword(formData.emailPhone);

      setAccountFound(true);
      setCurrentStep(2); // Move to OTP step
      setErrors({});
      setSuccessMessage('Mã OTP đã được gửi đến email của bạn');
    } catch (error) {
      console.error('Error:', error);
      setErrors({ emailPhone: error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP verification
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.otp.trim()) {
      newErrors.otp = 'Vui lòng nhập mã OTP';
    } else if (!/^\d{6}$/.test(formData.otp.trim())) {
      newErrors.otp = 'Mã OTP phải gồm 6 chữ số';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Call API to verify OTP
      await verifyOtp(formData.emailPhone, formData.otp);

      setCurrentStep(3); // Move to new password step
      setErrors({});
    } catch (error) {
      console.error('Error:', error);
      setErrors({ otp: error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được để trống';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Call API to reset password
      await resetPassword(formData.emailPhone, formData.otp, formData.newPassword);
      
      setSuccessMessage('Mật khẩu đã được cập nhật thành công!');
      setCurrentStep(4); // Success step
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: error?.message || 'Đã xảy ra lỗi khi cập nhật mật khẩu. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await forgotPassword(formData.emailPhone);
      setSuccessMessage('Mã OTP mới đã được gửi đến email của bạn');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: error?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.' });
      setTimeout(() => setErrors({}), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Go back to step 1
  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setFormData({ emailPhone: '', otp: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    setAccountFound(false);
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-left">
        <div className="forgot-password-card">
          <h2 className="form-title">Quên Mật Khẩu</h2>
          <p className="form-subtitle">Khôi phục tài khoản của bạn</p>

          {/* STEP 1: Email/Phone Input */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="forgot-password-form">
              <div className="step-indicator">
                <span className="step-number"></span>
              </div>

              <div className="form-group">
                <label htmlFor="emailPhone">Email hoặc Số Điện Thoại</label>
                <input
                  type="text"
                  id="emailPhone"
                  name="emailPhone"
                  placeholder="abc123@gmail.com hoặc 0123456789"
                  value={formData.emailPhone}
                  onChange={handleChange}
                  className={errors.emailPhone ? 'error' : ''}
                />
                {errors.emailPhone && <span className="error-text">{errors.emailPhone}</span>}
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Tiếp Tục'}
              </button>

              <div className="form-footer">
                <button
                  type="button"
                  className="back-link"
                  onClick={() => navigate('/auth')}
                >
                   Quay lại Đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {currentStep === 2 && (
            <form onSubmit={handleOTPSubmit} className="forgot-password-form">
              <div className="step-indicator">
                <span className="step-number">Bước 2 của 3</span>
              </div>

              <div className="step-info">
                <p>Mã OTP 6 số đã được gửi đến:</p>
                <p className="account-display">{formData.emailPhone}</p>
              </div>

              <div className="form-group">
                <label htmlFor="otp">Nhập Mã OTP</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength="6"
                  className={errors.otp ? 'error' : ''}
                />
                {errors.otp && <span className="error-text">{errors.otp}</span>}
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Đang xác minh...' : 'Xác Minh OTP'}
              </button>

              <div className="form-footer">
                <button
                  type="button"
                  className="resend-link"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  Gửi lại mã OTP
                </button>
                <span className="separator">•</span>
                <button
                  type="button"
                  className="back-link"
                  onClick={handleBackToStep1}
                >
                  ← Quay lại
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: New Password */}
          {currentStep === 3 && (
            <form onSubmit={handlePasswordReset} className="forgot-password-form">
              <div className="step-indicator">
                <span className="step-number">Bước 3 của 3</span>
              </div>

              <div className="step-info">
                <p>✓ OTP xác minh thành công</p>
                <p className="success-text">Vui lòng nhập mật khẩu mới</p>
              </div>

              <div className="form-group password-group">
                <label htmlFor="newPassword">Mật Khẩu Mới</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={errors.newPassword ? 'error' : ''}
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
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
              </div>

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

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
              </button>

              <div className="form-footer">
                <button
                  type="button"
                  className="back-link"
                  onClick={() => setCurrentStep(2)}
                >
                  ← Quay lại
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success */}
          {currentStep === 4 && (
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h3 className="success-title">Thành Công!</h3>
              <p className="success-message">{successMessage}</p>
              <p className="redirect-text">Quay trở lại trang đăng nhập trong 3 giây...</p>
              <button
                type="button"
                className="submit-btn"
                onClick={() => navigate('/')}
              >
                Đăng Nhập Ngay
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="forgot-password-right">
        <div className="forgot-password-info">
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
          <h3 className="info-title">Bảo Mật Tài Khoản</h3>
          <p className="info-desc">Quy trình khôi phục an toàn và đơn giản</p>
          
          <ul className="info-features">
            <li>Xác minh qua OTP SMS</li>
            <li>Bảo vệ thông tin cá nhân</li>
            <li>Cập nhật mật khẩu mạnh</li>
            <li>Quy trình nhanh chóng</li>
            <li>Hỗ trợ 24/7</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
