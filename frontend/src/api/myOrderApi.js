import axios from 'axios';

const API_BASE_URL = "https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api";

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

  /** GET /api/reservation/my?userId=... - Lấy danh sách đặt bàn theo ID tài khoản đang đăng nhập */
  getReservations: async () => {
    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.userId ?? user.id ?? null;
      } catch (_) {}
    }
    if (!userId) {
      return [];
    }
    const response = await api.get(`/reservation/my`, { params: { userId } });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && !Array.isArray(data)) return [data];
    return data?.data ?? [];
  },

  cancelOrder: async (orderId) => {
    const response = await api.post(`/order/cancel/${orderId}`);
    return response.data;
  }
};