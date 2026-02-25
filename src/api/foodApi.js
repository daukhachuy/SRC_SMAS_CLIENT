import instance, { API_BASE_URL } from './axiosInstance';

/**
 * Food API calls
 * Endpoints: /api/food/category, /api/food/discount, etc.
 */

export async function getFoodCategories() {
  try {
    console.log('📂 Fetching food categories...');
    const response = await instance.get('/food/category');
    console.log('✅ Food categories loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch food categories:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load food categories.',
      error
    };
  }
}

export async function getFoodDiscounts() {
  try {
    console.log('🏷️ Fetching food discounts...');
    const response = await instance.get('/food/discount');
    console.log('✅ Food discounts loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch food discounts:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load food discounts.',
      error
    };
  }
}

export async function getFoodByCategory(categoryId) {
  try {
    console.log('🍽️ Fetching food by category:', categoryId);
    const response = await instance.get(`/food/category/${categoryId}`);
    console.log('✅ Food items loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch food by category:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load food items.',
      error
    };
  }
}

/**
 * Feedback API calls
 * Endpoints: /api/feedback/lists, etc.
 */

export async function getFeedbackList() {
  try {
    console.log('💬 Fetching feedback list...');
    const response = await instance.get('/feedback/lists');
    console.log('✅ Feedback list loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedback:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load feedback.',
      error
    };
  }
}
