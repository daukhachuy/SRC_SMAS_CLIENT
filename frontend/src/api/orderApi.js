import axios from 'axios';

const BASE_URL = "https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net";

export const fetchUserOrders = async (orderType = 'Delivery', status = 'Pending') => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    if (!token) {
      throw new Error("Không tìm thấy mã xác thực (token).");
    }

    // Theo đúng chuẩn Swagger cho API filter:
    // Phương thức: POST
    // Tham số truyền trên URL: orderType, status
    const response = await axios.post(
      `${BASE_URL}/api/order/filter`,
      {}, // Body trống (Một số API yêu cầu {} thay vì để null để tránh lỗi 415)
      {
        params: {
          orderType: orderType,
          status: status
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      }
    );

    // Thông thường kết quả trả về là một mảng hoặc object chứa mảng
    return response.data;
  } catch (error) {
    // Log chi tiết lỗi để dễ dàng sửa (Debug)
    console.error("Lỗi gọi API order/filter:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    
    // Nếu lỗi 401, có thể token đã hết hạn
    if (error.response?.status === 401) {
      console.warn("Phiên đăng nhập hết hạn.");
    }
    
    throw error;
  }
};