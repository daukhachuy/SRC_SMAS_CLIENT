// Xác nhận duyệt sự kiện (review)
export const reviewBookEvent = (id, data) =>
  instance.post(`/book-event/${id}/review`, data);
// Tạo hợp đồng cho book-event
export const createBookEventContract = (id, data) =>
  instance.post(`/book-event/${id}/contract`, data);
import instance from './axiosInstance'; 
// Export lại các hàm cho các file khác import trực tiếp (đặt sau staffAPI)
export const getWorkingStaffToday = (...args) => staffAPI.getWorkingToday(...args);
export const getAllStaff = (...args) => staffAPI.getStaffsList(...args);

// ===== SCHEDULE API (QUAN TRỌNG) =====
// ...existing code...
// ...existing code...

  // ...existing code...

    // ===== SCHEDULE API (QUAN TRỌNG) =====
   export const staffAPI = {
  filterByPosition: (positions = []) =>
    instance.post('/Staff/filter-by-position', positions),

  getNextSevenDays: (positions) => {
    if (positions && Array.isArray(positions) && positions.length > 0) {
      const paramStr = positions.join(',');
      return instance.get(`/Staff/workshift/next-seven-days?positions=${encodeURIComponent(paramStr)}`);
    }
    return instance.get('/Staff/workshift/next-seven-days');
  },

  getWorkshift: () => instance.get('/Staff/workshift/all'),

  getStaffWorkToday: () => instance.get('/Staff/workshift/today'),

  getWorkingToday: () => instance.get('/Staff/working-today'),

  getStaffsToday: () => instance.get('/Staff/manager/staffs-today'),

  getSumWorkshiftThisMonth: () => instance.get('/Staff/sum-workshift-thismonth'),

  getSumTimeworkThisMonth: () => instance.get('/Staff/sum-timework-thismonth'),

  getScheduleWeekKitchenWaiter: (date) =>
    instance.get('/Staff/schedule-week-kitchen-waiter', { params: { date } }),

  getStaffsList: () => instance.get('/Staff/filter-by-position'),

  createWorkStaff: (payload) => instance.post('/Staff/workshift', payload),

  /**
   * PUT /api/Staff/{workStaffId} — cập nhật ca nhân viên (Swagger: replaceUserId int; 0 = không thay).
   * Không gửi field null/undefined để tránh lỗi deserialize phía .NET.
   */
  updateWorkStaff: (workStaffId, rawPayload = {}) => {
    const id = Number(workStaffId);
    if (!Number.isFinite(id) || id <= 0) {
      return Promise.reject(new Error('workStaffId không hợp lệ'));
    }
    const p = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
    const body = {};
    const rid = p.replaceUserId;
    if (rid != null && rid !== '' && Number(rid) > 0) {
      body.replaceUserId = Number(rid);
    } else {
      body.replaceUserId = 0;
    }
    if (p.checkInTime) body.checkInTime = p.checkInTime;
    if (p.checkOutTime) body.checkOutTime = p.checkOutTime;
    if (typeof p.isWorking === 'boolean') body.isWorking = p.isWorking;
    if (p.note != null && String(p.note).trim() !== '') body.note = String(p.note).trim();
    if (p.shiftId != null && p.shiftId !== '' && Number(p.shiftId) > 0) {
      body.shiftId = Number(p.shiftId);
    }
    if (p.workDay != null && String(p.workDay).trim() !== '') {
      body.workDay = String(p.workDay).trim().slice(0, 10);
    }
    return instance.put(`/Staff/${id}`, body);
  },

  deleteWorkStaff: (workStaffId) => {
    const id = Number(workStaffId);
    if (!Number.isFinite(id) || id <= 0) {
      return Promise.reject(new Error('workStaffId không hợp lệ'));
    }
    return instance.delete(`/Staff/${id}`);
  },

  // Lịch sử ca làm việc của nhân viên
  getStaffWorkHistory: (staffId, query = {}) => {
    const month = Number(query?.month);
    const year = Number(query?.year);
    const params = {};
    if (Number.isFinite(month) && month >= 1 && month <= 12) params.month = month;
    if (Number.isFinite(year) && year > 1900) params.year = year;
    return instance.get(`/Staff/${staffId}/work-history`, { params });
  },
};

// ===== CALL API + MAP =====
export async function getAllStaffSchedule() {
  try {
    const res = await staffAPI.getNextSevenDays([]);
    console.log('[API RAW SCHEDULE]:', res.data);

    const mapped = mapScheduleToUI(res.data);

    console.log('[MAPPED SCHEDULE]:', mapped);
    return mapped;
  } catch (error) {
    console.error('Lỗi lấy lịch nhân viên:', error);
    return [];
  }
}

