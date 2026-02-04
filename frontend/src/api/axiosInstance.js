import axios from 'axios';

/**
 * Axios Instance với interceptors
 * Automatically thêm token vào requests và handle 401 errors
 */

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001/api',
  timeout: 10000
});

// Request Interceptor - Thêm token vào tất cả requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle unauthorized (401)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired hoặc unauthorized
      console.warn('Token expired. Redirecting to login...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default instance;
