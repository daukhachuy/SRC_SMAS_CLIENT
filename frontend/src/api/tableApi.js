import instance from './axiosInstance';

// Lấy danh sách bàn thật từ backend
export async function getTables() {
  const response = await instance.get('/api/tables');
  return response.data;
}
