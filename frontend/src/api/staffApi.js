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
   * PUT /api/Staff/staff-profile
   * Body: {
   *   fullname, phone, email, gender, dob,
   *   address, avatarUrl, bankAccountNumber, bankName
   * }
   */
  updateProfile: (data) => instance.put('/Staff/staff-profile', data)
};
