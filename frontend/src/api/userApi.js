import instance from './axiosInstance';

/**
 * User API calls
 * Endpoints: /api/user/profile
 */

/**
 * Danh sách khách hàng (admin) — GET /api/user/customers-list
 * @returns {Promise<Array>}
 */
export async function getCustomersList() {
  try {
    const response = await instance.get('/user/customers-list');
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    if (raw && Array.isArray(raw.items)) return raw.items;
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch customers list:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load customers list.',
      error
    };
  }
}

/**
 * Bật/tắt trạng thái tài khoản (admin) — PATCH /api/user/update-status-{userid}
 * @param {number} userId
 */
export async function patchUserStatus(userId) {
  try {
    const response = await instance.patch(`/user/update-status-${userId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update user status:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to update account status.',
      error
    };
  }
}

/**
 * Danh sách nhân viên (admin) — GET /api/Staff/staffs-list
 * @returns {Promise<Array>}
 */
export async function getStaffsList() {
  try {
    const response = await instance.get('/Staff/staffs-list');
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    if (raw && Array.isArray(raw.items)) return raw.items;
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch staffs list:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load staffs list.',
      error
    };
  }
}

/**
 * Bật/tắt trạng thái nhân viên — PATCH /api/user/update-status-{userid}
 * (Staff dùng cùng endpoint với Customer)
 * @param {number} userId
 */
export async function patchStaffStatus(userId) {
  try {
    const response = await instance.patch(`/user/update-status-${userId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update staff status:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to update staff status.',
      error
    };
  }
}

/**
 * Cập nhật chi tiết nhân viên (admin) — PUT /api/Staff/admin-update-staff-deatail
 * @param {number} userId
 * @param {object} data  — StaffDetailRequestDTO (khớp Swagger)
 */
export async function updateStaffDetail(userId, data) {
  try {
    const payload = {
      userId,
      fullname: data.fullname,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      salary: data.salary != null ? Number(data.salary) : null,
      position: data.position,
      bankAccountNumber: data.bankAccountNumber || null,
      bankName: data.bankName || null,
      taxId: data.taxId || null,
    };
    const response = await instance.put('/Staff/admin-update-staff-deatail', payload);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update staff detail:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to update staff information.',
      error
    };
  }
}

/**
 * Thêm nhân viên từ user (khách) có sẵn — POST /api/Staff/create-staff-userid
 * Body: CreateNewStaffByUseridResquestDTO
 */
export async function createStaffByUserId(data) {
  try {
    const response = await instance.post('/Staff/create-staff-userid', {
      userId: data.userId,
      salary: Number(data.salary),
      position: data.position,
      bankAccountNumber: data.bankAccountNumber ?? null,
      bankName: data.bankName ?? null,
      taxId: data.taxId,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create staff from user:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to create staff from existing user.',
      error
    };
  }
}

/**
 * Tạo nhân viên mới hoàn toàn — POST /api/Staff/create-staff-new
 * Body: CreateNewStaffRequestDTO (passwordHash: mật khẩu plain theo Swagger minLength 6)
 */
export async function createStaffNew(data) {
  try {
    const response = await instance.post('/Staff/create-staff-new', {
      fullname: data.fullname,
      gender: data.gender ?? null,
      phone: data.phone,
      email: data.email,
      address: data.address ?? null,
      passwordHash: data.passwordHash,
      salary: Number(data.salary),
      position: data.position,
      bankAccountNumber: data.bankAccountNumber ?? null,
      bankName: data.bankName ?? null,
      taxId: data.taxId,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create new staff:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to create new staff.',
      error
    };
  }
}

export async function getProfile() {
  try {
    console.log('👤 Fetching user profile...');
    const response = await instance.get('/user/profile');
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
