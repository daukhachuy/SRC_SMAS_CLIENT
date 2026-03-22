import React, { useState } from 'react';
import { Search, Plus, X, Phone, Mail, MapPin, FileText, BarChart3, Calendar, Clock, Lock, Eye } from 'lucide-react';
import '../../styles/AdminStaff.css';

const MOCK_CUSTOMERS = [
  { id: 1, customerId: 'CUS-8821', name: 'Nguyễn Văn A', phone: '+84 901 234 567', email: 'nguyen.a@email.com', address: '123 Lê Loi, Quận 1, TP.HCM', created: '15/03/2023', lastUpdated: 'Hôm qua, 14:20', active: true, isVip: true, ordersPlaced: 42, ordersCanceled: 3, noShow: 1, totalSpending: 12450000 },
  { id: 2, name: 'Trần Thị Bình', customerId: 'CUS-7702', phone: '0988 777 666', email: 'binh.tran@email.vn', address: '45 Nguyễn Huệ, Quận 1, TP.HCM', created: '20/08/2023', lastUpdated: '02/01/2024', active: false, isVip: false, ordersPlaced: 8, ordersCanceled: 1, noShow: 0, totalSpending: 2100000 },
  { id: 3, name: 'Lê Hoàng Cường', customerId: 'CUS-5513', phone: '0971 555 990', email: 'cuonglh@demo.com', address: '78 Trần Hưng Đạo, Quận 5, TP.HCM', created: '05/01/2024', lastUpdated: 'Hôm nay', active: true, isVip: false, ordersPlaced: 5, ordersCanceled: 0, noShow: 0, totalSpending: 890000 },
  { id: 4, name: 'Phạm Minh Đạo', customerId: 'CUS-3344', phone: '0934 111 222', email: 'daopm@service.com', address: '22 Lý Tự Trọng, Quận 3, TP.HCM', created: '15/02/2024', lastUpdated: 'Tuần trước', active: true, isVip: true, ordersPlaced: 18, ordersCanceled: 2, noShow: 0, totalSpending: 5600000 },
];

const POSITION_OPTIONS = [
  { value: 'manager', label: 'Quản lý' },
  { value: 'kitchen', label: 'Bếp' },
  { value: 'thuongtin', label: 'Thường tín' },
  { value: 'server', label: 'Phục vụ (Waiter)' },
  { value: 'cashier', label: 'Thu ngân' },
];

const MOCK_STAFF = [
  { id: 1, name: 'Phạm Hoàng Nam', email: 'nam.pham@foodie.vn', phone: '0982 358 678', address: '123 Đường ABC, Quận 1, TP.HCM', startDate: '01/01/2022', position: 'manager', positionLabel: 'Quản lý', active: true, salary: 15000000, taxId: '0123456789', bankName: 'Vietcombank', bankAccount: '012345678910' },
  { id: 2, name: 'Lê Minh Quân', email: 'quan.lq@foodie.vn', phone: '0987 173 430', address: '', startDate: '15/03/2023', position: 'kitchen', positionLabel: 'Bếp', active: true, salary: 12000000, taxId: '', bankName: '', bankAccount: '' },
  { id: 3, name: 'Trần Phương Thảo', email: 'thao.tp@foodie.vn', phone: '0945 888 998', address: '', startDate: '10/06/2023', position: 'thuongtin', positionLabel: 'Thường tín', active: false, salary: 8000000, taxId: '', bankName: '', bankAccount: '' },
  { id: 4, name: 'Nguyễn Văn Đại', email: 'dai.nv@foodie.vn', phone: '0902 888 880', address: '', startDate: '01/12/2023', position: 'server', positionLabel: 'Phục vụ', active: true, salary: 7000000, taxId: '8123456789', bankName: 'Vietcombank', bankAccount: '012345678910' },
];

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
  position: '', salary: '', taxId: '', bankName: '', bankAccount: '',
});

