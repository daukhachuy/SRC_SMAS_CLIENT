import instance from './axiosInstance';

/**
 * Chuẩn hóa SĐT VN cho tra cứu đặt bàn: 0782088535 → +84782088535 (BE đang khớp dạng +84).
 * Email / chuỗi có chữ (mã đặt bàn) giữ nguyên.
 */
const normalizeReservationPhoneOrEmailQuery = (raw) => {
  const s = String(raw || '').trim();
  if (!s || s.includes('@')) return s;
  const tight = s.replace(/\s/g, '');
  if (/[a-zA-Z]/.test(tight)) return s;
  const compact = tight.replace(/[.\u2013\u2014-]/g, '');
  if (!/^\+?\d+$/.test(compact)) return s;
  let d = compact.startsWith('+') ? compact.slice(1) : compact;
  d = d.replace(/\D/g, '');
  if (d.length < 9 || d.length > 15) return s;
  if (d.startsWith('84')) {
    let rest = d.slice(2);
    if (rest.startsWith('0') && rest.length >= 9) rest = rest.slice(1);
    if (rest.length >= 8) return `+84${rest}`;
    return s;
  }
  if (d.startsWith('0') && d.length >= 10) {
    return `+84${d.slice(1)}`;
  }
  if (!d.startsWith('0') && d.length === 9 && /^[35789]/.test(d)) {
    return `+84${d}`;
  }
  return s;
};

const withOptionalBearer = (token) => {
  const raw = String(token || '').trim();
  if (!raw) return undefined;
  return { Authorization: `Bearer ${raw}` };
};

// Thêm món vào đơn hàng (orderCode) - endpoint cũ (1 item/request)
export const addItemToOrder = async (orderCode, item) => {
  // item: { foodId, comboId, buffetId, quantity, note }
  const response = await instance.post(`/order/${orderCode}/items`, item);
  return response.data;
};

// Thêm nhiều món vào đơn hàng theo endpoint mới
// POST /api/add-{orderCode}-items
export const addItemsToOrder = async (orderCode, items) => {
  const safeOrderCode = encodeURIComponent(String(orderCode || '').trim());
  if (!safeOrderCode) {
    throw new Error('orderCode is required');
  }

  const endpoint = `/add-${safeOrderCode}-items`;

  const withAliases = (items || []).map((it) => ({
    ...it,
    // Alias cho backend có thể đặt tên property khác nhau
    quantityBufferChildren: it.quantityBufferChildent ?? 0,
    quantityBuffetChildren: it.quantityBufferChildent ?? 0,
    quantityChild: it.quantityBufferChildent ?? 0,
  }));

  try {
    const response = await instance.post(endpoint, items);
    return response.data;
  } catch (error1) {
    const s1 = error1?.response?.status;
    // Một số backend nhận object thay vì array trực tiếp
    if (s1 === 400 || s1 === 404) {
      try {
        const response2 = await instance.post(endpoint, { items });
        return response2.data;
      } catch (error2) {
        const s2 = error2?.response?.status;
        // Thử lại với alias field cho child quantity
        if (s2 === 400 || s2 === 404) {
          const response3 = await instance.post(endpoint, withAliases);
          return response3.data;
        }
        throw error2;
      }
    }
    throw error1;
  }
};

// Lấy danh sách buffet/foods buffet theo orderCode
// GET /api/getfoods-buffer-{orderCode}
export const getFoodsBufferByOrderCode = async (orderCode) => {
  const safeOrderCode = encodeURIComponent(String(orderCode || '').trim());
  if (!safeOrderCode) {
    throw new Error('orderCode is required');
  }
  const response = await instance.get(`/getfoods-buffer-${safeOrderCode}`);
  return response.data;
};
// Tạo đơn theo đặt bàn (reservation)
export const createOrderByReservation = async (payload) => {
  try {
    const response = await instance.post('/orders/by-reservation', payload);
    return response.data;
  } catch (error) {
    console.error('Lỗi tạo đơn theo đặt bàn:', error.response?.status, error.response?.data);
    throw error;
  }
};

// Tạo đơn theo thông tin liên hệ (member)
export const createOrderByContact = async (payload) => {
  try {
    const response = await instance.post('/orders/by-contact', payload);
    return response.data;
  } catch (error) {
    console.error('Lỗi tạo đơn theo thông tin liên hệ:', error.response?.status, error.response?.data);
    throw error;
  }
};

// Tra cứu thông tin đơn/khách theo keyword
// Một số bản backend chỉ map POST /api/order/lookup (singular) — 405 nếu gọi /orders/lookup.
export const lookupOrder = async (type, keyword) => {
  const body = {
    type: String(type || '').trim(),
    keyword: String(keyword || '').trim(),
  };
  if (!body.keyword) {
    throw new Error('keyword is required');
  }
  const attempts = [
    () => instance.post('/orders/lookup', body),
    () => instance.post('/order/lookup', body),
  ];
  let lastError;
  for (let i = 0; i < attempts.length; i += 1) {
    try {
      const response = await attempts[i]();
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 405 || status === 404) {
        continue;
      }
      console.error('Lỗi tra cứu orders/lookup:', status, error.response?.data);
      throw error;
    }
  }
  console.error('Lỗi tra cứu lookup (cả /orders/lookup và /order/lookup):', lastError?.response?.status, lastError?.response?.data);
  throw lastError;
};

