import instance from './axiosInstance';

/**
 * Table Session API
 * - Quản lý phiên làm việc của bàn (table session)
 * - Mở bàn (open table), trao đổi QR ticket, đóng bàn
 */

/* =====================================================
   HELPER: Handle Axios Error
===================================================== */
function handleApiError(error) {
  const status = error.response?.status || 500;
  const message =
    error.response?.data?.message ||
    error.message ||
    'Unexpected error occurred';

  const code = error.response?.data?.msgCode || null;

  return {
    status,
    message,
    code,
  };
}

/* =====================================================
   OPEN TABLE - Waiter mở bàn
   POST /api/tables/{tableCode}/open
   Body: { userId }
   Response: { tableId, tableCode, sessionId, qrTicket, createdAt }
===================================================== */
export async function openTable(tableCode, userId) {
  try {
    // Đúng chuẩn: truyền userId qua query, body để trống, encode tableCode
    const url = `/api/tables/${encodeURIComponent(tableCode)}/open?userId=${userId}`;
    const response = await instance.post(url);
    console.log('✅ Table opened:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to open table:', error);
    throw handleApiError(error);
  }
}

/* =====================================================
   EXCHANGE QR TICKET - Customer trao đổi QR ticket lấy access token
   POST /api/tables/exchange-ticket
   Body: { tableCode, qrTicket }
   Response: { accessToken, refreshToken, sessionId, expiresIn }
===================================================== */
export async function exchangeQrTicket(tableCode, qrTicket) {
  try {
    const response = await instance.post('/api/tables/exchange-ticket', {
      tableCode,
      qrTicket,
    });

    console.log('✅ QR ticket exchanged:', response.data);
    
    // Lưu access token vào localStorage với khóa riêng cho session
    if (response.data?.accessToken) {
      localStorage.setItem('tableAccessToken', response.data.accessToken);
      localStorage.setItem('tableSessionId', response.data.sessionId);
      localStorage.setItem('tableRefreshToken', response.data.refreshToken);
      localStorage.setItem('tableCode', tableCode);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Failed to exchange QR ticket:', error);
    throw handleApiError(error);
  }
}

/* =====================================================
   GET TABLE SESSION - Lấy thông tin phiên làm việc của bàn
   GET /api/tables/{tableCode}/active-session
   Response: { tableId, tableCode, sessionId, status, createdAt, orders[] }
===================================================== */
export async function getTableSession(tableCode) {
  try {
    const response = await instance.get(`/api/tables/${tableCode}/active-session`);
    console.log('✅ Table session retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get table session:', error);
    throw handleApiError(error);
  }
}

/* =====================================================
   REFRESH TABLE ACCESS TOKEN - Làm mới access token cho bàn
   POST /api/tables/refresh
   Body: { refreshToken }
   Response: { accessToken, expiresIn }
===================================================== */
export async function refreshTableAccessToken(refreshToken) {
  try {
    const response = await instance.post('/api/tables/refresh', {
      refreshToken: refreshToken || localStorage.getItem('tableRefreshToken'),
    });

    console.log('✅ Table access token refreshed:', response.data);

    // Cập nhật access token mới
    if (response.data?.accessToken) {
      localStorage.setItem('tableAccessToken', response.data.accessToken);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Failed to refresh table access token:', error);
    throw handleApiError(error);
  }
}

/* =====================================================
   CLOSE TABLE - Đóng bàn & hủy access token
   POST /api/tables/{tableCode}/close
   Body: { userId }
   Response: { success, message }
===================================================== */
export async function closeTable(tableCode, userId) {
  try {
    const response = await instance.post(`/api/tables/${tableCode}/close`, {
      userId,
    });

    console.log('✅ Table closed:', response.data);

    // Xóa session token khỏi localStorage
    localStorage.removeItem('tableAccessToken');
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('tableRefreshToken');
    localStorage.removeItem('tableCode');

    return response.data;
  } catch (error) {
    console.error('❌ Failed to close table:', error);
    throw handleApiError(error);
  }
}

/* =====================================================
   REVOKE SESSION - Hủy phiên, vô hiệu hóa tất cả token của bàn
   POST /api/tables/{tableCode}/revoke-session
   Body: { sessionId }
   Response: { success, message }
===================================================== */
export async function revokeTableSession(tableCode, sessionId) {
  try {
    const response = await instance.post(`/api/tables/${tableCode}/revoke-session`, {
      sessionId,
    });

    console.log('✅ Table session revoked:', response.data);

    // Xóa session token khỏi localStorage
    localStorage.removeItem('tableAccessToken');
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('tableRefreshToken');
    localStorage.removeItem('tableCode');

    return response.data;
  } catch (error) {
    console.error('❌ Failed to revoke table session:', error);
    throw handleApiError(error);
  }
}

/* =====================================================
   GET TABLE QR CODE - Lấy QR code của bàn
   GET /api/tables/{tableCode}/qrcode
   Response: { qrCode, tableCode, tableId }
===================================================== */
export async function getTableQrCode(tableCode) {
  try {
    const response = await instance.get(`/api/tables/${tableCode}/qrcode`);
    console.log('✅ QR code retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get table QR code:', error);
    throw handleApiError(error);
  }
}

/* =====================================================
   GET TABLE SESSION INFO - Lấy thông tin phiên (từ token)
   GET /api/tables/session/info
   Response: { tableCode, tableId, sessionId, userId, role, createdAt }
===================================================== */
export async function getTableSessionInfo() {
  try {
    // Sử dụng tableAccessToken nếu có
    const token = localStorage.getItem('tableAccessToken');
    if (!token) {
      throw new Error('No table session token found');
    }

    const response = await instance.get('/api/tables/session/info');
    console.log('✅ Table session info retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get table session info:', error);
    throw handleApiError(error);
  }
}
