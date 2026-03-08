import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { getProfile, updateProfile } from '../api/userApi';

const Profile = () => {
  // Tọa độ nhà hàng (Thay đổi theo tọa độ thực tế của nhà hàng bạn)
  const RESTAURANT_COORDS = { lat: 16.0544, lng: 108.2022 }; 

  // State quản lý thông tin người dùng
  const [userInfo, setUserInfo] = useState({
    fullname: '',
    gender: '',
    phone: '',
    email: '',
    oldPassword: '',
    confirmPassword: '',
    address: '',
    avatar: '',
    dob: ''
  });

  const [mapPosition, setMapPosition] = useState({ lat: 15.9753, lng: 108.2524 });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState(null);

  // Khởi tạo Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY" 
  });

  // Hàm tính khoảng cách để kiểm tra điều kiện 20km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính trái đất km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  

  // Fetch profile data từ API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileData = await getProfile();
        
        const initialInfo = {
          fullname: (profileData.fullname && profileData.fullname !== 'string') ? profileData.fullname : '',
          gender: (profileData.gender && profileData.gender !== 'string') ? profileData.gender : '',
          phone: (profileData.phone && profileData.phone !== 'string') ? profileData.phone.replace('+84', '0') : '',
          email: profileData.email || '',
          address: (profileData.address && profileData.address !== 'string') ? profileData.address : '',
          avatar: (profileData.avatar && profileData.avatar !== 'string') ? profileData.avatar : '',
          dob: profileData.dob ? profileData.dob.split('T')[0] : '', 
          oldPassword: '',
          confirmPassword: ''
        };

        setUserInfo(initialInfo);

        if (initialInfo.address) {
          await handleUpdateAddressMap(initialInfo.address);
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
    if (name === 'phone') {
      const phoneValue = value.replace(/[^0-9]/g, '');
      setUserInfo({ ...userInfo, [name]: phoneValue });
    } else {
      setUserInfo({ ...userInfo, [name]: value });
    }
  };

  const validateVietnamesePhone = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      return { valid: false, message: 'Số điện thoại Vietnam phải có 10 chữ số, bắt đầu bằng 0' };
    }
    return { valid: true, message: '' };
  };

  const formatPhoneToInternational = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (/^0\d{9}$/.test(cleanPhone)) {
      return '+84' + cleanPhone.substring(1);
    }
    return cleanPhone;
  };

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setError('');

    if (!userInfo.fullname.trim() || !userInfo.phone.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên và số điện thoại!');
      return;
    }

    const phoneValidation = validateVietnamesePhone(userInfo.phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.message);
      return;
    }

    // Kiểm tra khoảng cách trước khi cho phép lưu (Chặn lỗi 20km sớm)
    if (distanceInfo && distanceInfo > 20) {
      setError(`Không thể lưu! Địa chỉ này cách nhà hàng ${distanceInfo.toFixed(1)}km, vượt quá giới hạn 20km.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const formattedPhone = formatPhoneToInternational(userInfo.phone);
      
      const payload = { ...userInfo, phone: formattedPhone };
      if (!payload.oldPassword) delete payload.oldPassword;
      if (!payload.confirmPassword) delete payload.confirmPassword;

      await updateProfile(payload);
      
      setUserInfo(prev => ({ ...prev, oldPassword: '', confirmPassword: '' }));
      setSuccessMessage('Cập nhật thông tin thành công!');
    } catch (err) {
      setError(err.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setIsSubmitting(false);
    }
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
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        
        setMapPosition({ lat: newLat, lng: newLng });

        // Tính toán khoảng cách và lưu vào state
        const dist = calculateDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, newLat, newLng);
        setDistanceInfo(dist);

        if (dist > 20) {
          setError(`Cảnh báo: Vị trí này cách cửa hàng ${dist.toFixed(1)}km (Vượt giới hạn 20km).`);
        }
      } else {
        alert("Không tìm thấy vị trí chính xác trên bản đồ!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật bản đồ:", error);
    }
  };

  return (
    <div className="Content-Card animate-fade-in">
      <h1 className="Content-Title">Thông Tin Cá Nhân</h1>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#ff6600' }}>
          <p>Đang tải thông tin cá nhân...</p>
        </div>
      )}

      {error && (
        <div className="alert-box error">
          <p><strong>❌ Thông báo:</strong> {error}</p>
        </div>
      )}

      {successMessage && (
        <div className="alert-box success">
          <p><strong>✅ Thành công:</strong> {successMessage}</p>
        </div>
      )}

      {!loading && (
      <form className="Profile-Form" onSubmit={handleSubmitProfile}>
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
                <input type="radio" name="gender" checked={userInfo.gender === 'Nam'} onChange={() => setUserInfo({...userInfo, gender: 'Nam'})} /> 
                Nam
              </label>
              <label>
                <input type="radio" name="gender" checked={userInfo.gender === 'Nữ'} onChange={() => setUserInfo({...userInfo, gender: 'Nữ'})} /> 
                Nữ
              </label>
            </div>
          </div>

          <div className="Form-Group">
            <label>Số Điện Thoại</label>
            <input 
              type="text" 
              name="phone" 
              value={userInfo.phone} 
              onChange={handleInputChange} 
              placeholder="0123456789" 
              maxLength="10"
            />
          </div>

          <div className="Form-Group">
            <label>Mật Khẩu Mới</label>
            <div className="Input-With-Icon">
              <input type={showPass ? "text" : "password"} name="oldPassword" value={userInfo.oldPassword} onChange={handleInputChange} />
              <i className={`fa-solid ${showPass ? 'fa-eye' : 'fa-eye-slash'}`} onClick={() => setShowPass(!showPass)}></i>
            </div>
          </div>

          <div className="Form-Group">
            <label>Địa Chỉ Email</label>
            <input type="email" value={userInfo.email} readOnly style={{ backgroundColor: '#f5f5f5' }} />
          </div>

          <div className="Form-Group">
            <label>Xác Nhận Mật Khẩu</label>
            <div className="Input-With-Icon">
              <input type={showPass ? "text" : "password"} name="confirmPassword" value={userInfo.confirmPassword} onChange={handleInputChange} placeholder="Nhập Xác Nhận Mật Khẩu" />
            </div>
          </div>
        </div>

        <div className="Address-Section" style={{ marginTop: '20px' }}>
          <h2 className="Section-Title">Địa Chỉ Giao Hàng</h2>
          <div className="Form-Group">
            <label>Địa Chỉ Chi Tiết (Dùng để tính khoảng cách giao hàng)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" name="address" value={userInfo.address} onChange={handleInputChange} className="Full-Width" placeholder="VD: 254 Nguyễn Văn Linh, Đà Nẵng" />
                <button type="button" className="Btn-Check-Map" onClick={() => handleUpdateAddressMap()}>Check Map</button>
            </div>
            {distanceInfo !== null && (
                <p style={{ marginTop: '5px', color: distanceInfo > 20 ? 'red' : 'green', fontWeight: 'bold' }}>
                    Khoảng cách đến nhà hàng: {distanceInfo.toFixed(2)} km 
                    {distanceInfo > 20 ? ' (Ngoài phạm vi phục vụ)' : ' (Hợp lệ)'}
                </p>
            )}
          </div>
          
          <div className="Map-Preview" style={{ height: '350px', marginTop: '15px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
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
        </div>

        <div className="Form-Actions" style={{ marginTop: '30px' }}>
          <button 
            type="submit" 
            className="Btn-Submit"
            disabled={isSubmitting}
            style={{ width: '100%', height: '50px', fontSize: '1.1rem' }}
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Lưu Tất Cả Thông Tin'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default Profile;