import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Đảm bảo đã npm install axios
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/UserLayout.css';

const UserLayout = () => {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState("https://www.w3schools.com/howto/img_avatar.png");
  const [loading, setLoading] = useState(false);

  // Thông tin Cloudinary của bạn
  const cloudName = "dgjkqvbhm";
  const uploadPreset = "YOUR_UNSIGNED_PRESET"; // BẮT BUỘC: Thay bằng tên preset Unsigned bạn tạo trên Cloudinary

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Hiển thị ảnh tạm thời để UX mượt mà
    const localUrl = URL.createObjectURL(file);
    setAvatar(localUrl);

    // 2. Bắt đầu quá trình upload
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      // BƯỚC A: Upload lên Cloudinary
      const clodinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      const imageUrlOnCloud = clodinaryRes.data.secure_url;
      console.log("Link ảnh từ Cloudinary:", imageUrlOnCloud);

      // BƯỚC B: Gửi URL này lên Backend C#
      const token = localStorage.getItem("token"); // Đảm bảo bạn lưu token khi Login
      
      // Chú ý: API này yêu cầu JSON full profile nên bạn cần gửi kèm các field khác 
      // (Hoặc backend của bạn chỉ cần gửi mỗi avatar thì bỏ các field kia đi)
      await axios.put(
        "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api/User/profile",
        {
          fullname: "Khánh Hồ", // Có thể lấy từ state nếu có
          avatar: imageUrlOnCloud,
          gender: "string", 
          dob: "2026-02-25",
          phone: "string",
          address: "string"
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setAvatar(imageUrlOnCloud); // Cập nhật link chính thức
      alert("Cập nhật ảnh đại diện thành công!");

    } catch (error) {
      console.error("Lỗi quá trình upload/update:", error);
      alert("Không thể lưu ảnh. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Profile-App">
      <Header />
      <main className="Profile-Container">
        <div className="Profile-Layout">
          <aside className="Profile-Sidebar">
            <div className="Avatar-Wrapper">
              <div className="Avatar-Relative">
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="User-Img" 
                  style={{ opacity: loading ? 0.5 : 1 }} // Làm mờ khi đang load
                />
                
                <label htmlFor="upload-photo" className="Camera-Icon">
                  {loading ? (
                    <i className="fa-solid fa-spinner fa-spin"></i> // Hiệu ứng xoay khi load
                  ) : (
                    <i className="fa-solid fa-camera"></i>
                  )}
                  <input 
                    type="file" 
                    id="upload-photo" 
                    accept="image/*" 
                    style={{display: 'none'}} 
                    onChange={handleAvatarChange}
                    disabled={loading} // Khóa input khi đang upload
                  />
                </label>
              </div>
            </div>
            <h2 className="User-Name">Khánh Hồ</h2>
            <p className="User-Email">Khanhho123@gmail.com</p>

            <nav className="Profile-Nav">
              <NavLink to="/profile" className={({ isActive }) => isActive ? "Nav-Item Active" : "Nav-Item"}>
                <span>Thông Tin Cá Nhân</span>
                <i className="fa-solid fa-user-gear"></i>
              </NavLink>
              
              <NavLink to="/my-orders" className={({ isActive }) => isActive ? "Nav-Item Active" : "Nav-Item"}>
                <span>Đơn Hàng Của Tôi</span>
                <i className="fa-solid fa-receipt"></i>
              </NavLink>

              <NavLink to="/order-history" className={({ isActive }) => isActive ? "Nav-Item Active" : "Nav-Item"}>
                <span>Lịch Sử Giao Dịch</span>
                <i className="fa-solid fa-clock-rotate-left"></i>
              </NavLink>
              
              <hr className="Nav-Divider" />

              <button className="Btn-Logout" onClick={() => navigate('/auth')}>
                <i className="fa-solid fa-right-from-bracket"></i> Đăng Xuất
              </button>
            </nav>
          </aside>

          <section className="Profile-Main-Content">
            <div className="Content-Fixed-Height">
               <Outlet /> 
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;