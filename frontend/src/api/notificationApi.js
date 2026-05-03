import instance from './axiosInstance';

/** Chuẩn hóa cột Severity: chỉ Warning | Information | Error | Success, mặc định Information */
export function normalizeNotificationSeverity(raw) {
  if (raw == null) return 'Information';
  const t = String(raw).trim().toLowerCase();
  if (!t) return 'Information';
  if (t === 'warning' || t === 'warn') return 'Warning';
  if (t === 'information' || t === 'info') return 'Information';
  if (t === 'error' || t === 'err' || t === 'fatal') return 'Error';
  if (t === 'success' || t === 'ok' || t === 'succeeded') return 'Success';
  return 'Information';
}

export const normalizeNotificationList = (payload) => {
  if (!payload) return [];

  let source = payload;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }

  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.data)) return source.data;
  if (Array.isArray(source?.data?.$values)) return source.data.$values;
  if (Array.isArray(source?.$values)) return source.$values;
  if (Array.isArray(source?.items)) return source.items;
  if (Array.isArray(source?.notifications)) return source.notifications;

  // Some backends return a single notification object instead of a list.
  if (source?.notificationId != null || source?.id != null) return [source];
  if (source?.data && (source.data.notificationId != null || source.data.id != null)) return [source.data];

  return [];
};

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

  const res = await instance.patch(`/notification/mark-as-read/${notificationId}`);
  return res.data;
};

export const getNotifications = getAllNotifications;
