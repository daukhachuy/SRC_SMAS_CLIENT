import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthRequiredModal.css';

const AuthRequiredModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="auth-required-overlay" role="dialog" aria-modal="true" aria-label="Yêu cầu đăng nhập">
      <div className="auth-required-modal">
        <div className="auth-required-badge">Trải nghiệm đầy đủ</div>
        <h3 className="auth-required-title">🍽 Chào mừng bạn đến với nhà hàng của chúng tôi</h3>
        <p className="auth-required-content">
          Để tiếp tục sử dụng tính năng này, vui lòng đăng nhập vào tài khoản của bạn.
          Điều này giúp bạn đặt bàn, đặt món và quản lý đơn hàng một cách thuận tiện hơn.
        </p>

        <div className="auth-required-actions">
          <button
            type="button"
            className="auth-required-btn primary"
            onClick={() => navigate('/auth')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className="auth-required-btn secondary"
            onClick={() => navigate('/register')}
          >
            Tạo tài khoản
          </button>
          <button
            type="button"
            className="auth-required-btn ghost"
            onClick={() => {
              if (onClose) onClose();
              navigate('/');
            }}
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
