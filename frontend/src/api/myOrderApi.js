import axios from 'axios';

const API_BASE_URL = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Tự động đính kèm Token để lấy đúng đơn hàng của User đang đăng nhập
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const myOrderAPI = {
  getOrders: async (orderType = 'All', statusList = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled']) => {
    // Nếu chọn 'All', ta gửi tham số orderType rỗng để lấy toàn bộ các loại đơn
    const typeParam = orderType === 'All' ? '' : `orderType=${orderType}&`;
    const statusParams = statusList.map(s => `status=${s}`).join('&');
    
    // Gọi POST /order/filter (Endpoint đúng để tránh lỗi 404)
    const response = await api.post(`/order/filter?${typeParam}${statusParams}`);
    return response.data;
  },

  cancelOrder: async (orderId) => {
    const response = await api.post(`/order/cancel/${orderId}`);
    return response.data;
  }
};