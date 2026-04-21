import React, { useState, useRef, useEffect } from 'react';
import '../styles/AuthPage.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import RestaurantLogo from '../components/RestaurantLogo';
import { login, googleLogin } from '../api/authApi';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const pendingRedirect =
    typeof location.state?.redirectTo === 'string' && location.state.redirectTo.startsWith('/')
      ? location.state.redirectTo
      : '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const translateAuthMessage = (rawMessage) => {
    const text = String(rawMessage || '').trim();
    if (!text) return '';
    const normalized = text.toLowerCase();

    if (normalized.includes('network') || normalized.includes('failed to fetch')) {
      return 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.';
    }
    if (normalized.includes('unauthorized') || normalized.includes('forbidden')) {
      return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.';
    }
    if (normalized.includes('invalid credentials') || normalized.includes('wrong password')) {
      return 'Email hoặc mật khẩu không chính xác.';
    }
    if (normalized.includes('user not found') || normalized.includes('email not found')) {
      return 'Email không tồn tại trong hệ thống.';
    }
    if (normalized.includes('google login failed')) {
      return 'Đăng nhập Google thất bại. Vui lòng thử lại.';
    }
    if (normalized.includes('token') && normalized.includes('google')) {
      return 'Không nhận được dữ liệu đăng nhập từ Google. Vui lòng thử lại.';
    }
    if (normalized.includes('server error') || normalized.includes('internal server error')) {
      return 'Máy chủ đang bận. Vui lòng thử lại sau ít phút.';
    }
    return text;
  };

  useEffect(() => {
    // Ensure Google shows account chooser instead of silently reusing last account
    if (window.google?.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Clear GIS state cookie created for auto-select heuristics
    document.cookie = 'g_state=; Max-Age=0; path=/';

    // Restore remember-me state
    const remembered = localStorage.getItem('rememberMe') === 'true';
    const savedEmail = localStorage.getItem('savedEmail') || '';
    if (remembered && savedEmail) {
      setRememberMe(true);
      setEmail(savedEmail);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const stateMessage = location.state?.authMessage;
    const queryMessage = new URLSearchParams(location.search).get('message');
    const authMessage = stateMessage || queryMessage;

    if (authMessage) {
      setError(translateAuthMessage(authMessage));
    }
  }, [location.pathname, location.search, location.state]);

  // ==========================
  // ERROR PARSER
  // ==========================
  const parseError = (err) => {
    const status = err?.status;
    const msgCode = err?.code || err?.error;
    const backendMessageRaw = String(err?.message || '').trim();
    const backendMessage = backendMessageRaw.toLowerCase();

    if (msgCode === 'MSG_001') return 'Email không tồn tại.';
    if (msgCode === 'MSG_002') return 'Mật khẩu không chính xác.';
    if (msgCode === 'MSG_003') return 'Đăng nhập thành công nhưng xảy ra lỗi.';

    if (backendMessage?.includes('not found') || backendMessage?.includes('không tồn tại')) {
      return 'Tài khoản Google chưa đăng ký. Vui lòng chọn Đăng ký bằng Google trước.';
    }

    if (status === 400) return translateAuthMessage(backendMessageRaw) || 'Thông tin đăng nhập không hợp lệ.';
    if (status === 401) return 'Email hoặc mật khẩu không chính xác.';
    if (status === 500) return 'Lỗi máy chủ. Vui lòng thử lại sau.';

    if (err?.message?.includes('Network'))
      return 'Lỗi kết nối. Vui lòng kiểm tra internet.';

    return translateAuthMessage(backendMessageRaw) || 'Đăng nhập thất bại. Vui lòng thử lại.';
  };

  const getPostLoginPath = (role) => {
    if (pendingRedirect) return pendingRedirect;

    switch (role) {
      case 'Manager':
        return '/manager/dashboard';
      case 'Waiter':
        return '/waiter/orders';
      case 'Kitchen':
        return '/kitchen/orders';
      case 'Customer':
      default:
        return '/profile';
    }
  };

  // ==========================
  // SUBMIT LOGIN
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validation
    if (!trimmedEmail) {
      setError('Vui lòng nhập email.');
      setLoading(false);
      return;
    }

    if (!trimmedPassword) {
      setError('Vui lòng nhập mật khẩu.');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Email không đúng định dạng.');
      setLoading(false);
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      setLoading(false);
      return;
    }

    try {
      const response = await login(trimmedEmail, trimmedPassword);

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', trimmedEmail);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
      }

      setSuccess('Đăng nhập thành công! Đang chuyển hướng...');

      const userRole = response?.user?.role;
      const redirectPath = getPostLoginPath(userRole);

      console.log(`✅ Login success - Role: ${userRole} → Redirecting to: ${redirectPath}`);

      timeoutRef.current = setTimeout(() => {
        navigate(redirectPath);
      }, 1200);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // GOOGLE LOGIN
  // ==========================
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!credentialResponse?.credential) {
        throw new Error('Không nhận được token từ Google');
      }

      const googleToken = credentialResponse.credential;

      const response = await googleLogin(googleToken);

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', email.trim());
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
      }

      setSuccess('Đăng nhập Google thành công! Đang chuyển hướng...');

      const userRole = response?.user?.role;
      const redirectPath = getPostLoginPath(userRole);

      console.log(`✅ Google Login success - Role: ${userRole} → Redirecting to: ${redirectPath}`);

      timeoutRef.current = setTimeout(() => {
        navigate(redirectPath);
      }, 1200);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setError('Đăng nhập Google thất bại. Nếu chưa có tài khoản, vui lòng chọn Đăng ký bằng Google trước.');
  };

  // ==========================
  // UI
  // ==========================
  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-content">
          <button
            className="restaurant-logo-btn"
            onClick={() => navigate('/')}
            type="button"
          >
            <RestaurantLogo size={56} color="white" />
          </button>

          <h1 className="restaurant-name">
            <button
              className="restaurant-name-btn"
              onClick={() => navigate('/')}
              type="button"
            >
              Nhà hàng Lẩu Nướng
            </button>
          </h1>

          <p className="restaurant-subtitle">
            Nhà hàng chuyên về các món nướng và lẩu
          </p>

          <ul className="restaurant-features">
            <li>Nguyên liệu tươi sống, bảo quản kỹ càng</li>
            <li>Bếp trưởng chuyên nghiệp, tận tâm</li>
            <li>Gọi món nhanh chóng</li>
            <li>Phục vụ tận tâm với nhiều loại dịch vụ</li>
            <li>Nhiều combo ưu đãi đặc biệt</li>
          </ul>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h2 className="auth-title">Đăng Nhập</h2>
          <p className="auth-subtitle">Chào mừng bạn quay trở lại!</p>

          {/* Google */}
          <div className="google-auth-wrap">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              auto_select={false}
              useOneTap={false}
              text="signin"
              shape="pill"
              size="large"
              logo_alignment="left"
              width="320"
              theme="outline"
              locale="vi"
            />
          </div>

          <div className="divider">
            <span>Hoặc</span>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box">
              ⚠ {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="success-box">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="abc123@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group password-group">
              <label>Mật khẩu</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <div className="form-footer">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Ghi nhớ đăng nhập
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => navigate('/forgot-password')}
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="auth-toggle">
            Chưa có tài khoản?{' '}
            <button onClick={() => navigate('/register')}>
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;