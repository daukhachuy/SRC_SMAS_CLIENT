import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AuthRequiredModal from './AuthRequiredModal';

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const getRoleHomePath = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'manager') return '/manager';
  if (normalizedRole === 'waiter') return '/waiter';
  if (normalizedRole === 'kitchen') return '/kitchen';
  if (normalizedRole === 'admin') return '/admin';
  return '/';
};

/**
 * Protected Route Component
 * - Kiểm tra xem user đã đăng nhập chưa (có token)
 * - Kiểm tra role nếu cần
 * - Nếu chưa đăng nhập, redirect về /auth
 * - Nếu role không đủ, redirect về home
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Kiểm tra token
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      console.warn('⚠️ [ProtectedRoute] No token found - Showing auth required modal');
      setIsAuthorized(false);
      setShowAuthModal(true);
      setIsChecking(false);
      return;
    }

    // Kiểm tra role nếu route yêu cầu
    if (requiredRole) {
      if (!userStr) {
        console.warn('⚠️ [ProtectedRoute] Missing user info while role is required');
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const userRole = String(user.role || '').toLowerCase();
        const requiredRoles = Array.isArray(requiredRole)
          ? requiredRole.map((role) => String(role).toLowerCase())
          : [String(requiredRole).toLowerCase()];

        if (!requiredRoles.includes(userRole)) {
          console.warn(`⚠️ [ProtectedRoute] User role "${user.role}" does not match required role(s): ${requiredRoles.join(', ')}`);
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing user:', error);
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }
    }

    console.log('✅ [ProtectedRoute] Authorization granted');
    setIsAuthorized(true);
    setShowAuthModal(false);
    setIsChecking(false);
  }, [requiredRole]);

  // Khi đang kiểm tra, hiển thị loading
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '2em',
            marginBottom: '20px'
          }}>⏳</div>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  // Nếu không được phép
  if (!isAuthorized) {
    const token = localStorage.getItem('authToken');
    
    // Không có token → hiển thị modal yêu cầu đăng nhập
    if (!token) {
      return <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />;
    }
    
    // Có token nhưng role không đủ → quay về trang chính theo role hiện tại
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return <Navigate to={getRoleHomePath(user?.role)} replace />;
      }
    } catch (error) {
      console.error('Error reading user role for redirect:', error);
    }

    return <Navigate to="/" replace />;
  }

  // Nếu được phép → render children
  return children;
};

export default ProtectedRoute;