// GET /api/reservation/check-availability-phoneoremail — BE có thể đặt tên query khác nhau
export const checkReservationAvailabilityByPhoneOrEmail = async (request) => {
  const keyword = normalizeReservationPhoneOrEmailQuery(String(request || '').trim());
  if (!keyword) return [];
  const path = '/reservation/check-availability-phoneoremail';
  const paramVariants = [
    { request: keyword },
    { phoneOrEmail: keyword },
    { contact: keyword },
    { phone: keyword },
    { email: keyword },
    { keyword },
    { q: keyword },
  ];
  let lastError;
  for (const params of paramVariants) {
    try {
      const response = await instance.get(path, { params });
      return response.data;
    } catch (error) {
      lastError = error;
      const st = error?.response?.status;
      if (st !== 400 && st !== 404 && st !== 405) break;
    }
  }
  console.error(
    'Lỗi tra cứu reservation/check-availability-phoneoremail:',
    lastError?.response?.status,
    lastError?.response?.data
  );
  throw lastError;
};
/** @deprecated dùng trực tiếp từ ./kitchenOrderApi — giữ để tương thích import cũ */
export { apiGetPending as fetchPendingOrderItems } from './kitchenOrderApi';

export const fetchUserOrders = async (orderType = 'Delivery', status = 'Pending') => {
  try {
    const response = await instance.post(
      '/order/filter',
      {}, 
      {
        params: {
          orderType: orderType,
          status: status
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi gọi API order/filter:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    
    if (error.response?.status === 401) {
      console.warn("Phiên đăng nhập hết hạn.");
    }
    
    throw error;
  }
};

// Tạo đơn khách lẻ (dine-in)
export const createGuestOrder = async (payload) => {
  try {
    const response = await instance.post('/orders/guest', payload);
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    // Fallback cho backend dùng route singular: /order/guest
    if (status === 404) {
      try {
        const fallbackRes = await instance.post('/order/guest', payload);
        return fallbackRes.data;
      } catch (fallbackErr) {
        console.error('Lỗi tạo đơn khách lẻ (fallback /order/guest):', fallbackErr.response?.status, fallbackErr.response?.data);
        throw fallbackErr;
      }
    }
    console.error('Lỗi tạo đơn khách lẻ:', status, error.response?.data);
    throw error;
  }
};

// Lấy menu theo phiên bàn hiện tại (QR session)
// GET /api/order/session/menu?type=&categoryId=&keyword=
export const getOrderSessionMenu = async ({ type, categoryId, keyword } = {}) => {
  const params = {};

  if (type != null && String(type).trim()) {
    params.type = String(type).trim();
  }

  if (categoryId != null && Number.isFinite(Number(categoryId))) {
    params.categoryId = Number(categoryId);
  }

  if (keyword != null && String(keyword).trim()) {
    params.keyword = String(keyword).trim();
  }

  const response = await instance.get('/order/session/menu', { params });
  return response.data;
};

// Lấy đơn hiện tại của phiên bàn
// GET /api/order/session/current
export const getCurrentOrderSession = async (token) => {
  const response = await instance.get('/order/session/current', {
    headers: withOptionalBearer(token),
  });
  return response.data;
};

// Lấy chi tiết đơn theo mã đơn (fallback cho luồng guest QR khi session/current không trả item lines)
export const getOrderByCode = async (orderCode, token) => {
  const code = encodeURIComponent(String(orderCode || '').trim());
  if (!code) throw new Error('orderCode is required');
  const response = await instance.get(`/order/${code}`, {
    headers: withOptionalBearer(token),
  });
  return response.data;
};

// Lấy danh sách dòng món theo mã đơn
export const getOrderItemsByCode = async (orderCode, token) => {
  const code = encodeURIComponent(String(orderCode || '').trim());
  if (!code) throw new Error('orderCode is required');
  const response = await instance.get(`/order/${code}/items`, {
    headers: withOptionalBearer(token),
  });
  return response.data;
};

/**
 * Ước tính phí ship (nếu backend có endpoint).
 * POST /api/order/delivery-fee-estimate — body: { address }
 * Response: { deliveryFee } | { data: { deliveryFee, deliveryPrice } }
 */
function pickFeeFromPayload(payload) {
  const d = payload?.data ?? payload;
  const n = Number(
    d?.deliveryFee ??
      d?.DeliveryFee ??
      d?.deliveryPrice ??
      d?.DeliveryPrice ??
      d?.fee ??
      d?.shippingFee
  );
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Ước tính phí ship từ backend — thử vài contract route/body (BE có thể đặt tên khác).
 */
export async function getDeliveryFeeEstimateFromApi(address) {
  const a = String(address || '').trim();
  if (!a) return null;

  const attempts = [
    () => instance.post('/order/delivery-fee-estimate', { address: a }),
    () => instance.post('/order/delivery-fee-estimate', { deliveryAddress: a }),
    () => instance.post('/order/shipping-fee-estimate', { address: a }),
    () => instance.get('/order/delivery-fee-estimate', { params: { address: a } }),
    () => instance.get('/order/shipping-fee', { params: { address: a } }),
  ];

  for (const run of attempts) {
    try {
      const res = await run();
      const fee = pickFeeFromPayload(res.data);
      if (fee != null) return fee;
    } catch (e) {
      const st = e?.response?.status;
      if (st && ![404, 405].includes(st)) {
        console.warn('[order] delivery-fee estimate attempt:', st, e?.response?.data);
      }
    }
  }
  return null;
}

// Xóa / hủy đơn hàng theo mã đơn
export const deleteOrder = async (orderCode, token) => {
  const code = encodeURIComponent(String(orderCode || '').trim());
  if (!code) throw new Error('orderCode is required');
  const response = await instance.delete(`/order/delete-order/${code}`, {
    headers: withOptionalBearer(token),
  });
  return response.data;
};
