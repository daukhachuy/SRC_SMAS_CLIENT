import instance from './axiosInstance';

/**
 * Swagger: GET/POST /api/table, PUT/DELETE /api/table/{id}
 * baseURL đã kết thúc bằng /api → path là /table
 */

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data?.data != null) {
    const inner = data.data;
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner?.$values)) return inner.$values;
  }
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function mapStatus(raw) {
  const t = String(raw ?? '').toLowerCase();
  if (t.includes('occupied') || t.includes('use') || t.includes('busy') || t === '1' || t === 'true')
    return 'occupied';
  if (t.includes('empty') || t.includes('available') || t.includes('free') || t === '0') return 'empty';
  return 'empty';
}

/** Chuẩn hóa một bàn cho UI (AdminTableMap / ManagerTablesPage) */
export function normalizeTableRow(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.tableId ?? raw.TableId;
  if (id == null) return null;

  const name = raw.name ?? raw.tableName ?? raw.TableName ?? `Bàn ${id}`;
  const tableCode = String(raw.tableCode ?? raw.code ?? raw.TableCode ?? id).trim();
  const maxGuests =
    Number(
      raw.numberOfPeople ??
        raw.NumberOfPeople ??
        raw.maxGuests ??
        raw.capacity ??
        raw.Capacity ??
        raw.maxCapacity ??
        4
    ) || 4;
  const tableType = String(raw.tableType ?? raw.TableType ?? raw.type ?? 'indoor').toLowerCase();
  const area = raw.area ?? raw.Area ?? raw.floor ?? raw.Floor ?? raw.zone ?? '—';
  const status = mapStatus(raw.status ?? raw.Status);
  const currentGuests = Number(raw.currentGuests ?? raw.CurrentGuests ?? raw.occupiedCount ?? 0) || 0;
  const amount =
    Number(
      raw.amount ??
        raw.currentAmount ??
        raw.CurrentAmount ??
        raw.totalAmount ??
        raw.TotalAmount ??
        0
    ) || 0;
  const note = raw.note ?? raw.Note ?? '';
  const isVip = tableType === 'vip' || !!raw.isVip;
  const isActive = raw.isActive === true || raw.IsActive === true;

  return {
    id,
    name,
    tableCode,
    area,
    tableType: tableType || 'indoor',
    maxGuests,
    capacity: maxGuests,
    currentGuests,
    status,
    amount,
    isVip,
    note,
    isActive,
    qrCode: raw.qrCode || null, // Giữ thêm trường qrCode từ main nếu cần
  };
}

/**
 * Bàn đang phục vụ: API thường trả status AVAILABLE nhưng có currentGuests / currentAmount.
 */
export function isTableRowInUse(row) {
  if (!row) return false;
  const guests = Number(row.currentGuests) || 0;
  if (guests > 0) return true;
  const amt = Number(row.amount) || 0;
  if (amt > 0) return true;
  const s = String(row.status || '').toLowerCase();
  return s === 'occupied' || s === 'in-use';
}

/**
 * GET /api/table — query tùy chọn (Swagger): tableType, status
 * @param {{ tableType?: string, status?: string }} params
 */
export async function getTables(params = {}) {
  const query = {};
  if (params.tableType != null && String(params.tableType).trim() !== '' && params.tableType !== 'all') {
    query.tableType = String(params.tableType).trim();
  }
  if (params.status != null && String(params.status).trim() !== '' && params.status !== 'all') {
    query.status = String(params.status).trim();
  }
  const { data } = await instance.get('/table', { params: query });
  const rows = unwrapList(data);
  return rows.map(normalizeTableRow).filter(Boolean);
}

function clampGuestCount(v) {
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 1) return 4;
  return Math.min(99, n);
}

