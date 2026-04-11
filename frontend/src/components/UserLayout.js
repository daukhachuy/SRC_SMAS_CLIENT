import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProfile } from '../api/userApi';
import '../styles/UserLayout.css';

const UserLayout = () => {
  const navigate = useNavigate();
  
  // Khởi tạo avatar từ localStorage để lưu vĩnh viễn trên trình duyệt máy này
  const [avatar, setAvatar] = useState(
    localStorage.getItem("userAvatar") || "https://www.w3schools.com/howto/img_avatar.png"
  );
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({ fullname: '', email: '' });

  // Fetch user profile từ API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileData = await getProfile();
        setUserProfile({
          fullname: profileData.fullname || '',
          email: profileData.email || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchUserProfile();
  }, []);

  // Cấu hình Cloudinary dựa trên tài khoản của bạn
  const cloudName = "dmzuier4p"; 
  const uploadPreset = "Image_profile"; // Preset Unsigned bạn đã tạo
  const folderName = "image_SEP490";   // Thư mục bạn muốn lưu ảnh vào

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Hiển thị ảnh tạm thời (Blob) để người dùng thấy thay đổi ngay lập tức
    const localUrl = URL.createObjectURL(file);
    setAvatar(localUrl);

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    // CHỈ ĐỊNH THƯ MỤC LƯU TRÊN CLOUDINARY
    formData.append('folder', folderName); 

    try {
      // BƯỚC A: Upload lên Cloudinary vào đúng folder image_SEP490
      const clodinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      
      const imageUrlOnCloud = clodinaryRes.data.secure_url;
      console.log("Ảnh đã lưu vào Cloudinary Folder:", imageUrlOnCloud);

      // BƯỚC B: LƯU VĨNH VIỄN VÀO LOCALSTORAGE
      // Điều này giúp khi F5 hoặc tắt máy mở lại, ảnh vẫn còn đó
      localStorage.setItem("userAvatar", imageUrlOnCloud);
      setAvatar(imageUrlOnCloud); 

      // BƯỚC C: Gửi URL lên Backend C#
      const token = localStorage.getItem("authToken") || localStorage.getItem("token"); 
      
      try {
        await axios.put(
          "https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api/User/profile",
          {
            fullname: "Khánh Hồ",
            avatar: imageUrlOnCloud,
            gender: "Nam", 
            dob: "2026-02-25",
            phone: "0123456789",
            address: "42 Trần Thủ Độ, Đà Nẵng"
          },
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        alert("Cập nhật ảnh đại diện và lưu vào folder thành công!");
      } catch (backendError) {
        // Nếu Backend lỗi, ảnh vẫn đã được lưu ở LocalStorage và Cloudinary
        console.warn("Backend lỗi nhưng ảnh đã được lưu ở máy và Cloud.");
      }

    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Không thể lưu ảnh. Hãy kiểm tra lại cấu hình Unsigned Preset!");
      // Trả lại ảnh cũ nếu upload thất bại
      setAvatar(localStorage.getItem("userAvatar") || "https://www.w3schools.com/howto/img_avatar.png");
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
                  style={{ opacity: loading ? 0.5 : 1, transition: '0.3s', objectFit: 'cover' }}
                />
                
                <label htmlFor="upload-photo" className="Camera-Icon">
                  {loading ? (
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fa-solid fa-camera"></i>
                  )}
                  <input 
                    type="file" 
                    id="upload-photo" 
                    accept="image/*" 
                    style={{display: 'none'}} 
                    onChange={handleAvatarChange}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
            <h2 className="User-Name">{typeof userProfile.fullname === 'string' ? userProfile.fullname : (userProfile.fullname?.toString?.() || 'Đang tải...')}</h2>
            <p className="User-Email">{typeof userProfile.email === 'string' ? userProfile.email : (userProfile.email?.toString?.() || 'Đang tải...')}</p>

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
                <span>Lịch Sử Đơn Hàng</span>
                <i className="fa-solid fa-clock-rotate-left"></i>
              </NavLink>
              
              <hr className="Nav-Divider" />

              <button 
                className="Btn-Logout" 
                onClick={() => {
                  // KHÔNG dùng localStorage.clear() để tránh mất ảnh đại diện đã lưu vĩnh viễn
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  navigate('/auth');
                }}
              >
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