import instance from './axiosInstance';
import { extractUserFromToken } from '../utils/jwtHelper';

// Cloudinary config (cùng pattern dùng trong ManagerProfilePage)
const CLOUD_NAME = 'dmzuier4p';
const UPLOAD_PRESET = 'ml_default';
const CLOUD_FOLDER = 'smas';

export const FIXED_PRODUCT_IMAGE = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';

/**
 * Upload ảnh lên Cloudinary, trả về secure_url
 * @param {File} file
 * @returns {Promise<string>} secure_url
 */
export async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', CLOUD_FOLDER);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const json = await res.json();
  return json.secure_url;
}

export function getComboCreatedBy() {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken');
  const fromJwt = extractUserFromToken(token);
  if (fromJwt?.userId != null && !Number.isNaN(Number(fromJwt.userId))) {
    return Number(fromJwt.userId);
  }
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return Number(u.userId) || 0;
  } catch {
    return 0;
  }
}

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
 * Endpoint: GET /api/combo  hoặc  GET /api/combo?id=
 */
export async function getComboLists(options = {}) {
  try {
    const { id } = options;
    const params =
      id != null && id !== ''
        ? { id: Number(id) }
        : undefined;
    const response = await instance.get('/combo', params ? { params } : {});
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

/** Chuẩn hóa mảng từ GET /api/combo */
export function normalizeComboListResponse(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.$values)) return data.$values;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

/**
 * POST /api/combo — tạo combo (Swagger: JSON đúng schema)
 * Payload: { name, description, price, discountPercent, image, startDate, expiryDate, maxUsage, foods }
 */
export async function createCombo(payload) {
  try {
    // Upload ảnh lên Cloudinary nếu có file
    let imageUrl = payload.image ?? '';
    if (payload.imageFile instanceof File) {
      console.log('[createCombo] Đang upload ảnh lên Cloudinary...');
      imageUrl = await uploadImageToCloudinary(payload.imageFile);
      console.log('[createCombo] Ảnh đã upload:', imageUrl);
    }

    const createdBy = payload.createdBy ?? getComboCreatedBy();
    const maxUsage =
      payload.maxUsage === '' || payload.maxUsage == null
        ? 2147483647
        : Math.max(0, Number(payload.maxUsage) || 0);

    // Build foods array nếu có
    const foodsArray = Array.isArray(payload.foods)
      ? payload.foods.map((f) => ({
          foodId: Number(f.foodId) || 0,
          quantity: Number(f.quantity) || 0,
        }))
      : [];

    const base = {
      name: String(payload.name ?? ''),
      description: String(payload.description ?? ''),
      price: Number(payload.price) || 0.01,
      discountPercent: Math.min(100, Math.max(0, Number(payload.discountPercent) || 0)),
      image: imageUrl,
      startDate: payload.startDate || '2000-01-01',
      expiryDate: payload.expiryDate || '2099-12-31',
      maxUsage,
      createdBy: Number(createdBy) || 0,
      foods: foodsArray,
    };

    console.log('[foodApi] createCombo payload:', JSON.stringify(base, null, 2));
    const resp = await instance.post('/combo', base);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] createCombo error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * PUT /api/combo/{id} — cập nhật combo
 */
export async function updateCombo(id, payload) {
  try {
    // Upload ảnh lên Cloudinary nếu có file mới
    let imageUrl = payload.image ?? '';
    if (payload.imageFile instanceof File) {
      console.log('[updateCombo] Đang upload ảnh lên Cloudinary...');
      imageUrl = await uploadImageToCloudinary(payload.imageFile);
      console.log('[updateCombo] Ảnh đã upload:', imageUrl);
    }

    const maxUsage =
      payload.maxUsage === '' || payload.maxUsage == null
        ? 2147483647
        : Math.max(0, Number(payload.maxUsage) || 0);

    // Build foods array nếu có
    const foodsArray = Array.isArray(payload.foods)
      ? payload.foods.map((f) => ({
          foodId: Number(f.foodId) || 0,
          quantity: Number(f.quantity) || 0,
        }))
      : [];

    const base = {
      name: String(payload.name ?? ''),
      description: String(payload.description ?? ''),
      price: Number(payload.price) || 0.01,
      discountPercent: Math.min(100, Math.max(0, Number(payload.discountPercent) || 0)),
      image: imageUrl,
      startDate: payload.startDate || '2000-01-01',
      expiryDate: payload.expiryDate || '2099-12-31',
      maxUsage,
      foods: foodsArray,
    };

    console.log('[foodApi] updateCombo payload:', JSON.stringify(base, null, 2));
    const resp = await instance.put(`/combo/${id}`, base);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] updateCombo error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * GET /api/combo?id={id} — lấy chi tiết 1 combo (bao gồm foods)
 */
export async function getComboById(id) {
  try {
    const resp = await instance.get('/combo', { params: { id: Number(id) } });
    const data = resp.data;
    // API trả về object rỗng nếu không tìm thấy
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Không tìm thấy combo');
    }
    return data;
  } catch (err) {
    console.error('[foodApi] getComboById error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * DELETE /api/combo/{id}
 */
export async function deleteCombo(id) {
  try {
    const resp = await instance.delete(`/combo/${id}`);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] deleteCombo error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * PATCH /api/combo/{id}/status?isAvailable=
 */
export async function patchComboStatus(id, isAvailable) {
  try {
    const resp = await instance.patch(`/combo/${id}/status`, null, {
      params: { isAvailable: Boolean(isAvailable) },
    });
    return resp.data;
  } catch (err) {
    console.error('[foodApi] patchComboStatus error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * DISCOUNT API
 */
/**
 * FOOD CRUD API
 * Base: https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api
 */

/**
 * GET /api/food — danh sách món (Swagger SMAS: mảng { foodId, name, price, promotionalPrice, image, unit, isAvailable, ... })
 * @see https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/swagger/index.html
 * @param {number|string} [foodId] — query tùy chọn ?id= (lọc một món)
 */
export async function getAllFoods(foodId) {
  try {
    const params =
      foodId != null && foodId !== ''
        ? { id: Number(foodId) }
        : undefined;
    const resp = await instance.get('/food', params ? { params } : {});
    const d = resp.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.$values)) return d.$values;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.data)) return d.data;
    return [];
  } catch (err) {
    console.error('[foodApi] getAllFoods error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * POST /api/food — tạo món ăn mới
 * payload: FoodCreateDto
 * Backend .NET thường dùng IFormFile cho ảnh → dùng FormData
 */
export async function createFood(payload) {
  try {
    let imageUrl = payload.image ?? '';
    if (payload.imageFile instanceof File) {
      console.log('[createFood] Đang upload ảnh lên Cloudinary...');
      imageUrl = await uploadImageToCloudinary(payload.imageFile);
      console.log('[createFood] Ảnh đã upload:', imageUrl);
    }

    const cleanPrice = Number(String(payload.price ?? 0).replace(/[.,]/g, '')) || 0;
    const cleanPrepTime = payload.preparationTime != null ? Number(String(payload.preparationTime).replace(/\D/g, '')) || 0 : 0;

    const jsonData = {
      name: payload.name ?? '',
      description: payload.description ?? '',
      image: imageUrl,
      price: cleanPrice,
      isAvailable: payload.isAvailable !== false,
      inStockable: payload.inStockable !== false,
      preparationTime: cleanPrepTime,
      colors: payload.colors ?? [],
      note: payload.note ?? '',
      categoryIds: payload.categoryIds ?? [],
    };
    console.log('[createFood] Payload gửi đi:', jsonData);

    const resp = await instance.post('/food', jsonData);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] createFood error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * PUT /api/food/{id} — cập nhật món ăn
 */
export async function updateFood(id, payload) {
  try {
    let imageUrl = payload.image ?? '';
    if (payload.imageFile instanceof File) {
      console.log('[updateFood] Đang upload ảnh lên Cloudinary...');
      imageUrl = await uploadImageToCloudinary(payload.imageFile);
      console.log('[updateFood] Ảnh đã upload:', imageUrl);
    }

    const cleanPrice = Number(String(payload.price ?? 0).replace(/[.,]/g, '')) || 0;
    const cleanPrepTime = payload.preparationTime != null ? Number(String(payload.preparationTime).replace(/\D/g, '')) || 0 : 0;

    const jsonData = {
      name: payload.name ?? '',
      description: payload.description ?? '',
      image: imageUrl,
      price: cleanPrice,
      isAvailable: payload.isAvailable !== false,
      inStockable: payload.inStockable !== false,
      preparationTime: cleanPrepTime,
      colors: payload.colors ?? [],
      note: payload.note ?? '',
      categoryIds: payload.categoryIds ?? [],
    };
    console.log('[updateFood] Payload gửi đi:', jsonData);

    const resp = await instance.put(`/food/${id}`, jsonData);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] updateFood error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * DELETE /api/food/{id} — xóa món ăn
 */
export async function deleteFood(id) {
  try {
    const resp = await instance.delete(`/food/${id}`);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] deleteFood error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * PATCH /api/food/{id}/status?isAvailable= — Swagger: query param isAvailable (boolean), không gửi body.
 */
export async function toggleFoodStatus(id, newStatus) {
  try {
    const resp = await instance.patch(`/food/${id}/status`, null, {
      params: { isAvailable: Boolean(newStatus) },
    });
    return resp.data;
  } catch (err) {
    console.error('[foodApi] toggleFoodStatus error:', err.response?.data || err.message);
    throw err;
  }
}

export async function getFoodById(id) {
  try {
    const resp = await instance.get(`/food/${id}`);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] getFoodById error:', err.response?.data || err.message);
    throw err;
  }
}

export async function getFoodDiscounts() {
  try {
    const response = await instance.get('/food/discount');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch discounts:', error.message);
    throw error;
  }
}

export async function getFeedbackList() {
  try {
    const response = await instance.get('/feedback/lists');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedback:', error.message);
    throw error;
  }
}

export async function getBuffetDetail(id) {
  try {
    const response = await instance.get(`/food/BuffetId/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch buffet detail ${id}:`, error.message);
    return null;
  }
}

export async function getFoodByFilter(params) {
  try {
    const queryString = params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
    const response = await instance.get(`/food/filter?${queryString}`);
    const foodArray = Array.isArray(response.data) ? response.data : response.data?.$values || [];
    return foodArray;
  } catch (error) {
    console.error('❌ Failed to fetch foods with filter:', error.response?.data || error.message);
    throw error;
  }
}

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

/* =============================================
   BUFFET API - CRUD + QUẢN LÝ MÓN TRONG BUFFET
   ============================================= */

/**
 * POST /api/Buffer — tạo gói Buffet mới
 * Payload: { name, description, image, mainPrice, childrenPrice, sidePrice, isAvailable, foods }
 */
export async function createBuffet(payload) {
  try {
    // Upload ảnh lên Cloudinary nếu có file
    let imageUrl = payload.image ?? '';
    if (payload.imageFile instanceof File) {
      console.log('[createBuffet] Đang upload ảnh lên Cloudinary...');
      imageUrl = await uploadImageToCloudinary(payload.imageFile);
      console.log('[createBuffet] Ảnh đã upload:', imageUrl);
    }

    const createdBy = payload.createdBy ?? getComboCreatedBy();
    const foodsArray = Array.isArray(payload.foods)
      ? payload.foods.map((f) => ({
          foodId: Number(f.foodId) || 0,
          quantity: Number(f.quantity) || 0,
          isUnlimited: Boolean(f.isUnlimited),
        }))
      : [];

    const base = {
      name: String(payload.name ?? ''),
      description: String(payload.description ?? ''),
      image: imageUrl,
      mainPrice: Number(payload.mainPrice) || 0,
      childrenPrice: Number(payload.childrenPrice) || 0,
      sidePrice: Number(payload.sidePrice) || 0,
      isAvailable: Boolean(payload.isAvailable),
      createdBy: Number(createdBy) || 0,
      foods: foodsArray,
    };

    console.log('[foodApi] createBuffet payload:', JSON.stringify(base, null, 2));
    const resp = await instance.post('/Buffer', base);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] createBuffet error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * PUT /api/Buffer/{id} — cập nhật gói Buffet
 */
export async function updateBuffet(id, payload) {
  try {
    // Upload ảnh lên Cloudinary nếu có file mới
    let imageUrl = payload.image ?? '';
    if (payload.imageFile instanceof File) {
      console.log('[updateBuffet] Đang upload ảnh lên Cloudinary...');
      imageUrl = await uploadImageToCloudinary(payload.imageFile);
      console.log('[updateBuffet] Ảnh đã upload:', imageUrl);
    }

    const foodsArray = Array.isArray(payload.foods)
      ? payload.foods.map((f) => ({
          foodId: Number(f.foodId) || 0,
          quantity: Number(f.quantity) || 0,
          isUnlimited: Boolean(f.isUnlimited),
        }))
      : [];

    const base = {
      name: String(payload.name ?? ''),
      description: String(payload.description ?? ''),
      image: imageUrl,
      mainPrice: Number(payload.mainPrice) || 0,
      childrenPrice: Number(payload.childrenPrice) || 0,
      sidePrice: Number(payload.sidePrice) || 0,
      isAvailable: Boolean(payload.isAvailable),
      foods: foodsArray,
    };

    console.log('[foodApi] updateBuffet payload:', JSON.stringify(base, null, 2));
    const resp = await instance.put(`/Buffer/${id}`, base);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] updateBuffet error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * DELETE /api/Buffer/{buffetId}/foods/{foodId} — xóa MỘT MÓN ăn khỏi gói Buffet
 * Lưu ý: KHÔNG xóa Buffet, chỉ gỡ món ra khỏi danh sách
 */
export async function removeFoodFromBuffet(buffetId, foodId) {
  try {
    console.log(`[foodApi] removeFoodFromBuffet: buffetId=${buffetId}, foodId=${foodId}`);
    const resp = await instance.delete(`/Buffer/${buffetId}/foods/${foodId}`);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] removeFoodFromBuffet error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * POST /api/Buffer/{id}/foods — thêm món vào gói Buffet
 * Payload: { foodId, quantity, isUnlimited }
 */
export async function addFoodToBuffet(buffetId, foodPayload) {
  try {
    const body = {
      foodId: Number(foodPayload.foodId) || 0,
      quantity: Number(foodPayload.quantity) || 0,
      isUnlimited: Boolean(foodPayload.isUnlimited),
    };
    console.log(`[foodApi] addFoodToBuffet: buffetId=${buffetId}`, body);
    const resp = await instance.post(`/Buffer/${buffetId}/foods`, body);
    return resp.data;
  } catch (err) {
    console.error('[foodApi] addFoodToBuffet error:', err.response?.data || err.message);
    throw err;
  }
}