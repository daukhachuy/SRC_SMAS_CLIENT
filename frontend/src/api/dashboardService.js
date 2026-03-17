import axios from 'axios';

const API_URL = 'https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy thống kê tổng quan (Số đơn, doanh thu, bàn trống)
export const getStats = () => axios.get(`${API_URL}/Dashboard/stats`, { headers: getAuthHeader() });

// Lấy danh sách đơn hàng thực tế
export const getRecentOrders = () => axios.get(`${API_URL}/Order`, { headers: getAuthHeader() });

// Lấy trạng thái nhân viên thực tế
export const getStaffStatus = () => axios.get(`${API_URL}/User`, { headers: getAuthHeader() });

// Lấy doanh thu 7 ngày gần nhất từ API manager
export const getWeeklyRevenue = () => 
    axios.get(`${API_URL}/manager/revenue-previous-seven-days`, { headers: getAuthHeader() });