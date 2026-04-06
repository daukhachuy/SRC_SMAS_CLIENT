import instance from './axiosInstance';

const FIXED_PRODUCT_IMAGE = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';

/**
 * Ghép URL ảnh món (Swagger: image có thể là path tương đối "/foods/xxx.jpg")
 */
export function resolveFoodImageUrl(imagePath) {
  if (imagePath == null || imagePath === '') return FIXED_PRODUCT_IMAGE;
  const s = String(imagePath).trim();
  if (!s) return FIXED_PRODUCT_IMAGE;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const apiBase = process.env.REACT_APP_API_URL || '';
  const origin = apiBase.replace(/\/api\/?$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${origin}${path}`;
}

/**
 * Chuẩn hóa payload GET /api/food/category (mảng phẳng hoặc lồng category)
 */
export function normalizeFoodCategoryPayload(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.$values)) return data.$values;
  if (Array.isArray(data.foods)) return data.foods;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.categories)) {
    const out = [];
    for (const c of data.categories) {
      const foods = c.foods || c.menuItems || c.$values;
      if (Array.isArray(foods)) out.push(...foods);
    }
    return out;
  }
  return [];
}

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

/**
 * Cập nhật trạng thái món ăn (backend toggle: Đang bán ↔ Hết hàng)
 * Swagger: PATCH /api/food/status-food/{id} — path id: integer($int32), không body
 * Thành công: { msgCode: "MSG_022", message: "Cập nhật trạng thái món ăn thành công !" }
 *
 * @param {number|string} foodId - foodId (int32)
 * @returns {Promise<{ msgCode?: string, message?: string }>}
 */
export async function updateFoodStatus(foodId) {
  const idNum = Number(foodId);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    throw {
      status: 400,
      message: 'Mã món không hợp lệ.',
      error: new Error('Invalid food id')
    };
  }
  try {
    const response = await instance.patch(`/food/status-food/${idNum}`);
    return response.data;
  } catch (error) {
    const data = error.response?.data;
    const msg =
      (typeof data === 'object' && data?.message) ||
      (typeof data === 'string' ? data : null) ||
      error.message ||
      'Không thể cập nhật trạng thái món.';
    console.error('❌ Failed to update food status:', data || error.message);
    throw {
      status: error.response?.status,
      message: msg,
      msgCode: typeof data === 'object' ? data?.msgCode : undefined,
      error
    };
  }
}

/**
 * Cập nhật trạng thái gói buffet (bật/tắt bán)
 * Swagger: PATCH /api/Buffer/status-buffer/{id} — id = buffetId (int32), không body
 * Thành công: { msgCode: "MSG_022", message: "Cập nhật trạng thái món ăn thành công !" }
 *
 * @param {number|string} buffetId
 * @returns {Promise<{ msgCode?: string, message?: string }>}
 */
export async function updateBuffetStatus(buffetId) {
  const idNum = Number(buffetId);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    throw {
      status: 400,
      message: 'Mã gói buffet không hợp lệ.',
      error: new Error('Invalid buffet id')
    };
  }
  try {
    const response = await instance.patch(`/Buffer/status-buffer/${idNum}`);
    return response.data;
  } catch (error) {
    const data = error.response?.data;
    const msg =
      (typeof data === 'object' && data?.message) ||
      (typeof data === 'string' ? data : null) ||
      error.message ||
      'Không thể cập nhật trạng thái buffet.';
    console.error('❌ Failed to update buffet status:', data || error.message);
    throw {
      status: error.response?.status,
      message: msg,
      msgCode: typeof data === 'object' ? data?.msgCode : undefined,
      error
    };
  }
}