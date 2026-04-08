import instance from './axiosInstance';

// Map frontend type → backend orderType (theo Swagger pattern: ^(DineIn|TakeAway|Delivery|EventBooking)$)
const MAP_ORDER_TYPE = {
  dinein: 'DineIn',
  takeAway: 'TakeAway',
  takeaway: 'TakeAway',
  delivery: 'Delivery',
  event: 'EventBooking',
  eventBooking: 'EventBooking',
};

/**
 * GET /api/order/history/my — lịch sử đơn của user đăng nhập (Bearer token)
 * Response Swagger: { msgCode, message, data: Order[] }
 */
export async function getMyOrderHistory() {
  const res = await instance.get('/order/history/my');
  const body = res.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.$values)) return body.$values;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

export const myOrderAPI = {
  /** Alias GET /order/history/my — dùng cho trang Lịch sử đơn (khách đăng nhập) */
  getMyOrderHistory,

  getOrders: async (orderType = 'All', statusList = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled']) => {
    // Swagger: POST /api/order/filter — orderType là required query param
    // pattern: ^(DineIn|TakeAway|Delivery|EventBooking)$
    const normalizedType = MAP_ORDER_TYPE[orderType?.toLowerCase()] ?? null;

    if (!normalizedType) {
      // Không filter theo type → gọi /order/history (GET, không có query param)
      try {
        const res = await instance.get('/order/history');
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data?.$values) return data.$values;
        if (data?.data) return data.data;
        return [];
      } catch {
        return [];
      }
    }

    // POST /api/order/filter?orderType=...&status=...&status=... (Swagger: nhiều status lặp query)
    const statuses = statusList.filter(Boolean);
    const statusParams = statuses.map((s) => `status=${encodeURIComponent(s)}`).join('&');
    try {
      const res = await instance.post(
        `/order/filter?orderType=${encodeURIComponent(normalizedType)}&${statusParams}`,
        null
      );
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.$values) return data.$values;
      if (data?.data) return data.data;
      return [];
    } catch (err) {
      // 404/400 khi không có đơn loại đó → trả mảng rỗng, không throw
      if (err?.response?.status === 404 || err?.response?.status === 400) {
        console.warn('[myOrderAPI] No orders for type:', normalizedType);
        return [];
      }
      throw err;
    }
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
    if (!userId) return [];
    try {
      const response = await instance.get(`/reservation/my`, { params: { userId } });
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data?.$values) return data.$values;
      return data?.data ?? [];
    } catch {
      return [];
    }
  },

  cancelOrder: async (orderId) => {
    const response = await instance.post(`/order/cancel/${orderId}`);
    return response.data;
  },

  // GET /api/book-event/my — danh sách đặt sự kiện của user (đang hoạt động)
  getMyBookEvents: async () => {
    try {
      const response = await instance.get('/book-event/my');
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data?.$values) return data.$values;
      if (data?.data) return data.data;
      return [];
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 400) return [];
      throw err;
    }
  },

  // GET /api/book-event/{id}/detail — chi tiết một đặt sự kiện
  getBookEventDetail: async (bookEventId) => {
    const response = await instance.get(`/book-event/${bookEventId}/detail`);
    return response.data;
  },

  // GET /api/book-event/history — lịch sử đặt sự kiện của user
  getMyEvents: async () => {
    try {
      const response = await instance.get('/book-event/history');
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data?.$values) return data.$values;
      if (data?.data) return data.data;
      return [];
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 400) return [];
      throw err;
    }
  },
};
