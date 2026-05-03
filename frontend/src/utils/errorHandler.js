/**
 * Xử lý lỗi API trả về, trả về thông báo tiếng Việt thân thiện
 */

/**
 * Lấy thông báo lỗi từ error object
 * @param {Error|{response?: {data?: {message?: string}}, message?: string, error?: {response?: {data?: {message?: string}}}} } error
 * @param {string} defaultMessage - Thông báo mặc định nếu không lấy được
 * @returns {string} Thông báo lỗi tiếng Việt
 */
export function getErrorMessage(error, defaultMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  // Kiểm tra các nguồn thông báo theo thứ tự ưu tiên
  const messageSources = [
    // Axios error structure
    error?.response?.data?.message,
    error?.response?.data,
    // Nested error
    error?.error?.response?.data?.message,
    error?.error?.response?.data,
    // Direct message
    typeof error?.message === 'string' && error.message,
    // Error object with message
    typeof error?.error?.message === 'string' && error.error.message,
  ];

  for (const source of messageSources) {
    if (source && typeof source === 'string' && source.trim()) {
      return source.trim();
    }
  }

  // Kiểm tra nếu response.data là object có thể lấy message
  if (error?.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data;
    // Lấy message từ object response
    const possibleFields = ['message', 'Message', 'msg', 'error', 'Error'];
    for (const field of possibleFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field].trim();
      }
    }
    // Kiểm tra errors object (validation errors)
    if (data.errors && typeof data.errors === 'object') {
      const firstError = Object.values(data.errors)[0];
      if (firstError && typeof firstError === 'string') {
        return firstError.trim();
      }
      if (Array.isArray(firstError) && firstError[0]) {
        return firstError[0].trim();
      }
    }
  }

  return defaultMessage;
}

/**
 * Lấy thông báo lỗi validation từ response
 */
export function getValidationError(error) {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    const entries = Object.entries(data.errors);
    if (entries.length > 0) {
      const [field, messages] = entries[0];
      if (Array.isArray(messages) && messages[0]) {
        return messages[0];
      }
      if (typeof messages === 'string') {
        return messages;
      }
    }
  }
  return getErrorMessage(error);
}

/**
 * Lấy thông báo lỗi cho các thao tác CRUD
 */
export function getCRUDErrorMessage(operation, error) {
  const messages = {
    create: 'Không thể tạo mới. Vui lòng kiểm tra lại thông tin.',
    update: 'Không thể cập nhật. Vui lòng thử lại.',
    delete: 'Không thể xóa. Vui lòng thử lại.',
    fetch: 'Không thể tải dữ liệu. Vui lòng thử lại.',
    toggle: 'Không thể thay đổi trạng thái. Vui lòng thử lại.',
  };
  return getErrorMessage(error, messages[operation] || messages.fetch);
}
