import axiosInstance from './axiosInstance';

export async function apiGetPending() {
  let response;
  try {
    response = await axiosInstance.get('/order-items/pending');
  } catch (e) {
    // 404 hoặc lỗi mạng → trả mảng rỗng, không crash
    if (e?.response?.status === 404) return [];
    throw e;
  }
  const d = response.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.$values)) return d.$values;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

/**
 * GET /api/order-items/in-progress
 * Trả về items đang nấu / sẵn sàng (bổ sung cho /pending).
 * Nếu backend chưa triển khai route này (404), trả [] — không chặn tải /pending.
 */
export async function apiGetInProgress() {
  let response;
  try {
    response = await axiosInstance.get('/order-items/in-progress');
  } catch (e) {
    if (e?.response?.status === 404) return [];
    throw e;
  }
  const d = response.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.$values)) return d.$values;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

export async function apiStartItem(id) {
  const r = await axiosInstance.patch('/order-items/' + id + '/preparing');
  return r.data;
}

export async function apiReadyItem(id) {
  const r = await axiosInstance.patch('/order-items/' + id + '/ready');
  return r.data;
}

export async function apiCancelItem(id, reason) {
  const r = await axiosInstance.post('/order-items/' + id + '/cancel', { reason: reason || '' });
  return r.data;
}

export async function apiStartAll(orderId) {
  const r = await axiosInstance.patch('/orders/' + orderId + '/items/all-preparing');
  return r.data;
}

export async function apiReadyAll(orderId) {
  const r = await axiosInstance.patch('/orders/' + orderId + '/items/all-ready');
  return r.data;
}

/**
 * GET /api/order-items/history/today?orderId= (optional)
 * Response Swagger: { date, totalItems, items: [...] }
 */
export async function apiHistoryToday(orderId) {
  let response;
  try {
    const config = orderId != null && orderId !== '' ? { params: { orderId: Number(orderId) } } : {};
    response = await axiosInstance.get('/order-items/history/today', config);
  } catch (e) {
    if (e?.response?.status === 404) return { date: null, totalItems: 0, items: [] };
    throw e;
  }
  const d = response.data;
  if (!d) {
    return { date: null, totalItems: 0, items: [] };
  }
  if (Array.isArray(d)) {
    return { date: null, totalItems: d.length, items: d };
  }
  const items = Array.isArray(d.items)
    ? d.items
    : Array.isArray(d.$values)
      ? d.$values
      : Array.isArray(d.data)
        ? d.data
        : [];
  return {
    date: d.date ?? null,
    totalItems: typeof d.totalItems === 'number' ? d.totalItems : items.length,
    items
  };
}
