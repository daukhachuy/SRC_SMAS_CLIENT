import instance from './axiosInstance';
import { extractUserFromToken } from '../utils/jwtHelper';
import { googleLogout } from '@react-oauth/google';

/* =====================================================
   HELPER: Save Auth Data
===================================================== */
function saveAuthData(data) {
  if (data?.token) {
    localStorage.setItem('authToken', data.token);
    
    // Extract user info từ JWT token
    const userInfo = extractUserFromToken(data.token);
    if (userInfo) {
      localStorage.setItem('user', JSON.stringify(userInfo));
      console.log('✅ User info extracted from JWT:', userInfo);
    }
  }

  // Nếu backend có trả về user object riêng, ưu tiên nó
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
}

/* =====================================================
   HELPER: Handle Axios Error
   Chuẩn hóa error trả về cho UI
===================================================== */
function handleApiError(error) {
  const status = error.response?.status || 500;
  const message =
    error.response?.data?.message ||
    error.message ||
    'Unexpected error occurred';

  const code = error.response?.data?.msgCode || null;

  return {
    status,
    message,
    code,
  };
}

/* =====================================================
   LOGIN
===================================================== */
export async function login(email, password) {
  try {
    const response = await instance.post('/auth/login', {
      email: email.trim(),
      password,
    });

    if (!response.data?.token) {
      throw {
        response: {
          status: 401,
          data: {
            message: 'Email hoặc mật khẩu không chính xác',
          },
        },
      };
    }

    saveAuthData(response.data);
    
    // Extract user info từ JWT token và return
    const userInfo = extractUserFromToken(response.data.token);
    return {
      ...response.data,
      user: userInfo // Thêm user object từ JWT
    };
  } catch (error) {
    throw handleApiError(error);
  }
}

/* =====================================================
   REGISTER
===================================================== */
export async function register(userData) {
  try {
    const response = await instance.post('/auth/register', {
      email: userData.email?.trim(),
      password: userData.password,
      fullname: userData.fullName || userData.fullname,
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/* =====================================================
   GOOGLE LOGIN
===================================================== */
export async function googleLogin(token) {
  try {
    const response = await instance.post('/auth/login/google', {
      token,
    });

    if (!response.data?.token) {
      throw {
        response: {
          status: 401,
          data: {
            message: 'Google login failed',
          },
        },
      };
    }

    saveAuthData(response.data);
    
    // Extract user info từ JWT token và return
    const userInfo = extractUserFromToken(response.data.token);
    return {
      ...response.data,
      user: userInfo
    };
  } catch (error) {
    throw handleApiError(error);
  }
}

/* =====================================================
   GOOGLE REGISTER
===================================================== */
export async function googleRegister(token) {
  try {
    const response = await instance.post('/auth/register/google', {
      token,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/* =====================================================
   FORGOT PASSWORD
===================================================== */
export async function forgotPassword(email) {
  try {
    const response = await instance.post('/auth/forgot-password', {
      email: email.trim(),
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/* =====================================================
   VERIFY OTP
===================================================== */
export async function verifyOtp(email, otp) {
  try {
    const response = await instance.post('/auth/verify-otp', {
      email: email.trim(),
      otp: otp.trim(),
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/* =====================================================
   RESET PASSWORD
===================================================== */
export async function resetPassword(email, otp, newPassword) {
  try {
    const response = await instance.post('/auth/reset-password', {
      email: email.trim(),
      otp: otp.trim(),
      newPassword,
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/* =====================================================
   AUTH HELPERS
===================================================== */
export function logout() {
  googleLogout();
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
}

export function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}

export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}