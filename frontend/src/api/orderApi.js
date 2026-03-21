import instance from './axiosInstance';

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
