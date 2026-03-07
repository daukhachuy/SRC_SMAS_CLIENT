import instance, { API_BASE_URL } from './axiosInstance';
import axios from 'axios';

/**
 * Home/Public API calls
 * Endpoints: /api/public/* (không cần auth)
 */

// Dùng axios thường cho public endpoints (không cần token)
const publicAxios = axios.create({
  baseURL: `${API_BASE_URL}/public`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function getRestaurantInfo() {
  try {
    console.log('📍 Fetching restaurant info...');
    const r = await publicAxios.get('/info');
    console.log('✅ Restaurant info loaded');
    return r.data;
  } catch (error) {
    console.error('❌ Failed to fetch restaurant info:', error.message);
    throw error;
  }
}

export async function getFeaturedMenu() {
  try {
    console.log('🍽️ Fetching featured menu...');
    const r = await publicAxios.get('/featured-menu');
    console.log('✅ Featured menu loaded');
    return r.data;
  } catch (error) {
    console.error('❌ Failed to fetch featured menu:', error.message);
    throw error;
  }
}

export async function createReservation(payload) {
  try {
    console.log('📅 Creating reservation...');
    const r = await instance.post('/reservation/create', payload);
    console.log('✅ Reservation created');
    return r.data;
  } catch (error) {
    console.error('❌ Failed to create reservation:', error.response?.data || error.message);
    throw error;
  }
}

export async function getBlogs() {
  try {
    console.log('📰 Fetching blogs...');
    const r = await publicAxios.get('/blogs');
    console.log('✅ Blogs loaded');
    return r.data;
  } catch (error) {
    console.error('❌ Failed to fetch blogs:', error.message);
    throw error;
  }
}

export async function getFeedbacks() {
  try {
    console.log('⭐ Fetching feedbacks...');
    const r = await publicAxios.get('/feedbacks');
    console.log('✅ Feedbacks loaded');
    return r.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedbacks:', error.message);
    throw error;
  }
}
