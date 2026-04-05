import instance from './axiosInstance';

/**
 * User API calls
 * Endpoints: /api/user/profile
 */

/**
 * Lấy profile khách hàng theo contact (SĐT/Email)
 * Nếu không truyền contact sẽ lấy profile của user hiện tại
 */
export async function getProfile(contact) {
  try {
    console.log('👤 Fetching user profile...');
    let response;
    if (contact) {
      response = await instance.get('/user/profile', { params: { contact } });
    } else {
      response = await instance.get('/user/profile');
    }
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
      avatar: profileData.avatar,
      ...(profileData.bankAccount !== undefined && { bankAccount: profileData.bankAccount }),
      ...(profileData.bankName !== undefined && { bankName: profileData.bankName })
    };

    // Đổi mật khẩu: gửi oldPassword + newPassword nếu có
    if (profileData.oldPassword !== undefined) updateData.oldPassword = profileData.oldPassword;
    if (profileData.confirmPassword && profileData.confirmPassword.trim()) {
      updateData.newPassword = profileData.confirmPassword;
    }

    const response = await instance.put('/user/profile', updateData);
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

/**
 * Change password - gọi PUT /api/user/profile với newPassword
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    console.log('🔐 Changing password...');
    const response = await instance.put('/user/profile', {
      currentPassword,
      newPassword
    });
    console.log('✅ Password changed successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to change password:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to change password.',
      error
    };
  }
}
