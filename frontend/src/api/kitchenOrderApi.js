import axiosInstance from './axiosInstance';

export async function apiGetPending() {
  const response = await axiosInstance.get('/order-items/pending');
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
  const config = orderId != null && orderId !== '' ? { params: { orderId: Number(orderId) } } : {};
  const r = await axiosInstance.get('/order-items/history/today', config);
  const d = r.data;
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
