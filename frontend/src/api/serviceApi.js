import instance from './axiosInstance';

/** Chuẩn hóa body GET /api/services (Swagger: { message, data: [...] }) */
function normalizeServicesListResponse(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (body?.data != null && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return [body.data];
  }
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

/** Bearer qua axiosInstance — khớp Swagger /api/services */
export const serviceAPI = {
  /** GET /api/services — danh sách dịch vụ */
  getServices: async () => {
    const { data } = await instance.get('/services');
    return normalizeServicesListResponse(data);
  },

  /** GET /api/services?id= — lọc theo serviceId (Swagger query) */
  getServiceById: async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID dịch vụ không hợp lệ');
    }
    const { data } = await instance.get('/services', { params: { id: numId } });
    const row = data?.data != null ? data.data : data;
    return row;
  },

  /**
   * POST /api/services
   * Body: { title, servicePrice, description, unit, image, isAvailable }
   */
  create: async (payload) => {
    const { data } = await instance.post('/services', payload);
    return data;
  },

  /**
   * PUT /api/services/{id}
   * Body: { title, servicePrice, description, unit, image, isAvailable }
   */
  update: async (id, payload) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID dịch vụ không hợp lệ');
    }
    const { data } = await instance.put(`/services/${numId}`, payload);
    return data;
  },

  /** DELETE /api/services/{id} */
  delete: async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID dịch vụ không hợp lệ');
    }
    const { data } = await instance.delete(`/services/${numId}`);
    return data;
  },

  /**
   * PATCH /api/services/{id}/status?isAvailable=true|false
   * Swagger: PATCH với query param isAvailable (boolean), body rỗng
   */
  toggleStatus: async (id, isAvailable) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID dịch vụ không hợp lệ');
    }
    const { data } = await instance.patch(
      `/services/${numId}/status`,
      {},
      { params: { isAvailable: Boolean(isAvailable) } }
    );
    return data;
  },
};
