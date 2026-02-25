import React, { useState } from 'react';
import '../styles/Profile.css';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const Profile = () => {
  // State quản lý thông tin người dùng
  const [userInfo, setUserInfo] = useState({
    fullName: 'Khánh Hồ',
    gender: 'Nam',
    phone: '0123456789',
    email: 'Khanhho123@Gmail.Com',
    oldPassword: 'password123',
    newPassword: '',
    taxCode: '',
    address: '42 Trần Thủ Độ, Phường Điện Bàn Đông, Đà Nẵng'
  });

  const [mapPosition, setMapPosition] = useState({ lat: 15.9753, lng: 108.2524 });
  const [showPass, setShowPass] = useState(false);

  // Khởi tạo Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY" 
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  const handleUpdateAddressMap = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userInfo.address)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setMapPosition({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      } else {
        alert("Không tìm thấy vị trí chính xác!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật bản đồ:", error);
    }
  };

  return (
    /* Thêm class animate-fade-in để tạo hiệu ứng mượt khi chuyển từ MyOrders sang */
    <div className="Content-Card animate-fade-in">
      <h1 className="Content-Title">Thông Tin Cá Nhân</h1>
      
      <form className="Profile-Form" onSubmit={(e) => e.preventDefault()}>
        <div className="Form-Grid">
          <div className="Form-Group">
            <label>Họ Và Tên</label>
            <input type="text" name="fullName" value={userInfo.fullName} onChange={handleInputChange} />
          </div>

          <div className="Form-Group">
            <label>Giới Tính :</label>
            <div className="Radio-Group">
              <label>
                <input type="radio" checked={userInfo.gender === 'Nam'} onChange={() => setUserInfo({...userInfo, gender: 'Nam'})} /> 
                Nam
              </label>
              <label>
                <input type="radio" checked={userInfo.gender === 'Nữ'} onChange={() => setUserInfo({...userInfo, gender: 'Nữ'})} /> 
                Nữ
              </label>
            </div>
          </div>

          <div className="Form-Group">
            <label>Số Điện Thoại</label>
            <div className="Input-With-Status">
              <input type="text" value={userInfo.phone} readOnly />
              <span className="Status-Verified">Đã Xác Minh</span>
            </div>
          </div>

          <div className="Form-Group">
            <label>Địa Chỉ Email</label>
            <div className="Input-With-Status">
              <input type="email" value={userInfo.email} readOnly />
              <span className="Status-Verified">Đã Xác Minh</span>
            </div>
          </div>

          <div className="Form-Group">
            <label>Mật Khẩu Cũ</label>
            <div className="Input-With-Icon">
              <input type={showPass ? "text" : "password"} name="oldPassword" value={userInfo.oldPassword} onChange={handleInputChange} />
              <i className={`fa-solid ${showPass ? 'fa-eye' : 'fa-eye-slash'}`} onClick={() => setShowPass(!showPass)}></i>
            </div>
          </div>

          <div className="Form-Group">
            <label>Mã Số Thuế</label>
            <input type="text" name="taxCode" value={userInfo.taxCode} onChange={handleInputChange} placeholder="Nhập Mã Số Thuế" />
          </div>

          <div className="Form-Group">
            <label>Mật Khẩu Mới</label>
            <div className="Input-With-Icon">
              <input type={showPass ? "text" : "password"} name="newPassword" value={userInfo.newPassword} onChange={handleInputChange} placeholder="Nhập Mật Khẩu Mới" />
            </div>
          </div>
        </div>

        <div className="Form-Actions">
          <button type="submit" className="Btn-Submit">Thay Đổi</button>
        </div>
      </form>

      <div className="Address-Section">
        <h2 className="Section-Title">Địa Chỉ Giao Hàng</h2>
        <div className="Form-Group">
          <label>Địa Chỉ Chi Tiết</label>
          <input type="text" name="address" value={userInfo.address} onChange={handleInputChange} className="Full-Width" />
        </div>
        
        <div className="Map-Preview">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapPosition}
              zoom={15}
            >
              <MarkerF position={mapPosition} />
            </GoogleMap>
          ) : <div>Đang tải bản đồ...</div>}
        </div>

        <div className="Form-Actions">
          <button type="button" className="Btn-Submit" onClick={handleUpdateAddressMap}>Cập Nhật Địa Chỉ & Bản Đồ</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;