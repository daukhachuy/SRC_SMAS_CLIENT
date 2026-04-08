import instance from './axiosInstance';

/** GET /api/blogs/lists — Bearer (Swagger) */
export const blogAPI = {
  getBlogLists: async () => {
    const { data } = await instance.get('/blogs/lists');
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  },

  /** GET /api/blogs?id= — chi tiết (Swagger, envelope message + data) */
  getBlogById: async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID blog không hợp lệ');
    }
    const { data } = await instance.get('/blogs', { params: { id: numId } });
    if (data && typeof data === 'object' && data.data != null) {
      return data.data;
    }
    return data;
  },

  /** POST /api/blogs — tạo bài (Swagger BlogCreateDto) */
  createBlog: async (payload) => {
    const { data } = await instance.post('/blogs', payload);
    return data;
  },

  /** PUT /api/blogs/{id} — cập nhật (Swagger BlogUpdateDto) */
  updateBlog: async (id, payload) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID blog không hợp lệ');
    }
    const { data } = await instance.put(`/blogs/${numId}`, payload);
    return data;
  },

  /** DELETE /api/blogs/{id} (Swagger) */
  deleteBlog: async (id) => {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error('ID blog không hợp lệ');
    }
    const { data } = await instance.delete(`/blogs/${numId}`);
    return data;
  },
};
