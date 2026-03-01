import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { getProfile, updateProfile } from '../api/userApi';

const Profile = () => {
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
          confirmPassword: ''
        });

        // Update map position nếu có address hợp lệ
        if (profileData.address && profileData.address !== 'string') {
          try {
            await handleUpdateAddressMap(profileData.address);
          } catch (mapErr) {
            console.warn('Map update failed:', mapErr);
            // Không dừng nếu map update thất bại
          }
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
    // Chỉ cho phép số cho trường điện thoại
    if (name === 'phone') {
      const phoneValue = value.replace(/[^0-9]/g, '');
      setUserInfo({ ...userInfo, [name]: phoneValue });
    } else {
      setUserInfo({ ...userInfo, [name]: value });
    }
  };

  // Validate số điện thoại Việt Nam
  const validateVietnamesePhone = (phone) => {
    // Loại bỏ toàn bộ ký tự không phải số
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Vietnam phone must have 10 digits starting with 0
    // Or be valid format: 0xxxxxxxxx (10 digits)
    if (!/^0\d{9}$/.test(cleanPhone)) {
      return { valid: false, message: 'Số điện thoại Vietnam phải có 10 chữ số, bắt đầu bằng 0 (ví dụ: 0123456789)' };
    }
    return { valid: true, message: '' };
  };

  // Format số điện thoại: bỏ số 0 đầu, thêm +84
  const formatPhoneToInternational = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (/^0\d{9}$/.test(cleanPhone)) {
      return '+84' + cleanPhone.substring(1); // Bỏ số 0 đầu, thêm +84
    }
    return cleanPhone;
  };

  // Xóa thông báo sau 5 giây
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
    
    // Reset messages
    setSuccessMessage('');
    setError('');

    // Validation
    if (!userInfo.fullname || !userInfo.fullname.trim()) {
      setError('Vui lòng nhập họ và tên!');
      return;
    }

    if (!userInfo.phone || !userInfo.phone.trim()) {
      setError('Vui lòng nhập số điện thoại!');
      return;
    }

    // Validate số điện thoại Việt Nam
    const phoneValidation = validateVietnamesePhone(userInfo.phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.message);
      return;
    }

    // Nếu có nhập mật khẩu cũ hoặc xác nhận mật khẩu
    const hasPasswordChange = userInfo.oldPassword && userInfo.oldPassword.trim();
    const hasConfirmPassword = userInfo.confirmPassword && userInfo.confirmPassword.trim();
    
    if (hasPasswordChange || hasConfirmPassword) {
      if (!userInfo.oldPassword || !userInfo.oldPassword.trim()) {
        setError('Vui lòng nhập mật khẩu cũ!');
        return;
      }
      
      if (!userInfo.confirmPassword || !userInfo.confirmPassword.trim()) {
        setError('Vui lòng nhập xác nhận mật khẩu!');
        return;
      }

      if (userInfo.confirmPassword.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự!');
        return;
      }

      if (userInfo.confirmPassword === userInfo.oldPassword) {
        setError('Mật khẩu mới phải khác mật khẩu cũ!');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // Format số điện thoại: bỏ số 0 đầu, thêm +84
      const formattedPhone = formatPhoneToInternational(userInfo.phone);
      
      const result = await updateProfile({
        ...userInfo,
        phone: formattedPhone
      });
      console.log('Profile updated:', result);
      
      // Reset password fields
      setUserInfo(prev => ({
        ...prev,
        oldPassword: '',
        confirmPassword: ''
      }));
      
      setSuccessMessage('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.');
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
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', borderLeft: '4px solid #721c24' }}>
          <p><strong>❌ Lỗi:</strong> {error}</p>
        </div>
      )}

      {successMessage && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', borderLeft: '4px solid #155724' }}>
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
            <label>Số Điện Thoại (Vietnam +84)</label>
            <input 
              type="text" 
              name="phone" 
              value={userInfo.phone} 
              onChange={handleInputChange} 
              placeholder="0123456789" 
              maxLength="10"
            />
            <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
              Định dạng: 10 chữ số bắt đầu bằng 0 (ví dụ: 0123456789)
            </small>
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
            <input type="email" value={userInfo.email} readOnly />
          </div>

          <div className="Form-Group">
            <label>Xác Nhận Mật Khẩu</label>
            <div className="Input-With-Icon">
              <input type={showPass ? "text" : "password"} name="confirmPassword" value={userInfo.confirmPassword} onChange={handleInputChange} placeholder="Nhập Xác Nhận Mật Khẩu" />
            </div>
          </div>
        </div>

        <div className="Form-Actions">
          <button 
            type="submit" 
            className="Btn-Submit"
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Thay Đổi'}
          </button>
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