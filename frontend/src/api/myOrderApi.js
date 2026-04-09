import instance from './axiosInstance';

const firstDefined = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== '');

const toNumOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeBookEventItem = (raw) => {
  const contractId = toNumOrNull(
    firstDefined(
      raw?.contractId,
      raw?.ContractId,
      raw?.contract?.contractId,
      raw?.contract?.id,
      raw?.payment?.contractId,
      raw?.paymentInfo?.contractId
    )
  );

  const checkoutUrl = firstDefined(
    raw?.checkoutUrl,
    raw?.CheckoutUrl,
    raw?.paymentUrl,
    raw?.PaymentUrl,
    raw?.depositUrl,
    raw?.depositCheckoutUrl,
    raw?.contract?.checkoutUrl,
    raw?.contract?.paymentUrl,
    raw?.payment?.checkoutUrl,
    raw?.paymentInfo?.checkoutUrl,
    raw?.lastDeposit?.checkoutUrl
  ) || '';

  const eventTitle = firstDefined(
    raw?.eventTitle,
    raw?.title,
    raw?.event?.title,
    raw?.event?.eventTitle
  ) || '';

  const eventType = firstDefined(
    raw?.eventType,
    raw?.event?.eventType,
    raw?.event?.type
  ) || '';

  const bookingDate = firstDefined(
    raw?.bookingDate,
    raw?.eventDate,
    raw?.reservationDate
  ) || '';

  const bookingTime = firstDefined(
    raw?.bookingTime,
    raw?.eventTime,
    raw?.reservationTime
  ) || '';

  const customerId = toNumOrNull(
    firstDefined(
      raw?.customerId,
      raw?.userId,
      raw?.customer?.userId,
      raw?.customer?.customerId
    )
  );

  const eventBookingId = toNumOrNull(
    firstDefined(raw?.eventBookingId, raw?.bookEventId, raw?.id)
  );

  return {
    ...raw,
    id: eventBookingId ?? raw?.id,
    eventBookingId: eventBookingId ?? raw?.eventBookingId,
    bookEventId: eventBookingId ?? raw?.bookEventId,
    eventBookingCode: firstDefined(raw?.eventBookingCode, raw?.bookingCode, raw?.orderCode) || '',
    eventTitle,
    title: eventTitle || raw?.title || '',
    eventType,
    bookingDate,
    bookingTime,
    customerId,
    numberOfGuests: Number(raw?.numberOfGuests || raw?.guestCount || 0) || 0,
    note: firstDefined(raw?.note, raw?.specialRequests) || '',
    contractId,
    checkoutUrl,
    raw,
  };
};

// Map frontend type → backend orderType (theo Swagger pattern: ^(DineIn|TakeAway|Delivery|EventBooking)$)
const MAP_ORDER_TYPE = {
  dinein: 'DineIn',
  takeAway: 'TakeAway',
  takeaway: 'TakeAway',
  delivery: 'Delivery',
  event: 'EventBooking',
  eventBooking: 'EventBooking',
};

export const myOrderAPI = {
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

    // Filter theo orderType cụ thể
    const statusParams = statusList.filter(Boolean).map(s => `status=${s}`).join('&');
    try {
      const res = await instance.post(`/order/filter?orderType=${normalizedType}&${statusParams}`);
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
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.$values)
          ? data.$values
          : Array.isArray(data?.data)
            ? data.data
            : [];
      return list.map(normalizeBookEventItem);
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

  // POST /api/contract/{id}/deposit — tạo link thanh toán đặt cọc (PayOS)
  createContractDeposit: async (contractId) => {
    const response = await instance.post(`/contract/${contractId}/deposit`);
    return response.data;
  },

  // GET /api/contract/{bookingCode} — lấy hợp đồng theo bookingCode (fallback để tìm checkoutUrl)
  getContractByBookingCode: async (bookingCode) => {
    const response = await instance.get(`/contract/${encodeURIComponent(bookingCode)}`);
    return response.data;
  },

  // GET /api/book-event/history — lịch sử đặt sự kiện của user
  getMyEvents: async () => {
    try {
      const response = await instance.get('/book-event/history');
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.$values)
          ? data.$values
          : Array.isArray(data?.data)
            ? data.data
            : [];
      return list.map(normalizeBookEventItem);
      return [];
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 400) return [];
      throw err;
    }
  },
};
