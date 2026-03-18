import instance from './axiosInstance';

export const discountAPI = {
  // Validate a discount code using GET /api/discount/{code}
  validateDiscount: async (code) => {
    const normalizedCode = (code || '').trim().toUpperCase();
    if (!normalizedCode) throw new Error('Vui lòng nhập mã giảm giá');

    const { data } = await instance.get(`/discount/${normalizedCode}`);
    return data;
  },

  // Get all discounts using GET /api/discount/lists
  getAllDiscounts: async () => {
    const { data } = await instance.get('/discount/lists');
    return data;
  }
};
