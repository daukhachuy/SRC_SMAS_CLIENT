/**
 * Lấy danh sách nhân viên đang làm việc hôm nay
 * GET /api/Staff/working-today
 */
export async function getWorkingStaffToday() {
  try {
    const response = await instance.get('/Staff/working-today');
    // Map dữ liệu sang UI
    const staffList = Array.isArray(response.data)
      ? response.data.map(mapStaffToUI)
      : Array.isArray(response.data.data)
        ? response.data.data.map(mapStaffToUI)
        : [];
    return staffList;
  } catch (error) {
    console.error('Lỗi lấy danh sách nhân viên đang làm việc:', error);
    return [];
  }
}
import instance from './axiosInstance';

/**
 * Manager Order API
 * Base: https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api
 */

// ===== ORDERS =====
export const orderAPI = {
      // POST /api/order/filter - lấy đơn theo staffId và tableCode
      filterByStaffTable: (staffId, tableCode, orderType, status) =>
        instance.post('/order/filter', { staffId, tableCode, orderType, status }),
    // POST /api/order/filter - lấy đơn theo staffId
    filterByStaff: (staffId, orderType, status) =>
      instance.post('/order/filter', { staffId, orderType, status }),
  // GET /api/order/active - tất cả đơn đang hoạt động
  getActive: () => instance.get('/order/active'),

  // GET /api/order/active/type?orderType=DineIn|Takeaway|Delivery|Event
  getActiveByType: (orderType) =>
    instance.get('/order/active/type', { params: { orderType } }),

  // GET /api/order/history - lịch sử đơn hàng
  getHistory: () => instance.get('/order/history'),

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

  // Tiêu đề: với DineIn hiển thị số bàn, Delivery / Takeaway hiển thị tên khách
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
  dine: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  takeaway: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
  delivery: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
  event: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
};

function defaultImageByType(icon) {
  return IMAGES[icon] ?? IMAGES.dine;
}

// ===== RESERVATIONS =====
export const reservationAPI = {
  // GET /api/reservation
  getAll: () => instance.get('/reservation'),

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

  // POST /api/book-event/create
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

function pick(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') return obj[key];
  }
  return fallback;
}

