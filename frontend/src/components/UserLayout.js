import React, { useState } from 'react'; // Thêm useState
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/UserLayout.css';

const UserLayout = () => {
  const navigate = useNavigate();
  
  // 1. Khởi tạo state cho Avatar (Sử dụng ảnh mặc định ban đầu)
  const [avatar, setAvatar] = useState("https://www.w3schools.com/howto/img_avatar.png");

  // 2. Hàm xử lý khi chọn file ảnh
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Tạo một đường dẫn tạm thời để hiển thị ảnh ngay lập tức
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
      
      // Gợi ý: Tại đây bạn có thể thêm logic gọi API để upload file lên Server/Cloudinary
      console.log("File đã chọn:", file);
    }
  };

  return (
    <div className="Profile-App">
      <Header />
      <main className="Profile-Container">
        <div className="Profile-Layout">
          {/* SIDEBAR */}
          <aside className="Profile-Sidebar">
            <div className="Avatar-Wrapper">
              <div className="Avatar-Relative">
                {/* 3. Hiển thị ảnh từ state */}
                <img src={avatar} alt="Avatar" className="User-Img" />
                
                <label htmlFor="upload-photo" className="Camera-Icon">
                  <i className="fa-solid fa-camera"></i>
                  {/* 4. Thêm sự kiện onChange */}
                  <input 
                    type="file" 
                    id="upload-photo" 
                    accept="image/*" // Chỉ chấp nhận file ảnh
                    style={{display: 'none'}} 
                    onChange={handleAvatarChange}
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