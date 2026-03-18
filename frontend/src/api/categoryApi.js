import instance from './axiosInstance';

export const getAllCategories = async () => {
  try {
    const response = await instance.get('/category/lists');
    console.log("🔥 CATEGORY RESPONSE:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi gọi API Category:", error);
    return [];
  }
};
