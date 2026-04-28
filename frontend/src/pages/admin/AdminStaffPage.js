import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, X, Phone, Mail, MapPin, FileText, BarChart3, Calendar, Clock, Lock, Eye } from 'lucide-react';
import '../../styles/AdminStaff.css';
import {
  getCustomersList,
  patchUserStatus,
  getStaffsList,
  patchStaffStatus,
  updateStaffDetail,
  createStaffByUserId,
  createStaffNew,
} from '../../api/userApi';
import { useAdminToast } from '../../context/AdminToastContext';

const formatCustomerCreatedAt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const mapCustomerDtoToRow = (dto) => {
  const userId = dto.userId ?? dto.id;
  const isLocked = dto.isDeleted === true;
  return {
    id: userId,
    customerId: userId != null ? `CUS-${String(userId).padStart(4, '0')}` : '—',
    name: dto.fullname || '—',
    phone: dto.phone || '—',
    email: dto.email || '—',
    address: dto.address || '',
    created: formatCustomerCreatedAt(dto.createdAt),
    lastUpdated: '—',
    active: !isLocked,
    isVip: false,
    ordersPlaced: 0,
    ordersCanceled: 0,
    noShow: 0,
    totalSpending: 0,
  };
};

const POSITION_OPTIONS = [
  { value: 'Manager', label: 'Quản lý (Manager)' },
  { value: 'Kitchen', label: 'Bếp (Kitchen)' },
  { value: 'Waiter', label: 'Phục vụ (Waiter)' },
];

