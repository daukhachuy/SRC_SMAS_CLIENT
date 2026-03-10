import instance from './axiosInstance';

const FIXED_PRODUCT_IMAGE = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';

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

export async function getBuffetDetail(id) {
  try {
    console.log(`🔍 Fetching detail for buffet ID: ${id}...`);
    const response = await instance.get(`/food/BuffetId/${id}`);
    console.log(`✅ Buffet detail ${id} loaded:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch buffet detail ${id}:`, error.message);
    return null;
  }
}

/**
 * FOOD FILTER API - Lấy danh sách món ăn theo filter (category, price)
 * Endpoint: /api/food/filter
 * @param {URLSearchParams} params - Filter parameters
 */
export async function getFoodByFilter(params) {
  try {
    const queryString = params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
    
    console.log('🔍 Fetching foods with filter:', queryString);
    const response = await instance.get(`/food/filter?${queryString}`);
    
    const foodArray = Array.isArray(response.data) ? response.data : response.data?.$values || [];
    console.log(`✅ Foods loaded: ${foodArray.length} items`);
    
    const mappedFoods = foodArray.map(item => ({
      ...item,
      image: FIXED_PRODUCT_IMAGE
    }));
    
    return mappedFoods;
  } catch (error) {
    console.error('❌ Failed to fetch foods with filter:', error.response?.data || error.message);
    throw error;
  }
}