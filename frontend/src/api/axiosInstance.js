import axios from 'axios';

/**
 * Axios Instance với interceptors
 * - Automatically thêm token vào requests
 * - Handle 401 errors
 * - Retry logic cho network failures
 * - CORS compatibility
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';

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
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
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
    
    console.error(`[API Error] Status: ${status}, Message: ${message}`);

    // Handle 401 - Unauthorized
    if (status === 401) {
      console.warn('⚠️ Token expired. Redirecting to login...');
      const hadToken = !!localStorage.getItem('authToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Chỉ redirect khi trước đó có token (phiên hết hạn), tránh đá người dùng guest khỏi trang public
      if (hadToken && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
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
