import instance from './axiosInstance';

export const myOrderAPI = {
  getOrders: async (orderType = 'All', statusList = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled']) => {
    const typeParam = orderType === 'All' ? '' : `orderType=${orderType}&`;
    const statusParams = statusList.map(s => `status=${s}`).join('&');
    
    const response = await instance.post(`/order/filter?${typeParam}${statusParams}`);
    return response.data;
  },

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
    const response = await instance.get(`/reservation/my`, { params: { userId } });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && !Array.isArray(data)) return [data];
    return data?.data ?? [];
  },

  cancelOrder: async (orderId) => {
    const response = await instance.post(`/order/cancel/${orderId}`);
    return response.data;
  }
};
