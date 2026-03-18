import * as tableSessionApi from '../api/tableSessionApi';

/**
 * Utility hàm xử lý thanh toán thành công
 * - Đóng bàn (close table) để hủy access token
 * - Clear session khỏi localStorage
 */

export const handlePaymentSuccess = async (tableCode, sessionId) => {
  try {
    console.log('📦 Payment successful. Closing table:', tableCode);

    // Nếu có session ID, hủy session (revoke)
    if (sessionId) {
      try {
        await tableSessionApi.revokeTableSession(tableCode, sessionId);
        console.log('✅ Table session revoked');
      } catch (err) {
        console.warn('⚠️ Failed to revoke session, trying close:', err);
        // Fallback: try to close table
        const userId = localStorage.getItem('userId');
        if (userId) {
          await tableSessionApi.closeTable(tableCode, userId);
        }
      }
    } else {
      // Fallback: close table
      const userId = localStorage.getItem('userId');
      if (userId) {
        await tableSessionApi.closeTable(tableCode, userId);
        console.log('✅ Table closed');
      }
    }

    // Clear table session từ localStorage
    localStorage.removeItem('tableAccessToken');
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('tableRefreshToken');
    localStorage.removeItem('tableCode');

    return true;
  } catch (err) {
    console.error('❌ Error closing table on payment:', err);
    // Clear session anyway, so user can exit
    localStorage.removeItem('tableAccessToken');
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('tableRefreshToken');
    localStorage.removeItem('tableCode');
    throw err;
  }
};

/**
 * Utility hàm xử lý thanh toán thất bại
 * - Giữ token session (khách vẫn có thể thử lại)
 * - Hiển thị lỗi cho khách
 */
export const handlePaymentFailure = (errorCode, errorDesc) => {
  console.log('❌ Payment failed:', { errorCode, errorDesc });
  // Session vẫn còn, khách có thể thử lại
  // Không cần xóa token
  return {
    errorCode,
    errorDesc,
  };
};

/**
 * Kiểm tra xem user có đang ở trong table session không
 */
export const isInTableSession = () => {
  return !!localStorage.getItem('tableAccessToken');
};

/**
 * Lấy thông tin table session hiện tại
 */
export const getTableSessionData = () => {
  return {
    tableCode: localStorage.getItem('tableCode'),
    sessionId: localStorage.getItem('tableSessionId'),
    accessToken: localStorage.getItem('tableAccessToken'),
    refreshToken: localStorage.getItem('tableRefreshToken'),
  };
};
