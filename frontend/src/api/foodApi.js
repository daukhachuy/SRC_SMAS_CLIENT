import instance from './axiosInstance';

/**
 * FOOD API - Lấy danh sách món ăn theo danh mục
 * Endpoint: /api/food/category
 */
export async function getFoodCategories() {
  try {
    console.log('📂 Fetching food categories (menu items)...');
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

/**
 * CATEGORY API - Lấy danh sách các loại danh mục (Món chính, Đồ uống...)
 * Endpoint: /api/category/lists
 */
export async function getCategoryLists() {
  try {
    console.log('📂 Fetching category lists...');
    const response = await instance.get('/category/lists');
    console.log('✅ Category lists loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch category lists:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load categories.',
      error
    };
  }
}

/**
 * BUFFET API - Lấy danh sách gói Buffet
 * Endpoint: /api/Buffer/lists (Lưu ý: Chữ 'Buffer' theo đúng Swagger của bạn)
 */
export async function getBuffetLists() {
  try {
    console.log('🔥 Fetching buffet lists...');
    const response = await instance.get('/Buffer/lists');
    console.log('✅ Buffet lists loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch buffet lists:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load buffet lists.',
      error
    };
  }
}

/**
 * COMBO API - Lấy danh sách gói Combo
 * Endpoint: /api/combo
 */
export async function getComboLists() {
  try {
    console.log('🍱 Fetching combo lists...');
    const response = await instance.get('/combo');
    console.log('✅ Combo lists loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch combo lists:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load combo lists.',
      error
    };
  }
}

/**
 * DISCOUNT API
 */
export async function getFoodDiscounts() {
  try {
    console.log('🏷️ Fetching food discounts...');
    const response = await instance.get('/food/discount');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch discounts:', error.message);
    throw error;
  }
}

/**
 * FEEDBACK API
 */
export async function getFeedbackList() {
  try {
    console.log('💬 Fetching feedback list...');
    const response = await instance.get('/feedback/lists');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedback:', error.message);
    throw error;
  }
}