import instance from './axiosInstance';

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
      error,
    };
  }
}

/**
 * Cập nhật profile khách hàng — PUT /api/user/profile
 * Body: UserProfileUpdateDTO (theo Swagger)
 * Chỉ gửi các trường có giá trị (tránh gửi undefined/null)
 */
export async function updateProfile(profileData) {
  try {
    console.log('📝 Updating user profile...');

    // Build updateData với chỉ những trường có giá trị
    const updateData = {};

    // Trường bắt buộc/có thể cập nhật
    if (profileData.fullname !== undefined && profileData.fullname !== null && profileData.fullname.trim() !== '') {
      updateData.fullname = profileData.fullname.trim();
    }
    if (profileData.gender !== undefined && profileData.gender !== null) {
      updateData.gender = profileData.gender;
    }
    if (profileData.dob !== undefined && profileData.dob !== null && profileData.dob !== '') {
      updateData.dob = profileData.dob;
    }
    if (profileData.phone !== undefined && profileData.phone !== null && profileData.phone.trim() !== '') {
      updateData.phone = profileData.phone.trim();
    }
    if (profileData.address !== undefined && profileData.address !== null && profileData.address.trim() !== '') {
      updateData.address = profileData.address.trim();
    }

    // Trường tùy chọn (chỉ gửi nếu có giá trị)
    if (profileData.avatar !== undefined && profileData.avatar !== null && profileData.avatar.trim() !== '') {
      updateData.avatar = profileData.avatar.trim();
    }
    if (profileData.bankAccount !== undefined && profileData.bankAccount !== null && profileData.bankAccount.trim() !== '') {
      updateData.bankAccount = profileData.bankAccount.trim();
    }
    if (profileData.bankName !== undefined && profileData.bankName !== null && profileData.bankName.trim() !== '') {
      updateData.bankName = profileData.bankName.trim();
    }

    // Trường mật khẩu (nếu có)
    if (profileData.oldPassword !== undefined && profileData.oldPassword !== null && profileData.oldPassword.trim() !== '') {
      updateData.oldPassword = profileData.oldPassword.trim();
    }
    if (profileData.newPassword !== undefined && profileData.newPassword !== null && profileData.newPassword.trim() !== '') {
      updateData.newPassword = profileData.newPassword.trim();
    }

    console.log('📤 Sending update data:', updateData);
    const response = await instance.put('/user/profile', updateData);
    console.log('✅ User profile updated');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update user profile:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to update user profile.',
      error,
    };
  }
}

/**
 * Đổi mật khẩu — PUT /api/user/profile với currentPassword + newPassword
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    console.log('🔐 Changing password...');
    const response = await instance.put('/user/profile', {
      currentPassword,
      newPassword,
    });
    console.log('✅ Password changed successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to change password:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to change password.',
      error,
    };
  }
}

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
      error,
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
      error,
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
      error,
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
      error,
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
      error,
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
      error,
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
      error,
    };
  }
}

/**
 * Lấy danh sách địa chỉ giao hàng của khách hàng — GET /api/user/addresses
 * @returns {Promise<Array>}
 */
export async function getCustomerAddresses() {
  try {
    console.log('📍 Fetching customer addresses...');
    const response = await instance.get('/user/addresses');
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    if (raw && Array.isArray(raw.items)) return raw.items;
    if (raw && raw.$values) return raw.$values;
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch customer addresses:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to load addresses.',
      error,
    };
  }
}

/**
 * Thêm địa chỉ giao hàng mới — POST /api/user/addresses
 * @param {object} data - { street, district, city, addressType, memorableName, phone, setAsDefault }
 */
export async function addCustomerAddress(data) {
  try {
    console.log('📍 Adding customer address...', data);
    const response = await instance.post('/user/addresses', {
      street: data.street,
      district: data.district,
      city: data.city || 'Hồ Chí Minh',
      addressType: data.addressType,
      memorableName: data.memorableName,
      phone: data.phone,
      setAsDefault: data.setAsDefault,
    });
    console.log('✅ Customer address added:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to add customer address:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to add address.',
      error,
    };
  }
}

/**
 * Cập nhật địa chỉ giao hàng — PUT /api/user/addresses/{id}
 * @param {number} addressId
 * @param {object} data - { street, district, city, addressType, memorableName, phone, setAsDefault }
 */
export async function updateCustomerAddress(addressId, data) {
  try {
    console.log('📍 Updating customer address:', addressId, data);
    const response = await instance.put(`/user/addresses/${addressId}`, {
      street: data.street,
      district: data.district,
      city: data.city || 'Hồ Chí Minh',
      addressType: data.addressType,
      memorableName: data.memorableName,
      phone: data.phone,
      setAsDefault: data.setAsDefault,
    });
    console.log('✅ Customer address updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update customer address:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to update address.',
      error,
    };
  }
}

/**
 * Xóa địa chỉ giao hàng — DELETE /api/user/addresses/{id}
 * @param {number} addressId
 */
export async function deleteCustomerAddress(addressId) {
  try {
    console.log('📍 Deleting customer address:', addressId);
    const response = await instance.delete(`/user/addresses/${addressId}`);
    console.log('✅ Customer address deleted');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to delete customer address:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to delete address.',
      error,
    };
  }
}

/**
 * Đặt địa chỉ mặc định — PATCH /api/user/addresses/{id}/default
 * @param {number} addressId
 */
export async function setDefaultCustomerAddress(addressId) {
  try {
    console.log('📍 Setting default address:', addressId);
    const response = await instance.patch(`/user/addresses/${addressId}/default`);
    console.log('✅ Default address set');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to set default address:', error.response?.data || error.message);
    throw {
      status: error.response?.status,
      message: error.response?.data?.message || 'Failed to set default address.',
      error,
    };
  }
}
