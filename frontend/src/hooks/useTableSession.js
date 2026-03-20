import { useEffect, useState, useCallback } from 'react';
import * as tableSessionApi from '../api/tableSessionApi';

/**
 * useTableSession - Hook quản lý phiên làm việc của bàn
 * - Kiểm tra và làm mới token
 * - Tự động refresh token trước khi hết hạn
 * - Xử lý token hết hạn
 */
export const useTableSession = () => {
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Kiểm tra xem có token session không
  const hasTableSession = useCallback(() => {
    return !!localStorage.getItem('tableAccessToken');
  }, []);

  // Lấy token session hiện tại
  const getTableToken = useCallback(() => {
    return localStorage.getItem('tableAccessToken');
  }, []);

  // Lấy session info
  const getSessionInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = await tableSessionApi.getTableSessionInfo();
      setSessionInfo(info);
      return info;
    } catch (err) {
      console.error('Error getting session info:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Làm mới token
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('tableRefreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await tableSessionApi.refreshTableAccessToken(refreshToken);
      setSessionToken(response.accessToken);
      return response;
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError(err.message);
      // If refresh fails, clear session
      clearSession();
      throw err;
    }
  }, []);

  // Đóng session (call khi thanh toán thành công hoặc waiter đóng bàn)
  const closeSession = useCallback(async (tableCode) => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      if (!tableCode && sessionInfo?.tableCode) {
        tableCode = sessionInfo.tableCode;
      }

      if (!tableCode) {
        throw new Error('Table code not found');
      }

      await tableSessionApi.closeTable(tableCode, userId);
      clearSession();
      return true;
    } catch (err) {
      console.error('Error closing session:', err);
      setError(err.message);
      clearSession(); // Clear anyway
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionInfo?.tableCode]);

  // Hủy session (bởi backend, ví dụ khi waiter đóng bàn)
  const revokeSession = useCallback(async (tableCode, sessionId) => {
    try {
      setIsLoading(true);
      if (!tableCode && sessionInfo?.tableCode) {
        tableCode = sessionInfo.tableCode;
      }
      if (!sessionId && sessionInfo?.sessionId) {
        sessionId = sessionInfo.sessionId;
      }

      if (!tableCode) {
        throw new Error('Table code not found');
      }

      await tableSessionApi.revokeTableSession(tableCode, sessionId);
      clearSession();
      return true;
    } catch (err) {
      console.error('Error revoking session:', err);
      setError(err.message);
      clearSession(); // Clear anyway
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionInfo?.tableCode, sessionInfo?.sessionId]);

  // Xóa session khỏi localStorage
  const clearSession = useCallback(() => {
    localStorage.removeItem('tableAccessToken');
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('tableRefreshToken');
    localStorage.removeItem('tableCode');
    setSessionToken(null);
    setSessionInfo(null);
  }, []);

  // Auto-refresh token trước khi hết hạn
  useEffect(() => {
    if (!hasTableSession()) return;

    // Refresh every 15 minutes (token default expiresIn 30 min)
    const interval = setInterval(() => {
      refreshToken().catch((err) => {
        console.error('Auto-refresh failed:', err);
      });
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [hasTableSession, refreshToken]);

  // Load token từ localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('tableAccessToken');
    if (token) {
      setSessionToken(token);
    }
  }, []);

  return {
    sessionToken,
    sessionInfo,
    isLoading,
    error,
    hasTableSession,
    getTableToken,
    getSessionInfo,
    refreshToken,
    closeSession,
    revokeSession,
    clearSession,
  };
};

export default useTableSession;
