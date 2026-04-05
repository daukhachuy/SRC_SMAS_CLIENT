// Thêm món vào đơn hàng (orderCode)
export const addItemToOrder = async (orderCode, item) => {
  // item: { foodId, comboId, buffetId, quantity, note }
  const response = await instance.post(`/order/${orderCode}/items`, item);
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

// Tạo đơn khách lẻ (dine-in)
export const createGuestOrder = async (payload) => {
  try {
    const response = await instance.post('/orders/guest', payload);
    return response.data;
  } catch (error) {
    console.error('Lỗi tạo đơn khách lẻ:', error.response?.status, error.response?.data);
    throw error;
  }
};
