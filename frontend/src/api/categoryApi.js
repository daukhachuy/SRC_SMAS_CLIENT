import axios from "axios";

export const getAllCategories = async () => {
  try {
    const response = await axios.get(
      "https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api/category/lists"
    );

    console.log("🔥 CATEGORY RESPONSE:", response.data);

    return response.data; // API này trả về array trực tiếp

  } catch (error) {
    console.error("❌ Lỗi gọi API Category:", error);
    return [];
  }
};