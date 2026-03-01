import instance from './axiosInstance';

/**
 * User API calls
 * Endpoints: /api/User/profile
 */

export async function getProfile() {
  try {
    console.log('👤 Fetching user profile...');
    const response = await instance.get('/User/profile');
    console.log('✅ User profile loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch user profile:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load user profile.',
      error
    };
  }
}

export async function updateProfile(profileData) {
  try {
    console.log('📝 Updating user profile...');
    const updateData = {
      fullname: profileData.fullname,
      gender: profileData.gender,
      dob: profileData.dob,
      phone: profileData.phone,
      address: profileData.address,
      avatar: profileData.avatar
    };

    // Thêm newPassword nếu có (confirmPassword được gửi như newPassword)
    if (profileData.confirmPassword && profileData.confirmPassword.trim()) {
      updateData.newPassword = profileData.confirmPassword;
    }

    const response = await instance.put('/User/profile', updateData);
    console.log('✅ User profile updated');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update user profile:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to update user profile.',
      error
    };
  }
}
