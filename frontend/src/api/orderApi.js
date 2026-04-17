import instance from './axiosInstance';

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
export const lookupOrder = async (type, keyword) => {
  try {
    const response = await instance.post('/orders/lookup', { type, keyword });
    return response.data;
  } catch (error) {
    console.error('Lỗi tra cứu orders/lookup:', error.response?.status, error.response?.data);
    throw error;
  }
};

// GET /api/reservation/check-availability-phoneoremail?request=...
export const checkReservationAvailabilityByPhoneOrEmail = async (request) => {
  const keyword = String(request || '').trim();
  if (!keyword) return [];
  try {
    const response = await instance.get('/reservation/check-availability-phoneoremail', {
      params: { request: keyword },
    });
    return response.data;
  } catch (error) {
    console.error(
      'Lỗi tra cứu reservation/check-availability-phoneoremail:',
      error.response?.status,
      error.response?.data
    );
    throw error;
  }
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
