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
});

// Request Interceptor - Thêm token vào tất cả requests
instance.interceptors.request.use(
  (config) => {
    // Đảm bảo headers mặc định
    config.headers = config.headers || {};
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    config.headers['Accept'] = config.headers['Accept'] || '*/*';

    const hasExplicitAuthHeader =
      typeof config.headers.Authorization === 'string' &&
      String(config.headers.Authorization).trim().length > 0;
    if (!hasExplicitAuthHeader) {
      const token =
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('tableAccessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
    // Backend có thể trả về text/plain thay vì JSON
    // Nếu response không phải JSON, wrap lại thành object
    const contentType = response.headers['content-type'] || '';
    if (typeof response.data === 'string') {
      if (contentType.includes('text/plain') || contentType.includes('text/html')) {
        response.data = { message: response.data };
      }
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    // Backend có thể trả về text/plain hoặc text/html thay vì JSON
    const rawData = error.response?.data;
    let message = error.message;
    if (typeof rawData === 'string') {
      // Trích xuất message từ HTML nếu là error page
      if (rawData.includes('<!DOCTYPE') || rawData.includes('<html')) {
        const match = rawData.match(/<title>(.*?)<\/title>/i);
        message = match ? match[1] : `Lỗi ${status}`;
      } else {
        message = rawData;
      }
    } else {
      message = rawData?.message || rawData?.Message || error.message;
    }
    const requestUrl = String(error?.config?.url || '').toLowerCase();
    const isContractSignRequest = requestUrl.includes('/contract/sign');
    
    console.error(`[API Error] Status: ${status}, Message: ${message}`);
    console.error('[API Error] Full response data:', JSON.stringify(error.response?.data, null, 2));

    // Handle 401 - Unauthorized
    if (status === 401) {
      console.warn('⚠️ Token expired. Redirecting to login...');
      const hadToken = !!localStorage.getItem('authToken') || !!localStorage.getItem('accessToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      const shouldRedirectToAuth = hadToken || isContractSignRequest;
      if (shouldRedirectToAuth && !window.location.pathname.includes('/auth')) {
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
    }

    return Promise.reject(error);
  }
);

export default instance;
export { API_BASE_URL };
