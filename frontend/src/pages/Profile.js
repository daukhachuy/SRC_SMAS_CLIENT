import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { getProfile } from '../api/userApi';

const Profile = () => {
  // State quản lý thông tin người dùng
  const [userInfo, setUserInfo] = useState({
    fullname: '',
    gender: '',
    phone: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    address: '',
    avatar: '',
    dob: ''
  });

  const [mapPosition, setMapPosition] = useState({ lat: 15.9753, lng: 108.2524 });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Khởi tạo Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyABC123" 
  });

  // Fetch profile data từ API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileData = await getProfile();
        
        // Map API response vào state, convert "string" literal thành empty string
        setUserInfo({
          fullname: (profileData.fullname && profileData.fullname !== 'string') ? profileData.fullname : '',
          gender: (profileData.gender && profileData.gender !== 'string') ? profileData.gender : '',
          phone: (profileData.phone && profileData.phone !== 'string') ? profileData.phone : '',
          email: profileData.email || '',
          address: (profileData.address && profileData.address !== 'string') ? profileData.address : '',
          avatar: (profileData.avatar && profileData.avatar !== 'string') ? profileData.avatar : '',
          dob: profileData.dob || '',
          oldPassword: '',
          newPassword: ''
        });

        // Update map position nếu có address hợp lệ
        if (profileData.address && profileData.address !== 'string') {
          handleUpdateAddressMap(profileData.address);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Không thể tải thông tin cá nhân. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  const handleUpdateAddressMap = async (addressToUpdate = null) => {
    const addressValue = addressToUpdate || userInfo.address;
    
    if (!addressValue) {
      alert("Vui lòng nhập địa chỉ!");
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressValue)}`
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
      alert("Lỗi cập nhật bản đồ. Vui lòng thử lại.");
    }
  };

  return (
    /* Thêm class animate-fade-in để tạo hiệu ứng mượt khi chuyển từ MyOrders sang */
    <div className="Content-Card animate-fade-in">
      <h1 className="Content-Title">Thông Tin Cá Nhân</h1>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#ff6600' }}>
          <p>Đang tải thông tin cá nhân...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          <p>{error}</p>
        </div>
      )}

      {!loading && (
      <form className="Profile-Form" onSubmit={(e) => e.preventDefault()}>
        <div className="Form-Grid">
          <div className="Form-Group">
            <label>Họ Và Tên</label>
            <input type="text" name="fullname" value={userInfo.fullname} onChange={handleInputChange} />
          </div>

          <div className="Form-Group">
            <label>Ngày Sinh</label>
            <input type="date" name="dob" value={userInfo.dob} onChange={handleInputChange} />
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
              <input type="text" name="phone" value={userInfo.phone} onChange={handleInputChange} placeholder="Nhập số điện thoại" />
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
      )}

      <div className="Address-Section">
        <h2 className="Section-Title">Địa Chỉ Giao Hàng</h2>
        <div className="Form-Group">
          <label>Địa Chỉ Chi Tiết</label>
          <input type="text" name="address" value={userInfo.address} onChange={handleInputChange} className="Full-Width" placeholder="Nhập địa chỉ giao hàng" />
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