function normalizeTableTypeForApi(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return 'standard';
  const lower = s.toLowerCase();
  if (lower === 'none') return 'standard';
  if (lower === 'indoor' || lower === 'trong nhà' || lower === 'trong nha' || lower === 'standard') {
    return 'standard';
  }
  if (lower === 'vip') return 'VIP';
  if (lower === 'outdoor' || lower === 'sân vườn' || lower === 'san vuon') return 'outdoor';
  return s;
}

function assertEnvelopeSuccess(data) {
  if (data == null || typeof data !== 'object') return;
  if (Object.prototype.hasOwnProperty.call(data, 'success') && data.success === false) {
    const msg =
      data.message ||
      data.Message ||
      data.error ||
      'Thao tác thất bại.';
    const err = new Error(msg);
    err.response = { data: { message: msg } };
    throw err;
  }
}

export function parseTableApiError(error, fallback = 'Lưu thất bại.') {
  const d = error?.response?.data;
  const status = error?.response?.status;
  let msg;

  if (typeof d === 'string' && d.trim()) msg = d.trim();
  else if (!d || typeof d !== 'object') msg = error?.message || fallback;
  else if (d.message && typeof d.message === 'string') msg = d.message;
  else if (d.Message && typeof d.Message === 'string') msg = d.Message;
  else if (d.detail && typeof d.detail === 'string') msg = d.detail;
  else if (d.title && d.detail) msg = `${d.title}: ${d.detail}`;
  else if (d.title) msg = d.title;
  else if (d.errors && typeof d.errors === 'object') {
    const parts = [];
    Object.entries(d.errors).forEach(([k, v]) => {
      const line = Array.isArray(v) ? v.join(' ') : String(v);
      parts.push(`${k}: ${line}`);
    });
    if (parts.length) msg = parts.join('\n');
  }
  if (!msg) msg = error?.message || fallback;

  if (status === 500 && /lỗi hệ thống/i.test(msg)) {
    msg += '\n\nGợi ý: đổi tên bàn (tránh trùng), thử loại vip hoặc standard.';
  }
  return msg;
}

function toSwaggerTableBody(form) {
  const numberOfPeople = clampGuestCount(form.maxGuests);
  const tableName = String(form.name ?? '').trim() || 'Bàn mới';
  const tableType = normalizeTableTypeForApi(form.tableType);
  return { tableName, tableType, numberOfPeople: Number(numberOfPeople) };
}

function pickTableEntityFromResponse(data) {
  let raw = data?.data !== undefined ? data.data : data;
  if (Array.isArray(raw)) raw = raw[0];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw;
}

export async function createTable(form) {
  const { data } = await instance.post('/table', toSwaggerTableBody(form));
  assertEnvelopeSuccess(data);
  const row = pickTableEntityFromResponse(data);
  return normalizeTableRow(row) || row;
}

export async function updateTable(id, form) {
  const { data } = await instance.put(`/table/${id}`, toSwaggerTableBody(form));
  assertEnvelopeSuccess(data);
  const row = pickTableEntityFromResponse(data);
  return normalizeTableRow(row) || row;
}

/**
 * PATCH /api/table/{id}/active — Toggle active status của bàn
 * @param {number|string} id
 * @param {boolean} isActive
 */
export async function toggleTableStatus(id, isActive) {
  const { data } = await instance.patch(`/table/${id}/active`, { isActive });
  assertEnvelopeSuccess(data);
  return data;
}

export async function deleteTable(id) {
  await instance.delete(`/table/${id}`);
}

/**
 * GET /api/table/availability
 * @param {string} date - Ngày format YYYY-MM-DD
 * @param {string} timeSlot - TimeSlot: "Sáng", "Trưa", "Chiều", "Tối", hoặc "Tất cả"
 */
export async function getTableAvailability(date, timeSlot = 'Tất cả') {
  const params = { date };
  if (timeSlot && timeSlot !== 'Tất cả') {
    params.timeSlot = timeSlot;
  }
  const { data } = await instance.get('/table/availability', { params });
  return data;
}