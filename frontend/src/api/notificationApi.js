import instance from './axiosInstance';

export const getUnreadNotifications = async () => {
  const res = await instance.get('/notification/unread');
  return res.data;
};

export const getAllNotifications = async () => {
  const res = await instance.get('/notification/all');
  return res.data;
};

export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) {
    throw new Error('notificationId is required');
  }

  try {
    const res = await instance.patch(`/notification/mark-as-read/${notificationId}`);
    return res.data;
  } catch (error) {
    const fallbackRes = await instance.post(`/notification/mark-as-read/${notificationId}`);
    return fallbackRes.data;
  }
};

export const getNotifications = getAllNotifications;
