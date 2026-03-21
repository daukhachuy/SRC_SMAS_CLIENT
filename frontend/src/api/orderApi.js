import instance from './axiosInstance';

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
