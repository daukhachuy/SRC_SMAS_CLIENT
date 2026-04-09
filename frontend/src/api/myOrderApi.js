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
 * Trích mảng đơn từ body phản hồi (Swagger thường: { msgCode, message, data: Order[] }).
 * Hỗ trợ PascalCase, $values (EF), lồng nhau.
 */
function extractOrderArrayFromHistoryBody(body) {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body)) return body;

  const nested = body.data ?? body.Data ?? body.result ?? body.Result;
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === 'object') {
    if (Array.isArray(nested.$values)) return nested.$values;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.Items)) return nested.Items;
    if (Array.isArray(nested.orders)) return nested.orders;
    if (Array.isArray(nested.Orders)) return nested.Orders;
  }

  if (Array.isArray(body.$values)) return body.$values;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.Items)) return body.Items;
  return [];
}

/**
 * GET /api/order/history/my — lịch sử đơn của user đăng nhập (Bearer token)
 * Response Swagger: { msgCode, message, data: Order[] }
 */
export async function getMyOrderHistory() {
  const res = await instance.get('/order/history/my');
  console.log('[getMyOrderHistory] raw response.data:', res.data);
  console.log('[getMyOrderHistory] typeof:', typeof res.data);
  if (res.data && typeof res.data === 'object') {
    console.log('[getMyOrderHistory] keys:', Object.keys(res.data));
  }
  return extractOrderArrayFromHistoryBody(res.data);
}

function unwrapResponseData(body) {
  if (body && typeof body === 'object' && body.data !== undefined && body.data !== null) return body.data;
  return body;
}

/**
 * GET /api/order/{orderCode} — chi tiết một đơn (Bearer)
 */
export async function getOrderByOrderCode(orderCode) {
  if (!orderCode) return null;
  const code = encodeURIComponent(String(orderCode).trim());
  const res = await instance.get(`/order/${code}`);
  return unwrapResponseData(res.data);
}

/**
 * GET /api/order/{orderCode}/items — dòng món trong đơn
 */
export async function getOrderItemsByOrderCode(orderCode) {
  if (!orderCode) return [];
  const code = encodeURIComponent(String(orderCode).trim());
  const res = await instance.get(`/order/${code}/items`);
  const d = unwrapResponseData(res.data);
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.$values)) return d.$values;
  return [];
}

export const myOrderAPI = {
  /** Alias GET /order/history/my — dùng cho trang Lịch sử đơn (khách đăng nhập) */
  getMyOrderHistory,
  getOrderByOrderCode,
  getOrderItemsByOrderCode,

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

  /**
   * POST /api/order/filter — tìm một đơn theo orderCode khi cần đủ mọi trạng thái
   * (Pending, Confirmed, Completed, Cancelled/Canceled…). GET /order/{code} có thể không trả đơn hủy/chưa xong.
   */
  getOrderByCodeViaFilter: async (orderCode, orderType = 'Delivery') => {
    const statuses = [
      'Pending',
      'Confirmed',
      'Processing',
      'Completed',
      'Cancelled',
      'Canceled',
    ];
    const list = await myOrderAPI.getOrders(orderType, statuses);
    const c = String(orderCode ?? '').trim();
    if (!c || !Array.isArray(list)) return null;
    return (
      list.find((o) => String(o.orderCode) === c) ||
      list.find((o) => String(o.orderId) === c) ||
      null
    );
  },

  /**
   * GET /api/reservation/my — đặt chỗ của user (Bearer). Swagger: userId query optional.
   * Response: mảng object có status dạng số (1–4) hoặc chuỗi ("Pending", "Cancelled", …).
   */
  getReservations: async (status = null) => {
    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.userId ?? user.id ?? null;
      } catch (_) {}
    }
    const params = {};
    if (userId != null && userId !== '') params.userId = userId;
    if (status != null && status !== '' && String(status).toLowerCase() !== 'all') {
      const s = String(status).trim();
      const num = Number(s);
      // Backend thường nhận status là int 1–4; đồng thời hỗ trợ tên enum nếu cần
      if (!Number.isNaN(num) && num >= 1 && num <= 4) {
        params.status = num;
      } else {
        params.status = s;
      }
    }
    try {
      const response = await instance.get(`/reservation/my`, { params });
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

/** Alias: tìm đơn qua POST /order/filter (đủ trạng thái). */
export async function getOrderByCodeViaFilter(orderCode, orderType = 'Delivery') {
  return myOrderAPI.getOrderByCodeViaFilter(orderCode, orderType);
}
