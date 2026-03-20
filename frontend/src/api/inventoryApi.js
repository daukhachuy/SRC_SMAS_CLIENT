import instance from './axiosInstance';

/**
 * INVENTORY API - Quản lý kho hàng
 * Base endpoint: /api/inventory
 *
 * API Swagger: https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/swagger/index.html
 */

// ==================== INVENTORY (Tồn kho) ====================

/**
 * Lấy danh sách tồn kho (tất cả lô hàng)
 * GET /api/inventory/getall
 */
export async function getInventory() {
  try {
    console.log('📦 Fetching inventory list...');
    const response = await instance.get('/inventory/getall');
    console.log('✅ Inventory loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch inventory:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load inventory.',
      error
    };
  }
}

/**
 * Lấy lịch sử nhập/xuất kho
 * GET /api/inventory/logs
 * 404 = chưa có lịch sử → trả về [] để không làm fail cả trang
 */
export async function getInventoryLogs() {
  try {
    console.log('📜 Fetching inventory logs...');
    const response = await instance.get('/inventory/logs');
    console.log('✅ Inventory logs loaded:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn('⚠️ No inventory logs yet (404) – using empty list');
      return [];
    }
    console.error('❌ Failed to fetch inventory logs:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load inventory logs.',
      error
    };
  }
}

/**
 * Tạo mới một lô hàng (Nhập kho)
 * POST /api/inventory/create
 * Body: { ingredientId, batchCode, quantity, pricePerUnit, expiryDate, warehouseLocation?, note? }
 */
export async function createInventory(data) {
  try {
    console.log('📥 Creating inventory...', data);
    const response = await instance.post('/inventory/create', data);
    console.log('✅ Inventory created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create inventory:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to create inventory.',
      error
    };
  }
}

/**
 * Tạo phiếu nhập kho (nhập thêm vào lô đã có)
 * POST /api/inventory/create-import
 * Body: { inventoryId: number, quantity: number, reason: string }
 */
export async function createImport(data) {
  try {
    console.log('📥 Creating import...', data);
    const response = await instance.post('/inventory/create-import', data);
    console.log('✅ Import created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create import:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to create import.',
      error
    };
  }
}

/**
 * Tạo phiếu xuất kho
 * POST /api/inventory/create-export
 * Body: { inventoryId: number, quantity: number, reason: string }
 */
export async function createExport(data) {
  try {
    console.log('📤 Creating export...', data);
    const response = await instance.post('/inventory/create-export', data);
    console.log('✅ Export created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create export:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to create export.',
      error
    };
  }
}

/**
 * Lấy mã lô hàng mới
 * GET /api/inventory/newbatchcode
 */
export async function getNewBatchCode() {
  try {
    console.log('🔢 Fetching new batch code...');
    const response = await instance.get('/inventory/newbatchcode');
    console.log('✅ New batch code:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch batch code:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to generate batch code.',
      error
    };
  }
}

// ==================== INGREDIENT (Nguyên liệu) ====================

/**
 * Lấy danh sách nguyên liệu
 * GET /api/ingredient/GetAll
 */
export async function getIngredients() {
  try {
    console.log('🥗 Fetching ingredients list...');
    const response = await instance.get('/ingredient/GetAll');
    console.log('✅ Ingredients loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch ingredients:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load ingredients.',
      error
    };
  }
}

/**
 * Tạo nguyên liệu mới
 * POST /api/ingredient (nếu có)
 */
export async function createIngredient(data) {
  try {
    console.log('➕ Creating ingredient...', data);
    const response = await instance.post('/ingredient', data);
    console.log('✅ Ingredient created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create ingredient:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to create ingredient.',
      error
    };
  }
}

/**
 * Cập nhật nguyên liệu
 * PUT /api/ingredient/{id} (nếu có)
 */
export async function updateIngredient(id, data) {
  try {
    console.log(`✏️ Updating ingredient ID: ${id}...`, data);
    const response = await instance.put(`/ingredient/${id}`, data);
    console.log(`✅ Ingredient ${id} updated:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to update ingredient ${id}:`, error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to update ingredient.',
      error
    };
  }
}

/**
 * Xóa nguyên liệu
 * DELETE /api/ingredient/{id} (nếu có)
 */
export async function deleteIngredient(id) {
  try {
    console.log(`🗑️ Deleting ingredient ID: ${id}...`);
    const response = await instance.delete(`/ingredient/${id}`);
    console.log(`✅ Ingredient ${id} deleted`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to delete ingredient ${id}:`, error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to delete ingredient.',
      error
    };
  }
}

// ==================== ALIASES FOR BACKWARD COMPATIBILITY ====================

// Alias for existing code that uses these function names
export const getMaterials = getInventory;
export const getBatches = getInventory;
export const getIngredientCategories = getIngredients;
export const createMaterial = createInventory;
export const updateMaterial = updateIngredient;
export const deleteMaterial = deleteIngredient;