// ===== OPTIONAL: GROUP THEO NGÀY =====
  export function groupScheduleByDate(list) {
    const map = {};
    list.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }

  /**
   * Manager Order API
   * Base: https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api
   */

  // ===== ORDERS =====
  export const orderAPI = {
          // API dành riêng cho Waiter lấy đơn của chính mình
          getPreparingMy: () => instance.get('/order/preparing/my'),
          getDeliveryMy: () => instance.get('/order/delivery/my'),
        // POST /api/order/filter - lấy đơn theo staffId và tableCode
        filterByStaffTable: (staffId, tableCode, orderType, status) =>
          instance.post('/order/filter', { staffId, tableCode, orderType, status }),
      // POST /api/order/filter - lấy đơn theo staffId
      filterByStaff: (staffId, orderType, status) =>
        instance.post('/order/filter', { staffId, orderType, status }),
    // GET /api/order/active - tất cả đơn đang hoạt động (cho manager)
    getActive: () => instance.get('/order/active'),

    // GET /api/order/active/type?orderType=DineIn|Takeaway|Delivery|Event
    getActiveByType: (orderType) =>
      instance.get('/order/active/type', { params: { orderType } }),

    // GET /api/order/history - lịch sử đơn hàng
    getHistory: () => instance.get('/order/history'),

    // GET /api/order/history/my/seven-days - lịch sử phục vụ 7 ngày của waiter hiện tại
    getHistoryMySevenDays: () => instance.get('/order/history/my/seven-days'),

    // GET /api/order/history/type?orderType=...
    getHistoryByType: (orderType) =>
      instance.get('/order/history/type', { params: { orderType } }),

    // POST /api/order/filter?orderType=...&status=...
    filter: (orderType, status) =>
      instance.post('/order/filter', null, { params: { orderType, status } }),

    // GET /api/order/{orderCode}
    getByCode: (orderCode) => instance.get(`/order/${orderCode}`),

    // GET /api/order/{orderCode}/items
    getItems: (orderCode) => instance.get(`/order/${orderCode}/items`),

    // GET /api/order/orders-today
    getToday: () => instance.get('/order/orders-today'),

    // GET /api/order/revenue-previous-seven-days
    getRevenueSevenDays: () => instance.get('/order/revenue-previous-seven-days'),

    // GET /api/order/four-newest-orders
    getFourNewest: () => instance.get('/order/four-newest-orders'),

    // POST /api/order/choose-staffid-delivery (fallback theo nhiều contract BE)
    // Body thường gặp: { orderCode, staffId } hoặc { orderCode, userId }
    chooseStaffDelivery: async (orderCode, staffIdOrList) => {
      const code = String(orderCode || '').trim();
      const candidateIdsRaw = Array.isArray(staffIdOrList) ? staffIdOrList : [staffIdOrList];
      const candidateIds = Array.from(
        new Set(
          candidateIdsRaw
            .map((x) => Number(x))
            .filter((x) => Number.isFinite(x) && x > 0)
        )
      );

      if (!code) throw new Error('Thiếu mã đơn hàng.');
      if (candidateIds.length === 0) throw new Error('Thiếu mã nhân viên giao hàng hợp lệ.');

      let lastError = null;

      for (const sid of candidateIds) {
        const attempts = [
          () => instance.post('/order/choose-staffid-delivery', { orderCode: code, staffId: sid }),
          () => instance.post('/order/choose-staffid-delivery', { orderCode: code, userId: sid }),
          () => instance.post('/order/choose-staff-delivery', { orderCode: code, staffId: sid }),
          () => instance.post('/order/choose-staff-delivery', { orderCode: code, userId: sid }),
        ];

        for (const call of attempts) {
          try {
            return await call();
          } catch (err) {
            lastError = err;
            const status = Number(err?.response?.status || 0);
            // Thử contract kế tiếp nếu lỗi validate/route method.
            if ([400, 404, 405, 422].includes(status)) continue;
            throw err;
          }
        }
      }

      throw lastError || new Error('Không thể chọn nhân viên giao hàng.');
    },

    // PATCH /api/order/change-status/{OrderCode}
    changeStatus: (orderCode) =>
      instance.patch(`/order/change-status/${encodeURIComponent(orderCode)}`),

    // POST /api/order/delete-orderdelivery/{OrderCode}
    deleteOrderDelivery: (orderCode, payload) =>
      instance.post(`/order/delete-orderdelivery/${encodeURIComponent(orderCode)}`, payload ?? {}),
  };

  // ===== HELPERS: MAP API → UI =====
  // orderType từ API: 'DineIn' | 'Takeaway' | 'Delivery' | 'Event'
  // icon dùng trong component:  dine | takeaway | delivery | event

  export function mapOrderTypeToIcon(orderType) {
    const map = {
      DineIn: 'dine',
      Takeaway: 'takeaway',
      Delivery: 'delivery',
      Event: 'event',
    };
    return map[orderType] ?? 'dine';
  }

  export function mapOrderTypeLabel(orderType) {
    const map = {
      DineIn: 'Ăn tại chỗ',
      Takeaway: 'Mang về',
      Delivery: 'Vận chuyển',
      Event: 'Sự kiện',
    };
    return map[orderType] ?? orderType;
  }

  // status từ API → { label, cssClass }
  export function mapStatus(status) {
    const map = {
      Pending:    { label: 'Chờ xác nhận', css: 'pending' },
      Confirmed:  { label: 'Đã xác nhận',  css: 'confirmed' },
      Processing: { label: 'Đang chuẩn bị', css: 'preparing' },
      Preparing:  { label: 'Đang chuẩn bị', css: 'preparing' },
      Ready:      { label: 'Sẵn sàng',      css: 'ready' },
      Delivering: { label: 'Đang giao',     css: 'shipping' },
      Completed:  { label: 'Hoàn thành',    css: 'done' },
      Cancelled:  { label: 'Đã hủy',        css: 'cancelled' },
    };
    return map[status] ?? { label: status, css: 'pending' };
  }

  export function formatCurrency(amount) {
    if (amount == null) return '0đ';
    return amount.toLocaleString('vi-VN') + 'đ';
  }

  // Chuyển 1 order từ API sang shape UI
  export function mapOrderToUI(order) {
    const icon = mapOrderTypeToIcon(order.orderType);
    const { label: statusLabel, css: statusClass } = mapStatus(order.status);
    const itemCount = order.items?.length ?? order.orderItems?.length ?? order.totalItems ?? 0;

    // Tiêu đề: với DineIn hiển thị số bàn, Delivery / Takeaway hiể                                                                     n thị tên khách
    let title = order.tableName ?? order.customerName ?? order.guestName ?? `Đơn #${order.orderId}`;

    return {
      id: order.orderId ?? order.id,
      code: order.orderCode ?? `#${String(order.orderId ?? order.id).padStart(3, '0')}`,
      mode: mapOrderTypeLabel(order.orderType),
      icon,
      title,
      status: statusLabel,
      statusClass,
      items: `${itemCount} món ăn`,
      amount: formatCurrency(order.totalAmount ?? order.total),
      image: order.imageUrl ?? order.thumbnail ?? defaultImageByType(icon),
      // giữ nguyên raw để dùng trong modal
      raw: order,
    };
  }

  const IMAGES = {
    // Ảnh fallback theo loại đơn khi backend chưa trả imageUrl/thumbnail.
    dine: 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&w=800&q=80', // Ăn tại chỗ
    takeaway: 'https://images.pexels.com/photos/5638331/pexels-photo-5638331.jpeg?auto=compress&w=800&q=80', // Mang về
    delivery: 'https://res.cloudinary.com/dmzuier4p/image/upload/v1776440756/hinh-anh-shipper-61_hncew9.jpg', // Vận chuyển (theo ảnh user cung cấp)
    event: 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&w=800&q=80', // Sự kiện
  };

  function defaultImageByType(icon) {
    return IMAGES[icon] ?? IMAGES.dine;
  }

  // ===== RESERVATIONS =====
  export const reservationAPI = {
    // GET /api/reservation
    getAll: () => instance.get('/reservation'),

    // GET /api/reservation/{code} - lấy chi tiết đặt chỗ theo mã
    getByCode: (code) => instance.get(`/reservation/${code}`),

    // GET /api/reservation/desc-created-at
    getAllDescCreatedAt: () => instance.get('/reservation/desc-created-at'),

    // GET /api/reservation/sum-today
    getSumToday: () => instance.get('/reservation/sum-today'),

    // GET /api/reservation/wait-confirm
    getWaitingConfirm: () => instance.get('/reservation/wait-confirm'),

    // PATCH /api/reservation/{reservationCode}/confirm
    confirm: (reservationCode) => instance.patch(`/reservation/${reservationCode}/confirm`),

    // DELETE /api/reservation/{reservationCode}
    cancel: (reservationCode, cancellationReason) =>
      instance.delete(`/reservation/${reservationCode}`, {
        data: { cancellationReason }
      }),
  };

  // ===== SERVICES (dịch vụ sự kiện) =====
  export const serviceAPI = {
    // GET /api/services - danh sách dịch vụ (Bearer token nếu backend yêu cầu)
    getServices: () => instance.get('/services'),
  };

  // ===== EVENT TYPES (đồng bộ với /api/events) =====

  // Mapping eventId -> tên hiển thị (theo /api/events response)
  const EVENT_TYPE_MAP = {
    1: { name: 'Tiệc Cưới', color: 'rose', apiType: 'Wedding' },
    2: { name: 'Hội Nghị - Hội Thảo', color: 'blue', apiType: 'Conference' },
    3: { name: 'Sinh Nhật', color: 'amber', apiType: 'Birthday' },
    4: { name: 'Tiệc Công Ty', color: 'purple', apiType: 'Corporate' },
    5: { name: 'Liên Hoan Gia Đình', color: 'green', apiType: 'Family' },
  };

  // Helper: lấy tên sự kiện từ eventId
  export const getEventTypeName = (eventId) => {
    const id = Number(eventId);
    return EVENT_TYPE_MAP[id]?.name || 'Sự kiện';
  };

  // Helper: lấy màu từ eventId
  export const getEventColorKey = (eventId) => {
    const id = Number(eventId);
    return EVENT_TYPE_MAP[id]?.color || 'blue';
  };

  // Helper: lấy api eventType từ eventId
  export const getEventApiType = (eventId) => {
    const id = Number(eventId);
    return EVENT_TYPE_MAP[id]?.apiType || null;
  };

  // Danh sách event types cho dropdown (Services.js)
  export const EVENT_TYPES_LIST = [
    { id: 1, name: 'Tiệc Cưới', eventType: 'Wedding' },
    { id: 2, name: 'Hội Nghị - Hội Thảo', eventType: 'Conference' },
    { id: 3, name: 'Sinh Nhật', eventType: 'Birthday' },
    { id: 4, name: 'Tiệc Công Ty', eventType: 'Corporate' },
    { id: 5, name: 'Liên Hoan Gia Đình', eventType: 'Family' },
  ];

  export const eventBookingAPI = {
    // GET /api/book-event/get-bookevent
    getBookEvent: () => instance.get('/book-event/get-bookevent')
      .then(res => {
        console.log('[eventBookingAPI] getBookEvent response:', res.status, res.data);
        return res;
      }),

    // GET /api/book-event/active
    getActive: () => instance.get('/book-event/active')
      .then(res => {
        console.log('[eventBookingAPI] getActive response:', res.status, res.data);
        return res;
      }),

    // GET /api/book-event/asc-created-at
    getAllAscCreatedAt: () => instance.get('/book-event/asc-created-at')
      .then(res => {
        console.log('[eventBookingAPI] getAllAscCreatedAt response:', res.status, res.data);
        return res;
      }),

    // GET /api/book-event/history
    getHistory: () => instance.get('/book-event/history')
      .then(res => {
        console.log('[eventBookingAPI] getHistory response:', res.status, res.data);
        return res;
      }),

    // GET /api/book-event/{id}/detail
    getDetailById: (bookEventId) => instance.get(`/book-event/${bookEventId}/detail`)
      .then(res => {
        console.log('[eventBookingAPI] getDetailById response:', res.status, res.data);
        return res;
      }),

    // POST /api/book-event/{id}/check-in
    checkIn: (bookEventId, payload) => instance.post(`/book-event/${bookEventId}/check-in`, payload)
      .then(res => {
        console.log('[eventBookingAPI] checkIn response:', res.status, res.data);
        return res;
      }),

    // POST /api/book-event/{id}/check-out
    checkOut: (bookEventId) => instance.post(`/book-event/${bookEventId}/check-out`)
      .then(res => {
        console.log('[eventBookingAPI] checkOut response:', res.status, res.data);
        return res;
      }),

    // GET /api/book-event/in-progress
    getInProgress: () => instance.get('/book-event/in-progress')
      .then(res => {
        console.log('[eventBookingAPI] getInProgress response:', res.status, res.data);
        return res;
      }),

    // GET /api/book-event/awaiting-final-payment
    getAwaitingFinalPayment: () => instance.get('/book-event/awaiting-final-payment')
      .then(res => {
        console.log('[eventBookingAPI] getAwaitingFinalPayment response:', res.status, res.data);
        return res;
      }),

    // GET /api/events/upcoming-events
    getUpcomingEvents: () => instance.get('/events/upcoming-events')
      .then(res => {
        console.log('[eventBookingAPI] getUpcomingEvents response:', res.status, res.data);
        return res;
      }),

    // GET /api/contract/number-need-signed
    getContractsNeedSigned: () => instance.get('/contract/number-need-signed')
      .then(res => {
        console.log('[eventBookingAPI] getContractsNeedSigned response:', res.status, res.data);
        return res;
      }),

    // POST /api/book-event/create — body phẳng theo Swagger; numberOfGuests (API) = số bàn.
    create: (data) => instance.post('/book-event/create', data)
      .then(res => {
        console.log('[eventBookingAPI.create] ✅ Success:', res.status, res.data);
        return res;
      })
      .catch(err => {
        console.error('[eventBookingAPI.create] ❌ Error:', err?.response?.status, err?.response?.data);
        return Promise.reject(err);
      }),
  };

  export const contractAPI = {
    // GET /api/contract/{bookingCode}
    getByBookingCode: (bookingCode) => instance.get(`/contract/${encodeURIComponent(bookingCode)}`)
      .then(res => {
        console.log('[contractAPI] getByBookingCode response:', res.status, res.data);
        return res;
      }),

    // POST /api/contract/{id}/send-sign
    sendSign: (contractId) => instance.post(`/contract/${contractId}/send-sign`)
      .then(res => {
        console.log('[contractAPI] sendSign response:', res.status, res.data);
        return res;
      }),

    // POST /api/contract/{id}/deposit
    sendDepositRequest: (contractId) => instance.post(`/contract/${contractId}/deposit`)
      .then(res => {
        console.log('[contractAPI] sendDepositRequest response:', res.status, res.data);
        return res;
      }),

    // GET /api/contract/{contractId}/payments
    getPaymentsByContractId: (contractId) => instance.get(`/contract/${contractId}/payments`)
      .then(res => {
        console.log('[contractAPI] getPaymentsByContractId response:', res.status, res.data);
        return res;
      }),

    // GET /api/contract/by-code/{contractCode}/payments
    getPaymentsByCode: (contractCode) => instance.get(`/contract/by-code/${encodeURIComponent(contractCode)}/payments`)
      .then(res => {
        console.log('[contractAPI] getPaymentsByCode response:', res.status, res.data);
        return res;
      }),

    // POST /api/contract/by-code/{contractCode}/final-payment/confirm
    confirmFinalPaymentByCode: (contractCode, payload = {}) =>
      instance.post(`/contract/by-code/${encodeURIComponent(contractCode)}/final-payment/confirm`, payload)
        .then(res => {
          console.log('[contractAPI] confirmFinalPaymentByCode response:', res.status, res.data);
          return res;
        }),
  };

  export const contractTokenAPI = {
    // GET /api/contract/sign?token=...
    getBySignToken: (token) => instance.get('/contract/sign', { params: { token } })
      .then(res => {
        console.log('[contractTokenAPI] getBySignToken response:', res.status, res.data);
        return res;
      }),

    // POST /api/contract/sign
    // Body: { token: string }
    confirmSignByToken: (token) => instance.post('/contract/sign', { token })
      .then(res => {
        console.log('[contractTokenAPI] confirmSignByToken response:', res.status, res.data);
        return res;
      }),
  };

  function pick(obj, keys, fallback = null) {
    for (const key of keys) {
      const val = obj?.[key];
      if (val !== undefined && val !== null && val !== '') {
        // Nếu là object, thử lấy fullname, name, email, phone, userId, hoặc stringify
        if (typeof val === 'object') {
          if (val.fullname) return val.fullname;
          if (val.name) return val.name;
          if (val.email) return val.email;
          if (val.phone) return val.phone;
          if (val.userId) return val.userId.toString();
          // fallback stringify
          return JSON.stringify(val);
        }
        return val;
      }
    }
    return fallback;
  }

  function normalizeStatus(status) {
    return String(status || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }

  /**
   * Format date string (ISO) thành dd/MM/yyyy và HH:mm
   * Xử lý đúng timezone local (UTC+7 cho Việt Nam)
   */
  function parseLocalDate(dateStr) {
    if (!dateStr) return { date: '--/--/----', time: '--:--' };
    
    // Nếu là date-only (yyyy-MM-dd) thì không cần timezone adjustment
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return {
        date: `${day}/${month}/${year}`,
        time: '--:--'
      };
    }
    
    // Nếu là datetime, parse trực tiếp với constructor có timezone
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      const localDate = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      return {
        date: localDate.toLocaleDateString('vi-VN'),
        time: localDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }
    
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      return {
        date: dateObj.toLocaleDateString('vi-VN'),
        time: dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }
    
    return { date: '--/--/----', time: '--:--' };
  }

  export function mapReservationToUI(item) {
    const statusRaw = normalizeStatus(pick(item, ['status', 'reservationStatus'], 'pending'));
    const statusMap = {
      pending: { status: 'pending', statusText: 'Chờ xác nhận' },
      waitconfirm: { status: 'pending', statusText: 'Chờ xác nhận' },
      // Khi khách đã được xếp chỗ (Seated), giữ trạng thái riêng để UI lọc độc lập.
      seated: { status: 'seated', statusText: 'Đã nhận bàn' },
      confirmed: { status: 'confirmed', statusText: 'Đã xác nhận' },
      dining: { status: 'dining', statusText: 'Đang dùng bữa' },
      active: { status: 'dining', statusText: 'Đang dùng bữa' },
      cancelled: { status: 'cancelled', statusText: 'Đã hủy' },
      canceled: { status: 'cancelled', statusText: 'Đã hủy' },
    };
    const normalized = statusMap[statusRaw] || { status: 'pending', statusText: pick(item, ['status'], 'Chờ xác nhận') };

    const reservationCode = pick(item, ['reservationCode', 'code', 'bookingCode'], `BK-${pick(item, ['id', 'reservationId'], '')}`);
    const customerName = pick(item, ['customerName', 'fullname', 'name', 'guestName'], 'Khách hàng');
    const phone = pick(item, ['phone', 'phoneNumber', 'customerPhone'], '---');
    const guests = Number(pick(item, ['numberOfGuests', 'guestCount', 'guests'], 0));
    const table = pick(item, ['tableCode', 'tableName', 'table'], '');
    // Sửa mapping thời gian đặt bàn
    const dateStr = item.reservationDate || item.bookingDate || pick(item, ['reservationDate', 'bookingDate', 'createdAt', 'date'], '');
    const timeStr = item.reservationTime || item.bookingTime || pick(item, ['reservationTime', 'bookingTime', 'time'], '');
    let dateObj = null;
    if (dateStr && timeStr) {
      dateObj = new Date(`${dateStr}T${timeStr}`);
    } else if (dateStr) {
      dateObj = new Date(dateStr);
    }
      let timeVal = timeStr || (dateObj && !Number.isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--');
      let dateVal = dateStr || (dateObj && !Number.isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('vi-VN') : '--/--/----');
    
    // Lấy date và time từ reservationDate/reservationTime hoặc createdAt
    const reservationDate = pick(item, ['reservationDate']);
    const reservationTime = pick(item, ['reservationTime']);
    const createdAt = pick(item, ['createdAt']);
    
      // let date = '--/--/----'; // Removed to avoid redeclaration
      // let time = '--:--'; // Removed to avoid redeclaration
    
    // Ưu tiên: reservationDate + reservationTime
    if (reservationDate) {
      const dateInfo = parseLocalDate(reservationDate);
        dateVal = dateInfo.date;
      // Nếu có reservationTime riêng
      if (reservationTime) {
        const timeMatch = reservationTime.match(/^(\d{2}):(\d{2})/);
        if (timeMatch) {
            timeVal = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      } else {
          timeVal = dateInfo.time;
      }
    } else if (createdAt) {
      // Fallback: dùng createdAt
      const dateInfo = parseLocalDate(createdAt);
        dateVal = dateInfo.date;
        timeVal = dateInfo.time;
    }

    return {
      id: reservationCode,
      reservationCode,
      customer: customerName,
      phone,
      guests,
        time: timeVal,
        date: dateVal,
      table,
      status: normalized.status,
      statusText: normalized.statusText,
      raw: item,
    };
  }

  export function mapEventToUI(item) {
    // Debug log raw item
    console.log('[mapEventToUI] Input item:', item);

  const statusSource = {
    bookEventStatus: pick(item, ['bookEventStatus', 'eventStatus', 'status', 'bookingStatus'], ''),
    contractStatus: pick(item, ['contractStatus'], item?.contract?.status || ''),
  };
  // Ưu tiên trạng thái vận hành BookEvent trước, fallback sang trạng thái Contract.
  const statusRaw = normalizeStatus(pick(statusSource, ['bookEventStatus', 'contractStatus'], 'pending'));
    const statusMap = {
      // BookEvent statuses
      pending: { status: 'nosigned', statusText: 'Chờ duyệt' },
      approved: { status: 'unsigned', statusText: 'Đã duyệt' },
      rejected: { status: 'rejected', statusText: 'Từ chối' },
      active: { status: 'signed', statusText: 'Đang diễn ra' },
    inprogress: { status: 'signed', statusText: 'Đang diễn ra' },
    awaitingfinalpayment: { status: 'awaitingfinalpayment', statusText: 'Chờ tất toán' },
      cancelled: { status: 'cancelled', statusText: 'Đã hủy' },
      canceled: { status: 'cancelled', statusText: 'Đã hủy' },
      cancel: { status: 'cancelled', statusText: 'Đã hủy' },
      completed: { status: 'completed', statusText: 'Đã hoàn thành' },

      // Contract statuses
      draft: { status: 'nosigned', statusText: 'Nháp' },
      sent: { status: 'unsigned', statusText: 'Đã gửi ký / Chờ khách ký' },
      signed: { status: 'signed', statusText: 'Đã ký' },
      deposited: { status: 'deposit', statusText: 'Đã đặt cọc' },
      deposit: { status: 'deposit', statusText: 'Đã đặt cọc' },
    };
  const normalized = statusMap[statusRaw] || { status: 'nosigned', statusText: 'Chưa có hợp đồng' };

    // Lấy thông tin khách hàng - thử nhiều field
    const customerName = pick(item, [
      'customerName', 'fullName', 'fullname', 'name', 'guestName',
      'customer', 'contactName', 'representativeName', 'userName'
    ], 'Khách hàng sự kiện');

    const contactName = pick(item, [
      'contactName', 'representativeName', 'contact', 'fullName', 'fullname', 'name'
    ], customerName === 'Khách hàng sự kiện' ? 'Liên hệ' : customerName);

    const phone = pick(item, [
      'phone', 'phoneNumber', 'customerPhone', 'contactPhone', 'telephone'
    ], '---');

    const tableCount = Number(pick(item, [
      'numberOfTables', 'tableCount', 'tables',
      'numberOfGuests',
      'numberOfTable',
    ], 0));

    // Lấy ngày giờ từ nhiều field - ưu tiên reservationDate + reservationTime
    const reservationDate = pick(item, ['reservationDate', 'bookingDate', 'eventDate']);
    const reservationTime = pick(item, ['reservationTime', 'eventTime']);
    const createdAt = pick(item, ['createdAt']);
    
    let date = '--/--/----';
    let time = '--:--';
    
    if (reservationDate) {
      const dateInfo = parseLocalDate(reservationDate);
      date = dateInfo.date;
      if (reservationTime) {
        const timeMatch = reservationTime.match(/^(\d{2}):(\d{2})/);
        if (timeMatch) {
          time = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      } else {
        time = dateInfo.time;
      }
    } else if (createdAt) {
      const dateInfo = parseLocalDate(createdAt);
      date = dateInfo.date;
      time = dateInfo.time;
    }

    // Lấy loại sự kiện - ưu tiên eventTitle từ API book-event
    const eventIdRaw = pick(item, ['bookEventId', 'eventId', 'EventId', 'eventTypeId', 'EventTypeId']);
    const eventId = Number(eventIdRaw);

    const eventTitleRaw = item?.eventTitle
      ?? item?.EventTitle
      ?? item?.eventName
      ?? item?.EventName
      ?? item?.title
      ?? item?.Title
      ?? item?.event?.title
      ?? item?.event?.name
      ?? null;
    let eventTypeName = typeof eventTitleRaw === 'string' ? eventTitleRaw.trim() : null;
    let eventTypeColor = 'blue';

    // Fallback màu theo eventId, đồng thời chỉ set tên theo map nếu chưa có eventTitle
    if (eventId && EVENT_TYPE_MAP[eventId]) {
      eventTypeColor = EVENT_TYPE_MAP[eventId].color;
      if (!eventTypeName) {
        eventTypeName = EVENT_TYPE_MAP[eventId].name;
      }
    }
    
    // Fallback: thử match theo eventType text (Wedding, Conference, Birthday...)
    if (!eventTypeName) {
      const eventTypeText = pick(item, ['eventType', 'EventType', 'eventTypeName', 'EventTypeName', 'eventName', 'type', 'category'], '');
      // Map API eventType (Wedding, Conference...) sang tiếng Việt
      const typeTextMap = {
        'Wedding': 'Tiệc Cưới',
        'Conference': 'Hội Nghị - Hội Thảo',
        'Birthday': 'Sinh Nhật',
        'Corporate': 'Tiệc Công Ty',
        'Family': 'Liên Hoan Gia Đình',
      };
      const typeColorMap = {
        'Wedding': 'rose',
        'Conference': 'blue',
        'Birthday': 'amber',
        'Corporate': 'purple',
        'Family': 'green',
      };
      eventTypeName = typeTextMap[eventTypeText] || eventTypeText || 'Sự kiện';
      eventTypeColor = typeColorMap[eventTypeText] || 'blue';
    }

    const bookEventId = pick(item, ['bookEventId', 'bookingId', 'id', 'eventId']);

    return {
      id: bookEventId,
      bookEventId,
      eventId,
      bookingCode: pick(item, ['bookingCode', 'eventCode', 'code', 'bookEventCode'], ''),
      customer: customerName,
      contact: contactName,
      phone,
      eventType: eventTypeName,
      eventTypeColor: eventTypeColor,
      tableCount,
      guests: tableCount,
      date,
      time,
      status: normalized.status,
      statusText: normalized.statusText,
      revenue: Number(pick(item, ['estimatedRevenue', 'totalAmount', 'budget', 'total'], 0)),
      urgent: false,
      raw: item,
    };
  }

  // ===== STAFF / SHIFT MANAGEMENT =====
  export const SHIFT_ENUM = Object.freeze({
    MORNING: 'morning',
    AFTERNOON: 'afternoon',
    EVENING: 'evening',
  });



  function normalizeRole(position) {
    const role = String(position || '').toLowerCase();
    if (role.includes('manager') || role.includes('quản lý') || role.includes('quan ly')) {
      return { role: 'Quản lý', roleColor: 'blue' };
    }
    if (role.includes('kitchen') || role.includes('bếp') || role.includes('chef')) {
      return { role: 'Đầu bếp', roleColor: 'orange' };
    }
    if (role.includes('cash') || role.includes('thu ngân')) {
      return { role: 'Thu ngân', roleColor: 'emerald' };
    }
    return { role: 'Phục vụ', roleColor: 'blue' };
  }


  // Utility: flatten only primitive fields for safe rendering
  function flattenStaffForUI(staffObj) {
    if (!staffObj || typeof staffObj !== 'object') return {};
    const allowed = [
      'id', 'workStaffId', 'name', 'email', 'avatar', 'role', 'roleColor', 'phone',
      'joinDate', 'rating', 'isWorking', 'location', 'startTime', 'shiftId', 'shiftName', 'workDate', 'isManager', 'active', 'position', 'positionLabel', 'address', 'salary', 'taxId', 'bankName', 'bankAccount', 'startDate', 'created', 'customerId', 'ordersPlaced', 'ordersCanceled', 'noShow', 'totalSpending', 'lastUpdated', 'isVip'
    ];
    const flat = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(staffObj, key) && (typeof staffObj[key] !== 'object' || staffObj[key] === null)) {
        flat[key] = staffObj[key];
      }
    }
    return flat;
  }

  export function mapStaffToUI(item) {
    if (!item || typeof item !== 'object') return {};
    const id = pick(item, ['userId', 'staffId', 'id', 'workStaffId'], null);
    const workStaffId = pick(item, ['workStaffId', 'workId', 'idWorkStaff'], null);
    const name = pick(item, ['fullName', 'fullname', 'name', 'staffName', 'userName'], `NV #${id ?? '---'}`);
    const email = pick(item, ['email', 'gmail', 'mail'], '---');
    let avatar = pick(item, ['avatar', 'avatarUrl', 'imageUrl', 'photoUrl'], `https://i.pravatar.cc/150?u=${id ?? name}`);
    if (avatar && typeof avatar === 'string' && avatar.startsWith('/')) {
      const apiDomain = process.env.REACT_APP_API_URL || 'https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net';
      avatar = apiDomain.replace(/\/api\/?$/, '') + avatar;
    }
    const phone = pick(item, ['phone', 'phoneNumber', 'mobile', 'contactPhone', 'tel'], item?.Phone ?? '---') || '';
    const position = pick(item, ['position', 'role', 'staffRole', 'jobTitle'], item?.Position ?? 'Waiter');
    const joinDateRaw = pick(item, ['joinDate', 'startDate', 'createdAt', 'hireDate', 'dateJoined'], item?.JoinDate ?? null);
    const joinDateObj = joinDateRaw ? new Date(joinDateRaw) : null;
    const joinDate = joinDateObj && !Number.isNaN(joinDateObj.getTime())
      ? joinDateObj.toLocaleDateString('vi-VN')
      : (typeof joinDateRaw === 'string' ? joinDateRaw : '--/--/----');
    const rating = Number(pick(item, ['rating', 'avgRating', 'averageRating'], 4.5));
    const isWorking = Boolean(pick(item, ['isWorking', 'working'], false));
    const location = pick(item, ['workArea', 'location', 'station', 'tableArea'], 'Khu vực phục vụ');
    const startTimeRaw = pick(item, ['checkInTime', 'startTime', 'workStart'], null);
    const startObj = startTimeRaw ? new Date(startTimeRaw) : null;
    const startTime = startObj && !Number.isNaN(startObj.getTime())
      ? startObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    const shiftId = pick(item, ['shiftId'], null);
    const shiftName = pick(item, ['shiftName'], null);
    const workDate = pick(item, ['workDate', 'workDay', 'date'], null);

    const roleMeta = normalizeRole(position);
    const isManager = roleMeta.role === 'Quản lý';

    // Compose the staff object
    const staffObj = {
      id,
      workStaffId,
      name,
      email,
      avatar,
      role: roleMeta.role,
      roleColor: roleMeta.roleColor,
      phone: typeof phone === 'string' ? phone : '',
      joinDate,
      rating: Number.isFinite(rating) ? rating : 4.5,
      isWorking,
      location,
      startTime,
      shiftId,
      shiftName,
      workDate,
      isManager,
      // Add common admin fields for compatibility
      position,
      positionLabel: item.positionLabel,
      address: item.address,
      salary: item.salary,
      taxId: item.taxId,
      bankName: item.bankName,
      bankAccount: item.bankAccount,
      startDate: item.startDate,
      created: item.created,
      customerId: item.customerId,
      ordersPlaced: item.ordersPlaced,
      ordersCanceled: item.ordersCanceled,
      noShow: item.noShow,
      totalSpending: item.totalSpending,
      lastUpdated: item.lastUpdated,
      isVip: item.isVip,
      active: item.active,
    };
    return flattenStaffForUI(staffObj);
  }

  export function mapWorkshiftToUI(item) {
    return {
      id: pick(item, ['shiftId', 'id'], null),
      name: pick(item, ['shiftName', 'name'], 'Ca làm'),
      startTime: pick(item, ['startTime'], null),
      endTime: pick(item, ['endTime'], null),
      raw: item,
    };
  }

  // ===== NOTIFICATIONS =====
  export const notificationAPI = {
    // GET /api/notification/all
    getAll: () => instance.get('/notification/all'),

    // GET /api/notification/unread
    getUnread: () => instance.get('/notification/unread'),

    // PATCH /api/notification/mark-as-read/{notificationId}
    markAsRead: (notificationId) => {
      if (!notificationId) throw new Error('notificationId is required');
      return instance.patch(`/notification/mark-as-read/${notificationId}`);
    },

    /**
     * POST /api/notification/change-workshift
     * Body: { senderId: number, title: string, content: string }
     */
    changeWorkShift: (body) => instance.post('/notification/change-workshift', body),
  };

  // ===== SALARY RECORD =====
  export const salaryRecordAPI = {
    // GET /api/SalaryRecord/last-six-months
    getLastSixMonths: () => instance.get('/SalaryRecord/last-six-months'),

    // GET /api/SalaryRecord/current-month-detail
    getCurrentMonthDetail: () => instance.get('/SalaryRecord/current-month-detail'),
  };

  export function mapNotificationToUI(item, idx = 0) {
    const title = pick(item, ['title', 'name', 'type', 'notificationType'], 'Thông báo hệ thống');
    const message = pick(item, ['message', 'content', 'description', 'detail'], 'Bạn có thông báo mới.');
    const createdAt = pick(item, ['createdAt', 'time', 'notificationTime', 'date'], null);
    const isRead = Boolean(pick(item, ['isRead', 'read'], false));
    const typeRaw = String(pick(item, ['type', 'category', 'notificationType'], 'info')).toLowerCase();

    let tone = 'info';
    if (typeRaw.includes('success') || typeRaw.includes('approved') || typeRaw.includes('approve')) tone = 'success';
    else if (typeRaw.includes('warning') || typeRaw.includes('alert') || typeRaw.includes('error')) tone = 'warning';
    else if (typeRaw.includes('update') || typeRaw.includes('shift') || typeRaw.includes('schedule')) tone = 'primary';

    const dateObj = createdAt ? new Date(createdAt) : null;
    const timeText = dateObj && !Number.isNaN(dateObj.getTime())
      ? dateObj.toLocaleString('vi-VN')
      : 'Vừa xong';

    return {
      id: pick(item, ['id', 'notificationId'], idx + 1),
      title,
      message,
      time: timeText,
      isRead,
      tone,
      raw: item,
    };
  }
