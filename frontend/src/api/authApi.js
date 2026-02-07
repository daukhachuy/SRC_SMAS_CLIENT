import instance, { API_BASE_URL } from './axiosInstance';

/**
 * Authentication API calls
 * Endpoints: /api/auth/login, /api/auth/register, etc.
 */

export async function login(email, password) {
  try {
    console.log('🔐 Logging in:', email);
    const response = await instance.post('/auth/login', { 
      email: email.trim(), 
      password 
    });
    
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user || { email }));
      console.log('✅ Login successful');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Login failed. Check credentials or server connection.',
      error
    };
  }
}

export async function register(userData) {
  try {
    console.log('📝 Registering user:', userData.email);
    const response = await instance.post('/auth/register', {
      email: userData.email?.trim(),
      password: userData.password,
      fullname: userData.fullName || userData.fullname
    });
    
    console.log('✅ Registration successful');
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Registration failed.',
      error
    };
  }
}

export async function googleLogin(token) {
  try {
    console.log('🔐 Google Login...');
    const response = await instance.post('/auth/login/google', { token });
    
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user || {}));
      console.log('✅ Google login successful');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Google login failed:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Google login failed.',
      error
    };
  }
}

export async function googleRegister(token) {
  try {
    console.log('📝 Google Register...');
    const response = await instance.post('/auth/register/google', { token });
    
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user || {}));
      console.log('✅ Google register successful');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Google register failed:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Google register failed.',
      error
    };
  }
}

export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  console.log('👋 User logged out');
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
export async function forgotPassword(email) {
  try {
    console.log('📧 Sending password reset email to:', email);
    const response = await instance.post('/auth/forgot-password', { 
      email: email.trim()
    });
    console.log('✅ Password reset email sent');
    return response.data;
  } catch (error) {
    console.error('❌ Forgot password failed:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to send reset email. Please check your email address.',
      error
    };
  }
}

export async function verifyOtp(email, otp) {
  try {
    console.log('🔐 Verifying OTP for:', email);
    const response = await instance.post('/auth/verify-otp', { 
      email: email.trim(),
      otp: otp.trim()
    });
    console.log('✅ OTP verified successfully');
    return response.data;
  } catch (error) {
    console.error('❌ OTP verification failed:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Invalid or expired OTP. Please try again.',
      error
    };
  }
}

export async function resetPassword(email, otp, newPassword) {
  try {
    console.log('🔄 Resetting password for:', email);
    const response = await instance.post('/auth/reset-password', { 
      email: email.trim(),
      otp: otp.trim(),
      newPassword
    });
    console.log('✅ Password reset successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Password reset failed:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to reset password. Please try again.',
      error
    };
  }
}