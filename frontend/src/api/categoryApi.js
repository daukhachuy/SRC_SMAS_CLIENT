import instance from './axiosInstance';

/**
 * Normalize raw API item → consistent shape.
 * Handles both /category and /category/lists response formats.
 */
function normalize(raw) {
  if (!raw) return null;
  return {
    categoryId: raw.categoryId ?? raw.id ?? null,
    name:      raw.name      ?? '',
    description: raw.description ?? '',
    image:     raw.image     ?? null,
    isProcessedGoods: raw.isProcessedGoods ?? false,
    isAvailable: raw.isAvailable ?? true,
    createdAt:  raw.createdAt  ?? null,
    updatedAt:  raw.updatedAt  ?? null,
  };
}

function normalizeList(data) {
  if (Array.isArray(data)) return data.map(normalize).filter(Boolean);
  if (data?.$values) return data.$values.map(normalize).filter(Boolean);
  if (data?.data)   return data.data.map(normalize).filter(Boolean);
  return [];
}

// GET /api/category/lists
export const getAllCategories = async () => {
  try {
    const response = await instance.get('/category/lists');
    return normalizeList(response.data);
  } catch (error) {
    console.error('[categoryApi] getAllCategories error:', error);
    return [];
  }
};

// GET /api/category?id=
export const getCategoryById = async (id) => {
  const response = await instance.get('/category', { params: { id } });
  return normalize(response.data);
};

// POST /api/category
export const createCategory = async (payload) => {
  const response = await instance.post('/category', payload);
  return normalize(response.data);
};

// PUT /api/category/{id}
export const updateCategory = async (id, payload) => {
  const response = await instance.put(`/category/${id}`, payload);
  return normalize(response.data);
};

// DELETE /api/category/{id}
export const deleteCategory = async (id) => {
  const response = await instance.delete(`/category/${id}`);
  return response.data;
};

// PATCH /api/category/{id}/status?isAvailable=true|false (Swagger: query param + Bearer)
export const toggleCategoryStatus = async (id, isAvailable) => {
  const next = Boolean(isAvailable);
  const response = await instance.patch(`/category/${id}/status`, {}, {
    params: { isAvailable: next },
  });
  return response.data;
};
