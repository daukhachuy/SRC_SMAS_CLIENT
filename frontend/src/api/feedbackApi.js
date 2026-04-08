import instance from './axiosInstance';

function normalizeFeedbackList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (typeof data === 'object' && data.feedbackId != null) return [data];
  return [];
}

/** GET /api/feedback/lists — Bearer; 404 + MSG_016 = danh sách rỗng */
export const feedbackAPI = {
  getFeedbackLists: async () => {
    try {
      const { data } = await instance.get('/feedback/lists');
      return normalizeFeedbackList(data);
    } catch (e) {
      const status = e.response?.status;
      const msgCode = e.response?.data?.msgCode;
      const message = String(e.response?.data?.message || '');
      if (
        status === 404
        || msgCode === 'MSG_016'
        || /không có phản hồi/i.test(message)
      ) {
        return [];
      }
      throw e;
    }
  },
};
