import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

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

  useEffect(() => {
    // Kiểm tra token
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      console.warn('⚠️ [ProtectedRoute] No token found - Redirecting to /auth');
      setIsAuthorized(false);
      setIsChecking(false);
      return;
    }

    // Kiểm tra role nếu backend có cung cấp
    if (requiredRole && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== requiredRole) {
          console.warn(`⚠️ [ProtectedRoute] User role "${user.role}" does not match required role "${requiredRole}"`);
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
    
    // Không có token → redirect to login
    if (!token) {
      return <Navigate to="/auth" replace />;
    }
    
    // Có token nhưng role không đủ → redirect to home
    return <Navigate to="/" replace />;
  }

  // Nếu được phép → render children
  return children;
};

export default ProtectedRoute;
