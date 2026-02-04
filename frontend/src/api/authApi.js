import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';

export async function login(email, password) {
  try {
    const resp = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return resp.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(user) {
  try {
    const resp = await axios.post(`${API_BASE}/auth/register`, user);
    return resp.data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}
