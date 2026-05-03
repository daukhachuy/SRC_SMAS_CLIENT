import React from 'react';
import axios from 'axios';
import { useAppToast } from '../context/AppToastContext';
import { updateProfile } from '../api/userApi';

const ProfileUpdate = () => {
  const { showToast } = useAppToast();
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

      await updateProfile({ avatar: imageUrl });
      showToast('Cập nhật thành công!', 'success');
      window.dispatchEvent(new Event('smas-user-profile-updated'));
    } catch (error) {
      console.error("Lỗi:", error.response?.data || error.message);
      showToast('Có lỗi xảy ra, kiểm tra Console!', 'error');
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