function normalizeStatus(status) {
  return String(status || '').toLowerCase();
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
  const time = timeStr || (dateObj && !Number.isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--');
  const date = dateStr || (dateObj && !Number.isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('vi-VN') : '--/--/----');
  
  // Lấy date và time từ reservationDate/reservationTime hoặc createdAt
  const reservationDate = pick(item, ['reservationDate']);
  const reservationTime = pick(item, ['reservationTime']);
  const createdAt = pick(item, ['createdAt']);
  
  let date = '--/--/----';
  let time = '--:--';
  
  // Ưu tiên: reservationDate + reservationTime
  if (reservationDate) {
    const dateInfo = parseLocalDate(reservationDate);
    date = dateInfo.date;
    // Nếu có reservationTime riêng
    if (reservationTime) {
      const timeMatch = reservationTime.match(/^(\d{2}):(\d{2})/);
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2]}`;
      }
    } else {
      time = dateInfo.time;
    }
  } else if (createdAt) {
    // Fallback: dùng createdAt
    const dateInfo = parseLocalDate(createdAt);
    date = dateInfo.date;
    time = dateInfo.time;
  }

  return {
    id: reservationCode,
    reservationCode,
    customer: customerName,
    phone,
    guests,
    time,
    date,
    table,
    status: normalized.status,
    statusText: normalized.statusText,
    raw: item,
  };
}

export function mapEventToUI(item) {
  // Debug log raw item
  console.log('[mapEventToUI] Input item:', item);

  const statusRaw = normalizeStatus(pick(item, ['status', 'contractStatus', 'bookingStatus'], 'pending'));
  const statusMap = {
    signed: { status: 'signed', statusText: 'Đã ký kết' },
    confirmed: { status: 'signed', statusText: 'Đã ký kết' },
    pending: { status: 'pending', statusText: 'Chưa có hợp đồng' },
    deposit: { status: 'deposit', statusText: 'Chờ đặt cọc' },
    active: { status: 'pending', statusText: 'Đang hoạt động' },
    cancelled: { status: 'cancelled', statusText: 'Đã hủy' },
    cancel: { status: 'cancelled', statusText: 'Đã hủy' },
  };
  const normalized = statusMap[statusRaw] || { status: 'pending', statusText: 'Chưa có hợp đồng' };

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

  const guests = Number(pick(item, [
    'numberOfGuests', 'guestCount', 'guests', 'numberOfTable'
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

  // Lấy event type - ưu tiên eventId mapping, fallback sang text field
  const eventIdRaw = pick(item, ['eventId', 'eventTypeId']);
  const eventId = Number(eventIdRaw);
  
  // Thử lấy từ eventId trước
  let eventTypeName = null;
  let eventTypeColor = 'blue';
  if (eventId && EVENT_TYPE_MAP[eventId]) {
    eventTypeName = EVENT_TYPE_MAP[eventId].name;
    eventTypeColor = EVENT_TYPE_MAP[eventId].color;
  }
  
  // Fallback: thử match theo eventType text (Wedding, Conference, Birthday...)
  if (!eventTypeName) {
    const eventTypeText = pick(item, ['eventType', 'eventTypeName', 'eventName', 'type', 'category'], '');
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

  return {
    id: pick(item, ['bookEventId', 'eventId', 'id', 'bookingId']),
    eventId: pick(item, ['bookEventId', 'eventId', 'id', 'bookingId']),
    bookingCode: pick(item, ['bookingCode', 'eventCode', 'code', 'bookEventCode'], ''),
    customer: customerName,
    contact: contactName,
    phone,
    eventType: eventTypeName,
    eventTypeColor: eventTypeColor,
    guests,
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
export const staffAPI = {
  // POST /api/Staff/filter-by-position
  filterByPosition: (positions = []) =>
    instance.post('/Staff/filter-by-position', positions),

  // POST /api/Staff/next-seven-days
  getNextSevenDays: (positions = []) =>
    instance.post('/Staff/next-seven-days', positions),

  // GET /api/Staff/staff-work-today
  getStaffWorkToday: () => instance.get('/Staff/staff-work-today'),

  // GET /api/Staff/working-today
  getWorkingToday: () => instance.get('/Staff/working-today'),

  // GET /api/Staff/workshift
  getWorkshift: () => instance.get('/Staff/workshift'),

  // GET /api/Staff/sum-workshift-thismonth
  getSumWorkshiftThisMonth: () => instance.get('/Staff/sum-workshift-thismonth'),

  // GET /api/Staff/sum-timework-thismonth
  getSumTimeworkThisMonth: () => instance.get('/Staff/sum-timework-thismonth'),

  // GET /api/Staff/schedule-week-kitchen-waiter?date=yyyy-MM-dd
  getScheduleWeekKitchenWaiter: (date) =>
    instance.get('/Staff/schedule-week-kitchen-waiter', { params: { date } }),

  // POST /api/Staff
  createWorkStaff: (payload) => instance.post('/Staff', payload),

  // PUT /api/Staff/{workStaffId}
  updateWorkStaff: (workStaffId, payload) => instance.put(`/Staff/${workStaffId}`, payload),

  // DELETE /api/Staff/{workStaffId}
  deleteWorkStaff: (workStaffId) => instance.delete(`/Staff/${workStaffId}`),
};

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

export function mapStaffToUI(item) {
  // Debug: log raw item
  console.log('STAFF RAW:', item);
  const id = pick(item, ['userId', 'staffId', 'id', 'workStaffId'], null);
  const workStaffId = pick(item, ['workStaffId', 'workId', 'idWorkStaff'], null);
  const name = pick(item, ['fullName', 'fullname', 'name', 'staffName', 'userName'], `NV #${id ?? '---'}`);
  const email = pick(item, ['email', 'gmail', 'mail'], '---');
  const avatar = pick(item, ['avatar', 'avatarUrl', 'imageUrl', 'photoUrl'], `https://i.pravatar.cc/150?u=${id ?? name}`);
  // Sửa lại lấy đúng trường backend
  const phone = pick(item, ['phone', 'phoneNumber', 'mobile', 'contactPhone', 'tel'], item?.Phone ?? '---');
  const position = pick(item, ['position', 'role', 'staffRole', 'jobTitle'], item?.Position ?? 'Waiter');
  // Sửa lại lấy đúng trường ngày vào làm
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

  return {
    id,
    workStaffId,
    name,
    email,
    avatar,
    role: roleMeta.role,
    roleColor: roleMeta.roleColor,
    phone,
    joinDate,
    rating: Number.isFinite(rating) ? rating : 4.5,
    isWorking,
    location,
    startTime,
    shiftId,
    shiftName,
    workDate,
    isManager,
    raw: item,
  };
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
  // GET /api/notification
  getAll: () => instance.get('/notification'),
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
  if (typeRaw.includes('warning') || typeRaw.includes('alert') || typeRaw.includes('error')) tone = 'warning';
  if (typeRaw.includes('update') || typeRaw.includes('shift') || typeRaw.includes('schedule')) tone = 'primary';

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