const AdminStaffPage = () => {
  const [tab, setTab] = useState('customers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [staff, setStaff] = useState(MOCK_STAFF);
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

  const toggleCustomer = (id) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const toggleStaff = (id) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
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

  const handleSaveStaffInfo = (e) => {
    e.preventDefault();
    if (!selectedStaff || !editStaffForm) return;
    const salaryNum = parseInt(String(editStaffForm.salary).replace(/,/g, ''), 10) || 0;
    const positionOpt = POSITION_OPTIONS.find((o) => o.value === editStaffForm.position);
    setStaff((prev) =>
      prev.map((s) =>
        s.id === selectedStaff.id
          ? {
              ...s,
              name: editStaffForm.name,
              email: editStaffForm.email,
              phone: editStaffForm.phone,
              address: editStaffForm.address,
              position: editStaffForm.position || s.position,
              positionLabel: positionOpt ? positionOpt.label : s.positionLabel,
              salary: salaryNum,
              taxId: editStaffForm.taxId,
              bankName: editStaffForm.bankName,
              bankAccount: editStaffForm.bankAccount,
            }
          : s
      )
    );
    setSelectedStaff(null);
    setEditStaffForm(null);
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    window.alert('Đã thêm nhân viên (mock). Nhân viên sẽ nhận email hướng dẫn đăng nhập.');
    setAddStaffOpen(false);
    setAddStaffForm(defaultStaffForm());
    setAddStaffCustomerSearch('');
  };

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus =
      statusFilter === 'all' || (statusFilter === 'active' && c.active) || (statusFilter === 'locked' && !c.active);
    return matchSearch && matchStatus;
  });

  const filteredStaff = staff.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search);
    const matchStatus =
      statusFilter === 'all' || (statusFilter === 'active' && s.active) || (statusFilter === 'inactive' && !s.active);
    return matchSearch && matchStatus;
  });

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
                {filteredCustomers.map((row) => (
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
                        aria-label={row.active ? 'Khóa' : 'Mở khóa'}
                      >
                        <span className="staff-toggle-slider" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="staff-pagination">
            <span>Hiển thị 1-{filteredCustomers.length} trong {customers.length} tài khoản</span>
            <div className="staff-pagination-btns">
              <button type="button" className="staff-page-btn">&lt;</button>
              <button type="button" className="staff-page-btn active">1</button>
              <button type="button" className="staff-page-btn">2</button>
              <button type="button" className="staff-page-btn">3</button>
              <button type="button" className="staff-page-btn">&gt;</button>
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
                {filteredStaff.map((row) => (
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
                        aria-label={row.active ? 'Tắt' : 'Bật'}
                      >
                        <span className="staff-toggle-slider" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="staff-pagination">
            <span>Hiển thị 1-{filteredStaff.length} trong {staff.length} nhân viên</span>
            <div className="staff-pagination-btns">
              <button type="button" className="staff-page-btn">&lt;</button>
              <button type="button" className="staff-page-btn active">1</button>
              <button type="button" className="staff-page-btn">2</button>
              <button type="button" className="staff-page-btn">3</button>
              <button type="button" className="staff-page-btn">&gt;</button>
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
            <form onSubmit={(e) => { e.preventDefault(); if (newPassword && newPassword === confirmPassword) { window.alert('Đã cập nhật mật khẩu (mock).'); setResetPasswordOpen(false); setNewPassword(''); setConfirmPassword(''); } else { window.alert('Mật khẩu không khớp hoặc chưa nhập.'); } }}>
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
        <div className="staff-modal-overlay" onClick={() => { setAddStaffOpen(false); setAddStaffForm(defaultStaffForm()); setAddStaffCustomerSearch(''); }}>
          <div className="staff-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-add-modal-head">
              <h2 className="staff-add-modal-title">Thêm nhân viên mới</h2>
              <button type="button" className="staff-modal-close" onClick={() => { setAddStaffOpen(false); setAddStaffForm(defaultStaffForm()); setAddStaffCustomerSearch(''); }} aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="staff-add-modal-options">
              <button type="button" className={`staff-add-option ${addStaffMode === 'from_customer' ? 'active' : ''}`} onClick={() => setAddStaffMode('from_customer')}>Chọn từ khách hàng cũ</button>
              <button type="button" className={`staff-add-option ${addStaffMode === 'new' ? 'active' : ''}`} onClick={() => setAddStaffMode('new')}>Tạo mới hoàn toàn</button>
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
                    <p className="staff-form-hint">* Chỉ các tài khoản có vai trò &apos;Khách hàng&apos; mới xuất hiện tại đây.</p>
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
                <button type="button" className="staff-modal-btn staff-modal-btn-secondary" onClick={() => { setAddStaffOpen(false); setAddStaffForm(defaultStaffForm()); setAddStaffCustomerSearch(''); }}>Hủy bỏ</button>
                <button type="submit" className="staff-modal-btn staff-modal-btn-primary">Xác nhận thêm nhân viên</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffPage;
