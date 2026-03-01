import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Đảm bảo đã npm install axios
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProfile } from '../api/userApi';
import '../styles/UserLayout.css';

const UserLayout = () => {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState("https://www.w3schools.com/howto/img_avatar.png");
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({
    fullname: '',
    email: ''
  });

  // Thông tin Cloudinary của bạn
  const cloudName = "dgjkqvbhm";
  const uploadPreset = "YOUR_UNSIGNED_PRESET"; // BẮT BUỘC: Thay bằng tên preset Unsigned bạn tạo trên Cloudinary

  // Fetch user profile từ API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileData = await getProfile();
        setUserProfile({
          fullname: profileData.fullname || '',
          email: profileData.email || ''
        });
        
        // Cập nhật avatar nếu có
        if (profileData.avatar) {
          setAvatar(profileData.avatar);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

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
      const token = localStorage.getItem("authToken"); // Đảm bảo bạn lưu token khi Login
      
      // Chú ý: API này yêu cầu JSON full profile nên bạn cần gửi kèm các field khác 
      // (Hoặc backend của bạn chỉ cần gửi mỗi avatar thì bỏ các field kia đi)
      await axios.put(
        "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api/User/profile",
        {
          fullname: userProfile.fullname || '',
          avatar: imageUrlOnCloud,
          gender: null, 
          dob: null,
          phone: null,
          address: null
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
            <h2 className="User-Name">{userProfile.fullname || 'Người Dùng'}</h2>
            <p className="User-Email">{userProfile.email || ''}</p>

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

              <button 
                className="Btn-Logout" 
                onClick={() => {
                  // Clear authentication data
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('user');
                  localStorage.removeItem('rememberMe');
                  console.log('✅ Đã đăng xuất');
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