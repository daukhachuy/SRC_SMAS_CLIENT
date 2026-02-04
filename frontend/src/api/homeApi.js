import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/public` : 'https://localhost:5001/api/public';

export async function getRestaurantInfo() {
  try {
    const r = await axios.get(`${API_BASE}/info`);
    return r.data;
  } catch (error) {
    console.error('Get restaurant info error:', error);
    throw error;
  }
}

export async function getFeaturedMenu() {
  try {
    const r = await axios.get(`${API_BASE}/featured-menu`);
    return r.data;
  } catch (error) {
    console.error('Get featured menu error:', error);
    throw error;
  }
}

export async function createReservation(payload) {
  try {
    const r = await axios.post(`${API_BASE}/reservations`, payload);
    return r.data;
  } catch (error) {
    console.error('Create reservation error:', error);
    throw error;
  }
}

export async function getBlogs() {
  try {
    const r = await axios.get(`${API_BASE}/blogs`);
    return r.data;
  } catch (error) {
    console.error('Get blogs error:', error);
    throw error;
  }
}

export async function getFeedbacks() {
  try {
    const r = await axios.get(`${API_BASE}/feedbacks`);
    return r.data;
  } catch (error) {
    console.error('Get feedbacks error:', error);
    throw error;
  }
}
