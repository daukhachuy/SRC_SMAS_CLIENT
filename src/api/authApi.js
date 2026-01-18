import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';

export async function login(email, password) {
  const resp = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return resp.data;
}

export async function register(user) {
  const resp = await axios.post(`${API_BASE}/auth/register`, user);
  return resp.data;
}
