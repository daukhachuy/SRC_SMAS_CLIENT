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
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Chỉ redirect nếu không ở trang auth
      if (!window.location.pathname.includes('/auth')) {
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
