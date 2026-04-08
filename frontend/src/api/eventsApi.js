import instance from './axiosInstance';

/** Chuẩn hóa body GET /api/events */
function normalizeEventsResponse(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.$values)) return body.data.$values;
  if (body?.data != null && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return [body.data];
  }
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.$values)) return body.$values;
  return [];
}

/**
 * API Sự kiện — khớp Swagger /api/events
 * EventCreateDto: title, createdBy (bắt buộc), description?, eventType?, image?, minGuests?, maxGuests?, basePrice?, isActive?
 * EventUpdateDto: title (bắt buộc), description?, eventType?, image?, minGuests?, maxGuests?, basePrice?, isActive?
 * PATCH /api/events/{id}/status — EventStatusPatchDto: { isActive }
 */
export const eventsAPI = {
  /** GET /api/events — danh sách sự kiện */
  getEvents: async () => {
    const { data } = await instance.get('/events');
    return normalizeEventsResponse(data);
  },

  /** GET /api/events/{id} — chi tiết một sự kiện */
  getEventById: async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID sự kiện không hợp lệ');
    }
    const { data } = await instance.get(`/events/${numId}`);
    return data;
  },

  /**
   * POST /api/events — tạo sự kiện mới
   * Body: { title, description, eventType, image }
   */
  create: async (payload) => {
    const { data } = await instance.post('/events', payload);
    return data;
  },

  /**
   * PUT /api/events/{id} — cập nhật sự kiện
   * Body: { title, description, eventType, image }
   */
  update: async (id, payload) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID sự kiện không hợp lệ');
    }
    const { data } = await instance.put(`/events/${numId}`, payload);
    return data;
  },

  /** DELETE /api/events/{id} */
  delete: async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID sự kiện không hợp lệ');
    }
    const { data } = await instance.delete(`/events/${numId}`);
    return data;
  },

  /**
   * PATCH /api/events/{id}/status
   * Body: EventStatusPatchDto — { isActive: boolean } (bắt buộc)
   */
  patchStatus: async (id, isActive) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID sự kiện không hợp lệ');
    }
    const { data } = await instance.patch(`/events/${numId}/status`, { isActive: Boolean(isActive) });
    return data;
  },
};
