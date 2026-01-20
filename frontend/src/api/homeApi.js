import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://localhost:5001/api/public';

export async function getRestaurantInfo() {
  const r = await axios.get(`${API_BASE}/info`);
  return r.data;
}

export async function getFeaturedMenu() {
  const r = await axios.get(`${API_BASE}/featured-menu`);
  return r.data;
}

export async function createReservation(payload) {
  const r = await axios.post(`${API_BASE}/reservations`, payload);
  return r.data;
}

export async function getBlogs() {
  const r = await axios.get(`${API_BASE}/blogs`);
  return r.data;
}

export async function getFeedbacks() {
  const r = await axios.get(`${API_BASE}/feedbacks`);
  return r.data;
}
