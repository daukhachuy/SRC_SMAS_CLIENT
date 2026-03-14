import axios from 'axios';

const BASE_URL = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Auto attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const discountAPI = {
  // Validate a discount code using GET /api/discount/{code}
  validateDiscount: async (code) => {
    const normalizedCode = (code || '').trim().toUpperCase();
    if (!normalizedCode) throw new Error('Vui lòng nhập mã giảm giá');

    const { data } = await api.get(`/discount/${normalizedCode}`);
    return data;
  },

  // Get all discounts using GET /api/discount/lists
  getAllDiscounts: async () => {
    const { data } = await api.get('/discount/lists');
    return data;
  }
};
