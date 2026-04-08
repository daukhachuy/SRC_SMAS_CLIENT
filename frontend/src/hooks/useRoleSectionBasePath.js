import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Cùng một bộ trang (đơn hàng, đặt chỗ) dùng cho /manager và /admin.
 * Trả về prefix và trang "Trang chủ" tương ứng layout.
 */
export function useRoleSectionBasePath() {
  const { pathname } = useLocation();
  return useMemo(() => {
    if (pathname.startsWith('/admin')) {
      return { base: '/admin', homePath: '/admin' };
    }
    return { base: '/manager', homePath: '/manager/dashboard' };
  }, [pathname]);
}
