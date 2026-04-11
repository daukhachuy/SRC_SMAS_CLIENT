import axios from 'axios';

/**
 * Axios Instance với interceptors
 * - Automatically thêm token vào requests
 * - Handle 401 errors
 * - Retry logic cho network failures
 * - CORS compatibility
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request Interceptor - Thêm token vào tất cả requests
instance.interceptors.request.use(
  (config) => {
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    const tableToken = localStorage.getItem('tableAccessToken');
    const requestUrl = String(config?.url || '').toLowerCase();
    const isTableSessionRoute =
      requestUrl.includes('/order/session/') ||
      requestUrl.includes('/tables/') ||
      requestUrl.includes('/getfoods-buffer-') ||
      /\/order\/[^/]+\/items/.test(requestUrl) ||
      requestUrl.includes('/add-');
    const isPaymentRoute = requestUrl.includes('/payment/');

    // Chỉ ưu tiên token bàn cho endpoint session của bàn.
    // Payment và endpoint chung sẽ ưu tiên auth token trước.
    let token = authToken || tableToken;
    if (isTableSessionRoute) {
      token = tableToken || authToken;
    } else if (isPaymentRoute) {
      token = authToken || tableToken;
    }
    // Log chi tiết token và API URL để debug
    console.log('[DEBUG] API BASE URL:', API_BASE_URL);
    console.log('[DEBUG] Token FE gửi lên:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url} → Bearer ${token.slice(0, 20)}...`);
    } else {
      console.warn(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url} → NO TOKEN`);
    }
    return config;
  },
  (error) => {
    console.error('Request setup error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle errors & unauthorized
instance.interceptors.response.use(
  (response) => {
    console.debug(`[API Response] ${response.status} - ${response.statusText}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const requestUrl = String(error?.config?.url || '').toLowerCase();
    
    console.error(`[API Error] Status: ${status}, Message: ${message}`);

    // Handle 401 - Unauthorized
    if (status === 401) {
      const currentPath = String(window.location.pathname || '').toLowerCase();
      const isGuestQrPath = currentPath.includes('/guest-qr-order') || currentPath.includes('/table/');
      const isTableSessionRoute =
        requestUrl.includes('/order/session/') ||
        requestUrl.includes('/tables/') ||
        requestUrl.includes('/getfoods-buffer-');
      const hadAuthToken = !!(localStorage.getItem('authToken') || localStorage.getItem('accessToken'));

      if (isTableSessionRoute) {
        localStorage.removeItem('tableAccessToken');
        localStorage.removeItem('tableRefreshToken');
        localStorage.removeItem('tableSessionId');
        console.warn('⚠️ Table session unauthorized/expired.');
      } else if (!isGuestQrPath) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (hadAuthToken && !window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
        }
      } else {
        console.warn('⚠️ Unauthorized on guest QR endpoint (likely insufficient scope).');
      }
    }

    // Handle 403 - Forbidden
    if (status === 403) {
      console.warn('⚠️ Access forbidden. Check permissions.');
    }

    // Handle 404 - Not Found
    if (status === 404) {
      console.error('❌ Endpoint not found:', error.config?.url);
    }

    // Handle 500+ - Server errors
    if (status >= 500) {
      console.error('❌ Server error. Backup plan: cached data?');
    }

    // Network error
    if (!error.response) {
      console.error('❌ Network error - Backend unreachable at:', API_BASE_URL);
      // Có thể implement offline mode ở đây
    }

    return Promise.reject(error);
  }
);

export default instance;
export { API_BASE_URL };