const getPositionLabel = (positionValue) => {
  // Normalize: hỗ trợ cả 'manager', 'Manager', 'MANAGER', v.v.
  const normalized = (positionValue || '').toLowerCase().trim();
  const opt = POSITION_OPTIONS.find(
    (o) => o.value.toLowerCase() === normalized || o.label.toLowerCase().includes(normalized)
  );
  return opt ? opt.label : positionValue || '—';
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const mapStaffDtoToRow = (dto) => {
  const userId = dto.userId ?? dto.id;
  return {
    id: userId,
    name: dto.fullname || '—',
    email: dto.email || '—',
    phone: dto.phone || '—',
    address: dto.address || '',
    startDate: formatDate(dto.hireDate),
    position: dto.position || '',
    positionLabel: getPositionLabel(dto.position),
    active: dto.isDeleted !== true,
    salary: 0,
    taxId: '',
    bankName: '',
    bankAccount: '',
  };
};

const getInitials = (name) => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const TABS = [
  { key: 'customers', label: 'Khách hàng' },
  { key: 'staff', label: 'Nhân viên' },
];

const defaultStaffForm = () => ({
  name: '', email: '', phone: '', address: '', password: '',
  gender: 'Male',
  position: '', salary: '', taxId: '', bankName: '', bankAccount: '',
});

const parseSalaryNumber = (s) => {
  const n = parseInt(String(s).replace(/,/g, '').trim(), 10);
  return Number.isFinite(n) ? n : NaN;
};

const AdminStaffPage = () => {
  /* ── Toast notification ── */
  const { showToast } = useAdminToast();

  const [tab, setTab] = useState('customers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editStaffForm, setEditStaffForm] = useState(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [addStaffMode, setAddStaffMode] = useState('from_customer');
  const [addStaffForm, setAddStaffForm] = useState(defaultStaffForm);
  const [addStaffCustomerSearch, setAddStaffCustomerSearch] = useState('');
  const [addStaffSelectedUserId, setAddStaffSelectedUserId] = useState(null);
  const [addStaffSubmitting, setAddStaffSubmitting] = useState(false);
  const [customerToggleBusyId, setCustomerToggleBusyId] = useState(null);
  const [staffToggleBusyId, setStaffToggleBusyId] = useState(null);

  /* ── Pagination (pageSize = 5) ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageStaff, setCurrentPageStaff] = useState(1);
  const pageSize = 5;

  const loadCustomers = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    const syncSelectedUserId = options.syncSelectedUserId;

    if (!silent) {
      setCustomersLoading(true);
      setCustomersError(null);
    }
    try {
      const list = await getCustomersList();
      const rows = (Array.isArray(list) ? list : []).map(mapCustomerDtoToRow);
      setCustomers(rows);
      if (syncSelectedUserId != null) {
        setSelectedCustomer((prev) => {
          if (!prev || prev.id !== syncSelectedUserId) return prev;
          return rows.find((r) => r.id === syncSelectedUserId) || prev;
        });
      }
      if (!silent) setCustomersError(null);
    } catch (err) {
      if (!silent) {
        setCustomersError(err?.message || 'Không tải được danh sách khách hàng.');
        setCustomers([]);
      } else {
        throw err;
      }
    } finally {
      if (!silent) setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const toggleCustomer = async (id) => {
    if (id == null || customerToggleBusyId != null) return;
    setCustomerToggleBusyId(id);
    try {
      await patchUserStatus(id);
      showToast('Cập nhật trạng thái tài khoản thành công.', 'success');
      await loadCustomers({ silent: true, syncSelectedUserId: id });
    } catch (err) {
      showToast(err?.message || 'Không cập nhật được trạng thái tài khoản.', 'error');
    } finally {
      setCustomerToggleBusyId(null);
    }
  };

  const loadStaffs = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    const syncSelectedId = options.syncSelectedId;

    if (!silent) {
      setStaffLoading(true);
      setStaffError(null);
    }
    try {
      const list = await getStaffsList();
      const rows = (Array.isArray(list) ? list : []).map(mapStaffDtoToRow);
      setStaff(rows);
      if (syncSelectedId != null) {
        setSelectedStaff((prev) => {
          if (!prev || prev.id !== syncSelectedId) return prev;
          return rows.find((r) => r.id === syncSelectedId) || prev;
        });
      }
      if (!silent) setStaffError(null);
    } catch (err) {
      if (!silent) {
        setStaffError(err?.message || 'Không tải được danh sách nhân viên.');
        setStaff([]);
      } else {
        throw err;
      }
    } finally {
      if (!silent) setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaffs();
  }, [loadStaffs]);

  const closeAddStaffModal = useCallback(() => {
    setAddStaffOpen(false);
    setAddStaffForm(defaultStaffForm());
    setAddStaffCustomerSearch('');
    setAddStaffSelectedUserId(null);
    setAddStaffSubmitting(false);
  }, []);

  const toggleStaff = async (id) => {
    if (id == null || staffToggleBusyId != null) return;
    setStaffToggleBusyId(id);
    try {
      await patchStaffStatus(id);
      showToast('Cập nhật trạng thái nhân viên thành công.', 'success');
      await loadStaffs({ silent: true, syncSelectedId: id });
    } catch (err) {
      showToast(err?.message || 'Không cập nhật được trạng thái nhân viên.', 'error');
    } finally {
      setStaffToggleBusyId(null);
    }
  };

  const openStaffDetail = (row) => {
    setSelectedStaff(row);
    const opt = POSITION_OPTIONS.find((o) => o.value === row.position);
    setEditStaffForm({
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address || '',
      password: '',
      position: row.position,
      salary: row.salary ? String(row.salary).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '',
      taxId: row.taxId || '',
      bankName: row.bankName || '',
      bankAccount: row.bankAccount || '',
    });
  };

  const handleSaveStaffInfo = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !editStaffForm) return;
    const salaryNum = parseInt(String(editStaffForm.salary).replace(/,/g, ''), 10) || 0;
    try {
      await updateStaffDetail(selectedStaff.id, {
        fullname: editStaffForm.name,
        phone: editStaffForm.phone,
        email: editStaffForm.email,
        address: editStaffForm.address,
        position: editStaffForm.position,
        salary: salaryNum,
        taxId: editStaffForm.taxId,
        bankName: editStaffForm.bankName,
        bankAccountNumber: editStaffForm.bankAccount,
      });
      showToast('Cập nhật thông tin nhân viên thành công!', 'success');
      await loadStaffs({ silent: true, syncSelectedId: selectedStaff.id });
      setSelectedStaff(null);
      setEditStaffForm(null);
    } catch (err) {
      showToast(err?.message || 'Không cập nhật được thông tin nhân viên.', 'error');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (addStaffSubmitting) return;

    const position = (addStaffForm.position || '').trim();
    const salaryNum = parseSalaryNumber(addStaffForm.salary);
    const taxId = (addStaffForm.taxId || '').trim();
    const bankName = (addStaffForm.bankName || '').trim() || null;
    const bankAccountNumber = (addStaffForm.bankAccount || '').trim() || null;

    if (!position) {
      showToast('Vui lòng chọn vị trí / vai trò.', 'error');
      return;
    }

    if (addStaffMode === 'from_customer') {
      if (addStaffSelectedUserId == null) {
        showToast('Vui lòng chọn một khách hàng trong danh sách.', 'error');
        return;
      }
      if (!Number.isFinite(salaryNum) || salaryNum < 1) {
        showToast('Mức lương phải là số và tối thiểu 1.', 'error');
        return;
      }
      if (!taxId) {
        showToast('Vui lòng nhập mã số thuế.', 'error');
        return;
      }
      setAddStaffSubmitting(true);
      try {
        await createStaffByUserId({
          userId: addStaffSelectedUserId,
          salary: salaryNum,
          position,
          bankAccountNumber,
          bankName,
          taxId,
        });
        showToast('Thêm nhân viên thành công!', 'success');
        await loadStaffs({ silent: true });
        closeAddStaffModal();
      } catch (err) {
        showToast(err?.message || 'Không thêm được nhân viên.', 'error');
      } finally {
        setAddStaffSubmitting(false);
      }
      return;
    }

    const fullname = (addStaffForm.name || '').trim();
    const email = (addStaffForm.email || '').trim();
    const phone = (addStaffForm.phone || '').trim();
    const address = (addStaffForm.address || '').trim() || null;
    const pwd = addStaffForm.password || '';

    if (!fullname) {
      showToast('Vui lòng nhập họ tên.', 'error');
      return;
    }
    if (!email) {
      showToast('Vui lòng nhập email.', 'error');
      return;
    }
    if (!phone) {
      showToast('Vui lòng nhập số điện thoại.', 'error');
      return;
    }
    if (pwd.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
      return;
    }
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      showToast('Mức lương phải là số hợp lệ (>= 0).', 'error');
      return;
    }
    if (!taxId) {
      showToast('Vui lòng nhập mã số thuế.', 'error');
      return;
    }

    const gender = addStaffForm.gender;
    const genderOk = gender === 'Male' || gender === 'Female' || gender === 'Other';
    setAddStaffSubmitting(true);
    try {
      await createStaffNew({
        fullname,
        gender: genderOk ? gender : 'Male',
        phone,
        email,
        address,
        passwordHash: pwd,
        salary: salaryNum,
        position,
        bankAccountNumber,
        bankName,
        taxId,
      });
      showToast('Tạo nhân viên mới thành công!', 'success');
      await loadStaffs({ silent: true });
      closeAddStaffModal();
    } catch (err) {
      showToast(err?.message || 'Không tạo được nhân viên.', 'error');
    } finally {
      setAddStaffSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const phoneStr = String(c.phone || '');
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      phoneStr.includes(search);
    const matchStatus =
      statusFilter === 'all' || (statusFilter === 'active' && c.active) || (statusFilter === 'locked' && !c.active);
    return matchSearch && matchStatus;
  });

  const filteredStaff = staff.filter((s) => {
    const phoneStr = String(s.phone || '');
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      phoneStr.includes(search);
    const matchStatus =
      statusFilter === 'all' || (statusFilter === 'active' && s.active) || (statusFilter === 'inactive' && !s.active);
    return matchSearch && matchStatus;
  });

  const addStaffCustomerMatches = useMemo(() => {
    const q = addStaffCustomerSearch.trim().toLowerCase();
    const list = q
      ? customers.filter((c) => {
          const phoneStr = String(c.phone || '').replace(/\s/g, '');
          const qPhone = addStaffCustomerSearch.trim().replace(/\s/g, '');
          return (
            c.name.toLowerCase().includes(q) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            phoneStr.includes(qPhone)
          );
        })
      : customers;
    return list.slice(0, 12);
  }, [customers, addStaffCustomerSearch]);

  /* Reset page when filter changes */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    setCurrentPageStaff(1);
  }, [search, statusFilter]);

  /* Reset page when tab changes */
  useEffect(() => {
    setCurrentPage(1);
    setCurrentPageStaff(1);
  }, [tab]);

  /* ── Paginated customers ── */
  const customerTotal = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const customerSafePage = Math.min(Math.max(1, currentPage), customerTotal);
  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice((customerSafePage - 1) * pageSize, customerSafePage * pageSize);
  }, [filteredCustomers, customerSafePage]);

  /* ── Paginated staff ── */
  const staffTotal = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const staffSafePage = Math.min(Math.max(1, currentPageStaff), staffTotal);
  const paginatedStaff = useMemo(() => {
    return filteredStaff.slice((staffSafePage - 1) * pageSize, staffSafePage * pageSize);
  }, [filteredStaff, staffSafePage]);

  /* Pagination button helper */
  const renderPagination = (total, safePage, setPage, label) => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          type="button"
          className={`staff-page-btn ${i === safePage ? 'active' : ''}`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }
    return (
      <>
        <button
          type="button"
          className="staff-page-btn"
          disabled={safePage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ‹
        </button>
        {pages}
        <button
          type="button"
          className="staff-page-btn"
          disabled={safePage >= total}
          onClick={() => setPage((p) => Math.min(total, p + 1))}
        >
          ›
        </button>
      </>
    );
  };

  return (
    <div className="admin-staff">
      <header className="staff-header">
        <h1 className="staff-title">Quản lý Tài khoản</h1>
      </header>

      <div className="staff-tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`staff-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="staff-toolbar">
        <div className="staff-search-wrap">
          <Search size={18} className="staff-search-icon" />
          <input
            type="text"
            className="staff-search"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="staff-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {tab === 'customers' ? (
            <>
              <option value="active">Hoạt động</option>
              <option value="locked">Đã khóa</option>
            </>
          ) : (
            <>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </>
          )}
        </select>
        {tab === 'staff' && (
          <button type="button" className="staff-btn-add" onClick={() => setAddStaffOpen(true)}>
            <Plus size={18} />
            Thêm nhân viên
          </button>
        )}
      </div>

      {tab === 'customers' && (
        <div className="staff-card">
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>THÔNG TIN</th>
                  <th>LIÊN HỆ</th>
                  <th>NGÀY TẠO</th>
                  <th>TRẠNG THÁI</th>
                  <th>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {customersError ? (
                  <tr>
                    <td colSpan={5} className="staff-table-empty">
                      {customersError}
                    </td>
                  </tr>
                ) : customersLoading ? (
                  <tr>
                    <td colSpan={5} className="staff-table-empty">
                      Đang tải danh sách khách hàng...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="staff-table-empty">
                      Không có khách hàng nào.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((row) => (
                  <tr key={row.id} className="staff-row-clickable" onClick={() => setSelectedCustomer(row)}>
                    <td>
                      <div className="staff-info-cell">
                        <div className="staff-avatar">{getInitials(row.name)}</div>
                        <div className="staff-name">{typeof row.name === 'string' ? row.name : (row.name?.toString?.() || '---')}</div>
                      </div>
                    </td>
                    <td>
                      <div className="staff-contact">
                        <div>{typeof row.email === 'string' ? row.email : (row.email?.toString?.() || '---')}</div>
                        <div className="staff-meta">{typeof row.phone === 'string' ? row.phone : (row.phone?.toString?.() || '---')}</div>
                      </div>
                    </td>
                    <td>{row.created}</td>
                    <td>
                      <span className={`staff-badge ${row.active ? 'staff-badge-active' : 'staff-badge-locked'}`}>
                        {row.active ? 'Hoạt động' : 'Đã Khóa'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`staff-toggle ${row.active ? 'active' : ''}`}
                        onClick={() => toggleCustomer(row.id)}
                        disabled={customerToggleBusyId === row.id}
                        aria-busy={customerToggleBusyId === row.id}
                        aria-label={row.active ? 'Khóa' : 'Mở khóa'}
                      >
                        <span className="staff-toggle-slider" />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="staff-pagination">
            <span>
              {customersLoading || customersError
                ? '—'
                : filteredCustomers.length === 0
                  ? `0 trong ${customers.length} tài khoản`
                  : `Hiển thị ${(customerSafePage - 1) * pageSize + 1}–${Math.min(customerSafePage * pageSize, filteredCustomers.length)} / ${filteredCustomers.length} tài khoản`}
            </span>
            <div className="staff-pagination-btns">
              {renderPagination(customerTotal, customerSafePage, setCurrentPage)}
            </div>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="staff-card">
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>NHÂN VIÊN</th>
                  <th>LIÊN HỆ</th>
                  <th>NGÀY VÀO LÀM</th>
                  <th>VỊ TRÍ</th>
                  <th>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {staffError ? (
                  <tr>
                    <td colSpan={5} className="staff-table-empty">
                      {staffError}
                    </td>
                  </tr>
                ) : staffLoading ? (
                  <tr>
                    <td colSpan={5} className="staff-table-empty">
                      Đang tải danh sách nhân viên...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="staff-table-empty">
                      Không có nhân viên nào.
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((row) => (
                  <tr key={row.id} className="staff-row-clickable" onClick={() => openStaffDetail(row)}>
                    <td>
                      <div className="staff-info-cell">
                        <div className="staff-avatar">{getInitials(row.name)}</div>
                        <div>
                          <div className="staff-name">{typeof row.name === 'string' ? row.name : (row.name?.toString?.() || '---')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="staff-contact">
                        <div>{typeof row.email === 'string' ? row.email : (row.email?.toString?.() || '---')}</div>
                        <div className="staff-meta">{typeof row.phone === 'string' ? row.phone : (row.phone?.toString?.() || '---')}</div>
                      </div>
                    </td>
                    <td>{row.startDate}</td>
                    <td>
                      <span className={`staff-position staff-position-${row.position}`}>{row.positionLabel}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`staff-toggle ${row.active ? 'active' : ''}`}
                        onClick={() => toggleStaff(row.id)}
                        disabled={staffToggleBusyId === row.id}
                        aria-busy={staffToggleBusyId === row.id}
                        aria-label={row.active ? 'Tắt' : 'Bật'}
                      >
                        <span className="staff-toggle-slider" />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="staff-pagination">
            <span>
              {staffLoading || staffError
                ? '—'
                : filteredStaff.length === 0
                  ? `0 trong ${staff.length} nhân viên`
                  : `Hiển thị ${(staffSafePage - 1) * pageSize + 1}–${Math.min(staffSafePage * pageSize, filteredStaff.length)} / ${filteredStaff.length} nhân viên`}
            </span>
            <div className="staff-pagination-btns">
              {renderPagination(staffTotal, staffSafePage, setCurrentPageStaff)}
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="staff-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="staff-customer-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="staff-modal-close" onClick={() => setSelectedCustomer(null)} aria-label="Đóng"><X size={20} /></button>
            <div className="staff-customer-modal-header">
              <div className="staff-customer-avatar">{getInitials(selectedCustomer.name)}</div>
              <h2 className="staff-customer-name">{typeof selectedCustomer.name === 'string' ? selectedCustomer.name : (selectedCustomer.name?.toString?.() || '---')}</h2>
              {selectedCustomer.isVip && <span className="staff-customer-vip">VIP MEMBER</span>}
              <span className="staff-customer-id">ID: #{typeof selectedCustomer.customerId === 'string' || typeof selectedCustomer.customerId === 'number' ? selectedCustomer.customerId : (selectedCustomer.customerId?.toString?.() || `CUS-${String(selectedCustomer.id).padStart(4, '0')}`)}</span>
            </div>
            <div className="staff-customer-section">
              <h3 className="staff-customer-section-title"><FileText size={16} /> CONTACT INFORMATION</h3>
              <div className="staff-customer-cards">
                <div className="staff-customer-info-card">
                  <span className="staff-customer-info-label"><Phone size={14} /> PHONE NUMBER</span>
                  <span>{typeof selectedCustomer.phone === 'string' ? selectedCustomer.phone : (selectedCustomer.phone?.toString?.() || '---')}</span>
                </div>
                <div className="staff-customer-info-card">
                  <span className="staff-customer-info-label"><Mail size={14} /> EMAIL ADDRESS</span>
                  <span>{typeof selectedCustomer.email === 'string' ? selectedCustomer.email : (selectedCustomer.email?.toString?.() || '---')}</span>
                </div>
                <div className="staff-customer-info-card">
                  <span className="staff-customer-info-label"><MapPin size={14} /> ADDRESS</span>
                  <span>{selectedCustomer.address || '—'}</span>
                </div>
              </div>
            </div>
            <div className="staff-customer-section">
              <h3 className="staff-customer-section-title"><BarChart3 size={16} /> KEY PERFORMANCE INDICATORS</h3>
              <div className="staff-customer-kpi-cards">
                <div className="staff-customer-kpi-card staff-kpi-green">
                  <span className="staff-kpi-label">Số đơn đã dùng</span>
                  <span className="staff-kpi-value">{(selectedCustomer.ordersPlaced ?? 0)} ORDERS</span>
                </div>
                <div className="staff-customer-kpi-card staff-kpi-red">
                  <span className="staff-kpi-label">Tổng đơn hủy</span>
                  <span className="staff-kpi-value">{(selectedCustomer.ordersCanceled ?? 0)} ORDERS</span>
                </div>
                <div className="staff-customer-kpi-card staff-kpi-orange">
                  <span className="staff-kpi-label">Số đơn không nhận</span>
                  <span className="staff-kpi-value">{(selectedCustomer.noShow ?? 0)} NO-SHOW</span>
                </div>
                <div className="staff-customer-kpi-card">
                  <span className="staff-kpi-label">Tổng chi tiêu</span>
                  <span className="staff-kpi-value">{(selectedCustomer.totalSpending ?? 0).toLocaleString('vi-VN')} VND</span>
                </div>
              </div>
            </div>
            <div className="staff-customer-meta">
              <span><Calendar size={14} /> Ngày tạo tài khoản {selectedCustomer.created}</span>
              <span><Clock size={14} /> Cập nhật cuối cùng {selectedCustomer.lastUpdated || '—'}</span>
            </div>
            <div className="staff-customer-modal-actions">
              <button type="button" className="staff-modal-btn staff-modal-btn-secondary" onClick={() => setSelectedCustomer(null)}>Đóng</button>
              <button type="button" className="staff-modal-btn staff-modal-btn-primary" onClick={() => setResetPasswordOpen(true)}><Lock size={16} /> Cấp lại mật khẩu</button>
            </div>
          </div>
        </div>
      )}

      {selectedStaff && editStaffForm && (
        <div className="staff-modal-overlay" onClick={() => { setSelectedStaff(null); setEditStaffForm(null); }}>
          <div className="staff-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-info-modal-head">
              <h2 className="staff-info-modal-title">Thông tin Nhân sự</h2>
              <button type="button" className="staff-modal-close" onClick={() => { setSelectedStaff(null); setEditStaffForm(null); }} aria-label="Đóng"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveStaffInfo} className="staff-info-modal-form">
              <div className="staff-info-modal-grid">
                <div className="staff-info-modal-col">
                  <h3 className="staff-info-modal-section-title">THÔNG TIN USER</h3>
                  <div className="staff-form-group">
                    <label>Họ tên</label>
                    <input type="text" value={editStaffForm.name} onChange={(e) => setEditStaffForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="staff-form-group">
                    <label>Email</label>
                    <input type="email" value={editStaffForm.email} onChange={(e) => setEditStaffForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="staff-form-group">
                    <label>Số điện thoại</label>
                    <input type="text" value={editStaffForm.phone} onChange={(e) => setEditStaffForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="staff-form-group">
                    <label>Địa chỉ</label>
                    <input type="text" value={editStaffForm.address} onChange={(e) => setEditStaffForm((f) => ({ ...f, address: e.target.value }))} placeholder="123 Đường ABC, Quận 1..." />
                  </div>
                  <div className="staff-form-group">
                    <label>Mật khẩu</label>
                    <input type="password" value={editStaffForm.password} onChange={(e) => setEditStaffForm((f) => ({ ...f, password: e.target.value }))} placeholder="********" />
                    <p className="staff-form-hint">* Để trống nếu không muốn thay đổi</p>
                  </div>
                </div>
                <div className="staff-info-modal-col">
                  <h3 className="staff-info-modal-section-title">THÔNG TIN STAFF</h3>
                  <div className="staff-form-group">
                    <label>Vị trí</label>
                    <select value={editStaffForm.position} onChange={(e) => setEditStaffForm((f) => ({ ...f, position: e.target.value }))}>
                      <option value="">Chọn vị trí</option>
                      {POSITION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="staff-form-group">
                    <label>Mức lương (VNĐ)</label>
                    <input type="text" value={editStaffForm.salary} onChange={(e) => setEditStaffForm((f) => ({ ...f, salary: e.target.value }))} placeholder="10,000,000" />
                  </div>
                  <div className="staff-form-group">
                    <label>Mã số thuế</label>
                    <input type="text" value={editStaffForm.taxId} onChange={(e) => setEditStaffForm((f) => ({ ...f, taxId: e.target.value }))} placeholder="8123456789" />
                  </div>
                  <div className="staff-form-group">
                    <label>Số tài khoản ngân hàng</label>
                    <input type="text" value={editStaffForm.bankAccount} onChange={(e) => setEditStaffForm((f) => ({ ...f, bankAccount: e.target.value }))} placeholder="012345678910 (Vietcombank)" />
                  </div>
                </div>
              </div>
              <div className="staff-info-modal-actions">
                <button type="button" className="staff-modal-btn staff-modal-btn-secondary" onClick={() => { setSelectedStaff(null); setEditStaffForm(null); }}>Hủy</button>
                <button type="submit" className="staff-modal-btn staff-modal-btn-primary">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordOpen && selectedCustomer && (
        <div className="staff-modal-overlay" onClick={() => setResetPasswordOpen(false)}>
          <div className="staff-reset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-reset-modal-head">
              <h2 className="staff-reset-modal-title">Cấp lại mật khẩu mới</h2>
              <button type="button" className="staff-modal-close" onClick={() => setResetPasswordOpen(false)}><X size={20} /></button>
            </div>
            <div className="staff-reset-user">
              <span className="staff-reset-label">ĐANG CẬP NHẬT CHO</span>
              <span className="staff-reset-name">{selectedCustomer.name}</span>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newPassword && newPassword === confirmPassword) {
                showToast('Đã cập nhật mật khẩu thành công!', 'success');
                setResetPasswordOpen(false);
                setNewPassword('');
                setConfirmPassword('');
              } else {
                showToast('Mật khẩu không khớp hoặc chưa nhập.', 'error');
              }
            }}>
              <div className="staff-form-group">
                <label>Mật khẩu mới</label>
                <div className="staff-password-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Nhập mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" className="staff-password-toggle" onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? 'Ẩn' : 'Hiện'}><Eye size={18} /></button>
                </div>
              </div>
              <div className="staff-form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input type="password" placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <p className="staff-password-hint">Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số để đảm bảo an toàn cho tài khoản khách hàng.</p>
              <div className="staff-reset-modal-actions">
                <button type="button" className="staff-modal-btn staff-modal-btn-secondary" onClick={() => setResetPasswordOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="staff-modal-btn staff-modal-btn-primary">Cập nhật mật khẩu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addStaffOpen && (
        <div className="staff-modal-overlay" onClick={closeAddStaffModal}>
          <div className="staff-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-add-modal-head">
              <h2 className="staff-add-modal-title">Thêm nhân viên mới</h2>
              <button type="button" className="staff-modal-close" onClick={closeAddStaffModal} aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="staff-add-modal-options">
              <button
                type="button"
                className={`staff-add-option ${addStaffMode === 'from_customer' ? 'active' : ''}`}
                onClick={() => { setAddStaffMode('from_customer'); setAddStaffSelectedUserId(null); }}
              >
                Chọn từ khách hàng cũ
              </button>
              <button
                type="button"
                className={`staff-add-option ${addStaffMode === 'new' ? 'active' : ''}`}
                onClick={() => { setAddStaffMode('new'); setAddStaffSelectedUserId(null); }}
              >
                Tạo mới hoàn toàn
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="staff-add-modal-form">
              {addStaffMode === 'from_customer' && (
                <div className="staff-add-section">
                  <h3 className="staff-add-section-title">THÔNG TIN ĐỊNH DANH</h3>
                  <div className="staff-form-group">
                    <label>Tìm kiếm khách hàng (Hệ thống)</label>
                    <div className="staff-search-wrap">
                      <Search size={18} className="staff-search-icon" />
                      <input type="text" className="staff-search staff-search-full" placeholder="Nhập tên, email hoặc số điện thoại khách hàng..." value={addStaffCustomerSearch} onChange={(e) => setAddStaffCustomerSearch(e.target.value)} />
                    </div>
                    <p className="staff-form-hint">* Danh sách lấy từ API khách hàng đã tải. Để trống ô tìm để xem tối đa 12 khách đầu.</p>
                    {addStaffCustomerMatches.length === 0 ? (
                      <p className="staff-form-hint">Không có khách hàng phù hợp.</p>
                    ) : (
                      <div className="staff-table-wrap" style={{ marginTop: 10, maxHeight: 220, overflowY: 'auto' }}>
                        <table className="staff-table">
                          <tbody>
                            {addStaffCustomerMatches.map((c) => (
                              <tr
                                key={c.id}
                                className="staff-row-clickable"
                                style={addStaffSelectedUserId === c.id ? { background: 'rgba(255, 140, 0, 0.12)' } : undefined}
                                onClick={() => setAddStaffSelectedUserId(c.id)}
                              >
                                <td>
                                  <div className="staff-name">{c.name}</div>
                                  <div className="staff-meta">{c.email}</div>
                                </td>
                                <td className="staff-meta">{c.phone}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {addStaffSelectedUserId != null && (
                      <p className="staff-form-hint">
                        Đã chọn userId <strong>{addStaffSelectedUserId}</strong>
                        {' · '}
                        <button type="button" className="staff-modal-btn staff-modal-btn-secondary" onClick={() => setAddStaffSelectedUserId(null)}>
                          Bỏ chọn
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              )}
              {addStaffMode === 'new' && (
                <div className="staff-add-section">
                  <h3 className="staff-add-section-title">THÔNG TIN TÀI KHOẢN MỚI</h3>
                  <div className="staff-form-group">
                    <label>Họ tên</label>
                    <input type="text" value={addStaffForm.name} onChange={(e) => setAddStaffForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="staff-form-group">
                    <label>Giới tính</label>
                    <select value={addStaffForm.gender} onChange={(e) => setAddStaffForm((f) => ({ ...f, gender: e.target.value }))}>
                      <option value="Male">Nam (Male)</option>
                      <option value="Female">Nữ (Female)</option>
                      <option value="Other">Khác (Other)</option>
                    </select>
                  </div>
                  <div className="staff-form-group">
                    <label>Email</label>
                    <input type="email" value={addStaffForm.email} onChange={(e) => setAddStaffForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
                  </div>
                  <div className="staff-form-group">
                    <label>Số điện thoại</label>
                    <input type="text" value={addStaffForm.phone} onChange={(e) => setAddStaffForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="staff-form-group">
                    <label>Địa chỉ</label>
                    <input type="text" value={addStaffForm.address} onChange={(e) => setAddStaffForm((f) => ({ ...f, address: e.target.value }))} placeholder="Tùy chọn" />
                  </div>
                  <div className="staff-form-group">
                    <label>Mật khẩu</label>
                    <input type="password" value={addStaffForm.password} onChange={(e) => setAddStaffForm((f) => ({ ...f, password: e.target.value }))} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
                  </div>
                </div>
              )}
              <div className="staff-add-section">
                <h3 className="staff-add-section-title">THÔNG TIN CÔNG VIỆC</h3>
                <div className="staff-form-group">
                  <label>Vị trí / Vai trò</label>
                  <select value={addStaffForm.position} onChange={(e) => setAddStaffForm((f) => ({ ...f, position: e.target.value }))}>
                    <option value="">Chọn vị trí</option>
                    {POSITION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="staff-form-group">
                  <label>Mức lương cơ bản (VNĐ)</label>
                  <input type="text" value={addStaffForm.salary} onChange={(e) => setAddStaffForm((f) => ({ ...f, salary: e.target.value }))} placeholder="5,000,000" />
                </div>
                <div className="staff-form-group">
                  <label>Mã số thuế</label>
                  <input type="text" value={addStaffForm.taxId} onChange={(e) => setAddStaffForm((f) => ({ ...f, taxId: e.target.value }))} placeholder="Nhập MST cá nhân" />
                </div>
              </div>
              <div className="staff-add-section">
                <h3 className="staff-add-section-title">THÔNG TIN NGÂN HÀNG</h3>
                <div className="staff-form-group">
                  <label>Tên ngân hàng</label>
                  <input type="text" value={addStaffForm.bankName} onChange={(e) => setAddStaffForm((f) => ({ ...f, bankName: e.target.value }))} placeholder="VD: Vietcombank, Techcombank..." />
                </div>
                <div className="staff-form-group">
                  <label>Số tài khoản</label>
                  <input type="text" value={addStaffForm.bankAccount} onChange={(e) => setAddStaffForm((f) => ({ ...f, bankAccount: e.target.value }))} placeholder="Nhập số tài khoản nhận lương" />
                </div>
              </div>
              <div className="staff-add-notice">
                Lưu ý: Nhân viên sau khi được thêm sẽ nhận được email thông báo về thông tin tài khoản và hướng dẫn đăng nhập vào hệ thống.
              </div>
              <div className="staff-add-modal-actions">
                <button type="button" className="staff-modal-btn staff-modal-btn-secondary" onClick={closeAddStaffModal} disabled={addStaffSubmitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className="staff-modal-btn staff-modal-btn-primary" disabled={addStaffSubmitting}>
                  {addStaffSubmitting ? 'Đang xử lý...' : 'Xác nhận thêm nhân viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffPage;
