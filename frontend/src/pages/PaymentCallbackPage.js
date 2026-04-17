import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const resolveRoleFallbackPath = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = String(user?.role || '').trim().toLowerCase();
    if (role === 'waiter') return '/waiter/orders';
    if (role === 'manager') return '/manager/orders';
    if (role === 'admin') return '/admin/orders';
  } catch {
    // ignore
  }
  return '/';
};

const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const isSuccessPath = location.pathname === '/payment/success';
  const statusText = String(searchParams.get('status') || '').trim().toUpperCase();
  const cancelFlag = String(searchParams.get('cancel') || '').trim().toLowerCase();

  const isSuccess = useMemo(() => {
    if (!isSuccessPath) return false;
    if (cancelFlag === 'true') return false;
    if (!statusText) return true;
    return statusText === 'PAID' || statusText === 'SUCCESS' || statusText === 'COMPLETED';
  }, [isSuccessPath, cancelFlag, statusText]);

  const orderCode = searchParams.get('orderCode') || searchParams.get('orderId') || '';
  const returnTo = searchParams.get('returnTo') || '';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown > 0) return;

    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(resolveRoleFallbackPath(), { replace: true });
  }, [countdown, navigate, returnTo]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6f7fb',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
          padding: 24,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            background: isSuccess ? '#dcfce7' : '#fee2e2',
            color: isSuccess ? '#166534' : '#991b1b',
            fontSize: 28,
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          {isSuccess ? '✓' : '×'}
        </div>

        <h2 style={{ margin: 0, marginBottom: 6, fontSize: 28, color: '#111827' }}>
          {isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}
        </h2>
        <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.55 }}>
          {isSuccess
            ? `Đơn ${orderCode ? `#${orderCode} ` : ''}đã được ghi nhận thanh toán.`
            : 'Giao dịch bị hủy hoặc chưa thành công. Vui lòng kiểm tra lại đơn hàng.'}
        </p>
        <p style={{ margin: '14px 0 0', color: '#6b7280' }}>
          Tự động quay lại sau <strong>{countdown}s</strong>.
        </p>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
