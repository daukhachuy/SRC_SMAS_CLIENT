import React from 'react';
import axios from 'axios';

const ProfileUpdate = () => {
  const cloudName = "dgjkqvbhm";
  const uploadPreset = "YOUR_UNSIGNED_PRESET"; // Thay bằng preset bạn đã tạo

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      // 1. Upload lên Cloudinary
      const clodinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      const imageUrl = clodinaryRes.data.secure_url;
      console.log("Link ảnh Cloudinary:", imageUrl);

      // 2. Gửi URL về Backend C#
      const token = localStorage.getItem("authToken") || localStorage.getItem("token"); 
      await axios.put(
        "https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api/User/profile",
        {
          fullname: "Tên của bạn", // Bạn nên lấy từ state hoặc input
          avatar: imageUrl,
          gender: "Male",
          dob: "2000-01-01",
          phone: "0123456789",
          address: "Vietnam"
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      alert("Cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi:", error.response?.data || error.message);
      alert("Có lỗi xảy ra, kiểm tra Console!");
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>Thay đổi ảnh đại diện</h3>
      <input type="file" accept="image/*" onChange={handleFileUpload} />
    </div>
  );
};

export default ProfileUpdate;