/**
 * JWT Helper - Giải mã JWT token để lấy thông tin user
 */

/**
 * Giải mã JWT token (không verify signature - chỉ để đọc payload)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload hoặc null nếu invalid
 */
export function decodeJWT(token) {
  try {
    if (!token) return null;

    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode base64url payload
    const payload = parts[1];
    // Fix UTF-8 encoding: atob() doesn't handle UTF-8 properly
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Extract user info từ JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - User object với { userId, fullname, role, email, avatar }
 */
export function extractUserFromToken(token) {
  const payload = decodeJWT(token);
  if (!payload) return null;

  // Backend sử dụng .NET Identity claims format
  const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
  const fullname = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
  const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const avatar = payload['avatar'] || '';

  // Email có thể từ claim hoặc từ context
  const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                payload['email'] || 
                '';

  return {
    userId: parseInt(userId) || null,
    fullname: fullname || 'User',
    role: role || 'Customer',
    email: email,
    avatar: avatar,
    // Token expiration
    exp: payload.exp,
    iss: payload.iss,
    aud: payload.aud
  };
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if expired
 */
export function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Get time until token expires (in seconds)
 * @param {string} token - JWT token
 * @returns {number} - Seconds until expiration, or 0 if expired
 */
export function getTokenTimeRemaining(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return 0;

  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - now;
  return remaining > 0 ? remaining : 0;
}

export default {
  decodeJWT,
  extractUserFromToken,
  isTokenExpired,
  getTokenTimeRemaining
};
