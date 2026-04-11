/**
 * Authorization Guard Utilities
 * - Kiểm tra token validity
 * - Kiểm tra token expiry
 * - Decode JWT token
 * - Kiểm tra role
 */

/**
 * Decode JWT Token
 * @param {string} token - JWT token
 * @returns {object} Decoded payload
 */
export function decodeToken(token) {
  if (!token) return null;

  try {
    // JWT format: header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
}

/**
 * Kiểm tra token đã hết hạn chưa
 * @param {string} token - JWT token
 * @returns {boolean} true nếu hết hạn, false nếu còn hạn
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  // exp là seconds, chuyển sang milliseconds
  const expiry = decoded.exp * 1000;
  const now = Date.now();

  return now > expiry;
}

/**
 * Lấy thời gian còn lại của token (seconds)
 * @param {string} token - JWT token
 * @returns {number} Seconds còn lại (negative nếu hết hạn)
 */
export function getTokenTimeRemaining(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;

  const expiry = decoded.exp * 1000;
  const now = Date.now();
  
  return Math.floor((expiry - now) / 1000);
}

/**
 * Kiểm tra user có role cụ thể không
 * @param {string} requiredRole - Role cần kiểm tra
 * @returns {boolean} true nếu có role, false nếu không
 */
export function hasRole(requiredRole) {
  if (!requiredRole) return true; // Không yêu cầu role

  const userStr = localStorage.getItem('user');
  if (!userStr) return false;

  try {
    const user = JSON.parse(userStr);
    const userRole = String(user.role || '').trim().toLowerCase();
    const normalizedRequired = String(requiredRole).trim().toLowerCase();
    return userRole === normalizedRequired;
  } catch (error) {
    console.error('❌ Error parsing user:', error);
    return false;
  }
}

/**
 * Kiểm tra user có một trong các roles không
 * @param {array<string>} roles - Mảng roles
 * @returns {boolean} true nếu có một trong các roles
 */
export function hasAnyRole(roles) {
  if (!roles || roles.length === 0) return true;

  const userStr = localStorage.getItem('user');
  if (!userStr) return false;

  try {
    const user = JSON.parse(userStr);
    const userRole = String(user.role || '').trim().toLowerCase();
    const normalizedRoles = roles.map(r => String(r).trim().toLowerCase());
    return normalizedRoles.includes(userRole);
  } catch (error) {
    console.error('❌ Error parsing user:', error);
    return false;
  }
}

/**
 * Kiểm tra token có hợp lệ không (tồn tại + chưa hết hạn)
 * @returns {boolean} true nếu hợp lệ
 */
export function isTokenValid() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.warn('⚠️ No token found');
    return false;
  }

  if (isTokenExpired(token)) {
    console.warn('⚠️ Token has expired');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return false;
  }

  return true;
}

/**
 * Lấy user info từ localStorage
 * @returns {object|null} User object hoặc null
 */
export function getUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('❌ Error parsing user:', error);
    return null;
  }
}

/**
 * Lấy token từ localStorage
 * @returns {string|null} Token hoặc null
 */
export function getToken() {
  return localStorage.getItem('authToken');
}

/**
 * Kiểm tra user đã login chưa
 * @returns {boolean} true nếu đã login
 */
export function isAuthenticated() {
  return isTokenValid();
}

/**
 * Log token info (debug)
 */
export function logTokenInfo() {
  const token = getToken();
  const user = getUser();

  console.group('🔐 Token Info');
  console.log('Token Present:', !!token);
  if (token) {
    console.log('Token Preview:', token.substring(0, 50) + '...');
    console.log('Token Expired:', isTokenExpired(token));
    console.log('Time Remaining:', getTokenTimeRemaining(token) + ' seconds');
    console.log('Decoded:', decodeToken(token));
  }
  console.log('User:', user);
  console.groupEnd();
}

export default {
  decodeToken,
  isTokenExpired,
  getTokenTimeRemaining,
  hasRole,
  hasAnyRole,
  isTokenValid,
  getUser,
  getToken,
  isAuthenticated,
  logTokenInfo,
};
