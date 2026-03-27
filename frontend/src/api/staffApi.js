import instance from './axiosInstance';

export const staffApi = {
  getProfile: () => instance.get('/Staff/staff-profile'),
  updateProfile: (data) => instance.put('/Staff/staff-profile', data),
  getScheduleWeekKitchenWaiter: (date) => instance.get('/Staff/schedule-week-kitchen-waiter', { params: { date } }),
  getStaffsList: () => instance.get('/Staff/staffs-list'),
};

// Export lại các hàm cho các file khác import trực tiếp (đặt sau staffApi)
export const fetchStaffProfile = staffApi.getProfile;
export const fetchScheduleWeekKitchenWaiter = staffApi.getScheduleWeekKitchenWaiter;
