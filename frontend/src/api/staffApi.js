import instance from './axiosInstance';

/**
 * Staff Profile API
 * Backend: /api/Staff/staff-profile (theo Swagger)
 * GET  /api/Staff/staff-profile - Lấy thông tin staff đang đăng nhập
 * PUT  /api/Staff/staff-profile - Cập nhật thông tin staff đang đăng nhập
 */

export const staffApi = {
  /**
   * GET /api/Staff/staff-profile
   * Response: {
   *   fullName, avatarUrl, position, experienceLevel,
   *   phone, hireDate, gender, dob, email, address,
   *   bankAccountNumber, bankName, role, hireDateReadOnly, taxId
   * }
   */
  getProfile: () => instance.get('/Staff/staff-profile'),

  /**
   * PUT /api/Staff/staff-profile — Cập nhật thông tin cá nhân (application/json)
   * Body (Swagger): {
   *   fullname, phone, email, gender, dob (YYYY-MM-DD),
   *   address, avatarUrl, bankAccountNumber, bankName
   * }
   */
  updateProfile: (data) => instance.put('/Staff/staff-profile', data),

  /**
   * GET /api/Staff/schedule-week-kitchen-waiter?date=
   * @param {string} date - YYYY-MM-DD (bất kỳ ngày trong tuần cần xem)
   * Response: mảng { workDate, shiftName, additionalWork, note, startTime, endTime } (theo Swagger)
   */
  getScheduleWeekKitchenWaiter: (date) =>
    instance.get('/Staff/schedule-week-kitchen-waiter', { params: { date } }),

  /**
   * GET /api/Staff/staffs-list
   * Response: StaffResponseDTO[] { userId, fullname, phone, email, avatar, role, ... }
   */
  getStaffsList: () => instance.get('/Staff/staffs-list')
};

/**
 * Lịch tuần bếp / waiter — gọi trực tiếp nếu cần
 */
export async function fetchScheduleWeekKitchenWaiter(date) {
  const res = await staffApi.getScheduleWeekKitchenWaiter(date);
  return res.data;
}

/** GET /api/Staff/staff-profile — dùng cho trang hồ sơ bếp / nhân viên */
export async function fetchStaffProfile() {
  const res = await staffApi.getProfile();
  return res.data;
}
