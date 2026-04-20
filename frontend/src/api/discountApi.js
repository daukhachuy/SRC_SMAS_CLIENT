import instance from './axiosInstance';

export const discountAPI = {
  // GET /api/discount/code/{code} (Swagger)
  validateDiscount: async (code) => {
    const normalizedCode = (code || '').trim().toUpperCase();
    if (!normalizedCode) throw new Error('Vui lòng nhập mã giảm giá');

    const { data } = await instance.get(`/discount/code/${encodeURIComponent(normalizedCode)}`);
    return data;
  },

  /**
   * POST /api/order/{orderCode}/apply-discount/{discountCode}
   * Áp mã giảm giá lên đơn đã tạo (theo Swagger).
   */
  applyDiscountToOrder: async (orderCode, discountCode) => {
    const oc = String(orderCode ?? '').trim();
    const dc = String(discountCode ?? '').trim();
    if (!oc) throw new Error('Thiếu mã đơn hàng');
    if (!dc) throw new Error('Thiếu mã giảm giá');
    const { data } = await instance.post(
      `/order/${encodeURIComponent(oc)}/apply-discount/${encodeURIComponent(dc)}`
    );
    return data;
  },

  /** GET /api/discount — không truyền id thì lấy danh sách (Swagger) */
  getAllDiscounts: async () => {
    const { data } = await instance.get('/discount');
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  },

  /** GET /api/discount?id= — chi tiết một mã (Swagger) */
  getDiscountById: async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID mã giảm giá không hợp lệ');
    }
    const { data } = await instance.get('/discount', { params: { id: numId } });
    return data?.data != null ? data.data : data;
  },

  /** POST /api/discount — tạo mã giảm giá (Swagger) */
  createDiscount: async (payload) => {
    const { data } = await instance.post('/discount', payload);
    return data;
  },

  /** PUT /api/discount/{id} — cập nhật (DiscountUpdateDto, Swagger) */
  updateDiscount: async (id, payload) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID mã giảm giá không hợp lệ');
    }
    const { data } = await instance.put(`/discount/${numId}`, payload);
    return data;
  },

  /** DELETE /api/discount/{id} (Swagger) */
  deleteDiscount: async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID mã giảm giá không hợp lệ');
    }
    const { data } = await instance.delete(`/discount/${numId}`);
    return data;
  },
};
