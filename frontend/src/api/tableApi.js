import instance from './axiosInstance';

// Lấy danh sách bàn từ API mới (GET /table)
export async function getTables() {
  const response = await instance.get('/table');
  // Chuẩn hóa dữ liệu trả về (nếu cần)
  return Array.isArray(response.data.data)
    ? response.data.data.map(t => ({
        id: t.tableId,
        name: t.tableName,
        type: t.tableType,
        seats: t.numberOfPeople,
        status: t.status,
        qrCode: t.qrCode,
        currentGuests: t.currentGuests,
        currentAmount: t.currentAmount,
      }))
    : [];
}
