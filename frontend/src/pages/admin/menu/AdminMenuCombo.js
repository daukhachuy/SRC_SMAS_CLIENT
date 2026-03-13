import React, { useState } from 'react';
import { Plus, Search, Pencil, X, Calendar } from 'lucide-react';
import '../../../styles/AdminMenuManagement.css';

const STATUS_FILTERS = ['Tất cả trạng thái', 'Đang bán', 'Ngừng bán'];

const MOCK_COMBOS = [
  { id: 1, code: 'CB-001', name: 'Combo Tiết Kiệm S1', description: 'Bao gồm 2 món chính, 1 khoai tây chiên và 1 nước ngọt size vừa.', price: '150.000₫', image: 'https://picsum.photos/seed/combo1/80/80', status: true },
  { id: 2, code: 'CB-002', name: 'Combo Gia Đình Happy', description: 'Phù hợp cho nhóm 4-5 người, bao gồm set gà, burger và tráng miệng.', price: '450.000₫', image: 'https://picsum.photos/seed/combo2/80/80', status: true },
  { id: 3, code: 'CB-003', name: 'Combo Lunch Special', description: 'Bữa trưa dinh dưỡng cho nhân viên văn phòng, phục vụ 11h-14h hàng ngày.', price: '85.000₫', image: 'https://picsum.photos/seed/combo3/80/80', status: false }
];

const defaultComboForm = () => ({
  name: '',
  description: '',
  price: 0,
  usageLimit: 'unlimited',
  expiryDate: '',
  imageFile: null,
  imagePreview: null,
});

const parsePriceVnd = (str) => {
  if (typeof str === 'number') return str;
  const num = parseInt(String(str).replace(/[\s.₫]/g, '').replace(/\D/g, ''), 10);
  return Number.isNaN(num) ? 0 : num;
};

const formatPriceVnd = (num) => (num ? Number(num).toLocaleString('vi-VN') + '₫' : '0₫');

const AdminMenuCombo = () => {
  const [combos, setCombos] = useState(MOCK_COMBOS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [createComboOpen, setCreateComboOpen] = useState(false);
  const [createComboStep, setCreateComboStep] = useState(1);
  const [createComboForm, setCreateComboForm] = useState(defaultComboForm);
  const [editComboId, setEditComboId] = useState(null);

  const filtered = combos.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'Tất cả trạng thái' ||
      (statusFilter === 'Đang bán' && c.status) ||
      (statusFilter === 'Ngừng bán' && !c.status);
    return matchSearch && matchStatus;
  });

  const openAddCombo = () => {
    setEditComboId(null);
    setCreateComboStep(1);
    setCreateComboForm(defaultComboForm());
    setCreateComboOpen(true);
  };

  const openEditCombo = (row) => {
    setEditComboId(row.id);
    setCreateComboStep(1);
    setCreateComboForm({
      name: row.name,
      description: row.description || '',
      price: parsePriceVnd(row.price),
      usageLimit: 'unlimited',
      expiryDate: '',
      imageFile: null,
      imagePreview: row.image || null,
    });
    setCreateComboOpen(true);
  };

  const closeComboModal = () => {
    setCreateComboOpen(false);
    setCreateComboStep(1);
    setCreateComboForm(defaultComboForm());
    setEditComboId(null);
  };

  const handleFinishCombo = () => {
    if (editComboId) {
      const priceStr = formatPriceVnd(createComboForm.price);
      const imageUrl = createComboForm.imagePreview || combos.find((c) => c.id === editComboId)?.image;
      setCombos((prev) =>
        prev.map((c) =>
          c.id === editComboId
            ? { ...c, name: createComboForm.name, description: createComboForm.description, price: priceStr, image: imageUrl }
            : c
        )
      );
    } else {
      window.alert('Đã tạo combo (mock).');
    }
    closeComboModal();
  };

  return (
    <div className="menu-management-section">
      <div className="menu-section-toolbar">
        <div className="menu-search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm tên combo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="menu-search-input"
          />
        </div>
        <div className="menu-filters">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`menu-filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button type="button" className="menu-btn-primary" onClick={openAddCombo}>
          <Plus size={18} />
          Thêm Combo mới
        </button>
      </div>

      <div className="menu-table-card">
        <table className="menu-table">
          <thead>
            <tr>
              <th>HÌNH ẢNH</th>
              <th>TÊN COMBO</th>
              <th>MÔ TẢ</th>
              <th>GIÁ BÁN</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="menu-table-img">
                    {row.image ? <img src={row.image} alt={row.name} /> : <span>—</span>}
                  </div>
                </td>
                <td className="menu-cell-name">
                  <div>{row.name}</div>
                  <div className="menu-cell-code">Mã: {row.code}</div>
                </td>
                <td className="menu-cell-desc">{row.description}</td>
                <td className="menu-cell-price">{row.price}</td>
                <td>
                  <button type="button" className={`menu-toggle ${row.status ? 'active' : ''}`} aria-label="Toggle">
                    <span className="menu-toggle-thumb" />
                  </button>
                </td>
                <td>
                  <div className="menu-actions-cell">
                    <button type="button" className="menu-icon-btn" aria-label="Sửa" onClick={() => openEditCombo(row)}><Pencil size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="menu-pagination">
          <span>Hiển thị 1-{filtered.length} trong tổng số {combos.length} combos</span>
          <div className="menu-pagination-btns">
            <button type="button" className="menu-page-btn" disabled>‹</button>
            <button type="button" className="menu-page-btn active">1</button>
            <button type="button" className="menu-page-btn">›</button>
          </div>
        </div>
      </div>

      {createComboOpen && (
        <div className="combo-create-overlay" onClick={closeComboModal}>
          <div className="combo-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="combo-create-head">
              <h2 className="combo-create-title">{editComboId ? 'Cập nhật Combo' : 'Tạo Combo Mới'}</h2>
              <button type="button" className="combo-create-close" onClick={closeComboModal} aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="combo-create-steps">
              <button type="button" className={`combo-step-tab ${createComboStep === 1 ? 'active' : ''}`} onClick={() => setCreateComboStep(1)}>1 Thông tin cơ bản</button>
              <button type="button" className={`combo-step-tab ${createComboStep === 2 ? 'active' : ''}`} onClick={() => setCreateComboStep(2)}>2 Chọn món ăn</button>
            </div>

            {createComboStep === 1 && (
              <form className="combo-create-form" onSubmit={(e) => { e.preventDefault(); setCreateComboStep(2); }}>
                <div className="combo-form-group">
                  <label>Tên Combo <span className="combo-required">*</span></label>
                  <input type="text" value={createComboForm.name} onChange={(e) => setCreateComboForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ví dụ: Combo Gia Đình Hạnh Phúc" />
                </div>
                <div className="combo-form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea value={createComboForm.description} onChange={(e) => setCreateComboForm((f) => ({ ...f, description: e.target.value }))} placeholder="Giới thiệu về các món có trong combo..." rows={3} />
                </div>
                <div className="combo-form-group">
                  <label>Giá bán (VNĐ) <span className="combo-required">*</span></label>
                  <input type="number" min={0} value={createComboForm.price || ''} onChange={(e) => setCreateComboForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} />
                </div>
                <div className="combo-form-group">
                  <label>Giới hạn sử dụng</label>
                  <select value={createComboForm.usageLimit} onChange={(e) => setCreateComboForm((f) => ({ ...f, usageLimit: e.target.value }))}>
                    <option value="unlimited">Không giới hạn</option>
                    <option value="1">1 lần</option>
                    <option value="2">2 lần</option>
                    <option value="5">5 lần</option>
                    <option value="10">10 lần</option>
                  </select>
                </div>
                <div className="combo-form-group">
                  <label>Ngày hết hạn</label>
                  <div className="combo-date-wrap">
                    <input type="date" value={createComboForm.expiryDate} onChange={(e) => setCreateComboForm((f) => ({ ...f, expiryDate: e.target.value }))} className="combo-date-input" />
                    <Calendar size={18} className="combo-date-icon" />
                  </div>
                </div>
                <div className="combo-form-group">
                  <label>Hình ảnh Combo</label>
                  <label className="combo-upload-zone">
                    <input type="file" accept="image/*" className="combo-upload-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCreateComboForm((prev) => ({ ...prev, imageFile: f, imagePreview: URL.createObjectURL(f) })); }} />
                    {createComboForm.imagePreview ? (
                      <div className="combo-upload-preview"><img src={createComboForm.imagePreview} alt="Preview" /></div>
                    ) : (
                      <div className="combo-upload-placeholder">
                        <Plus size={32} />
                        <span>Tải ảnh lên</span>
                      </div>
                    )}
                  </label>
                </div>
                <div className="combo-create-actions">
                  <button type="button" className="combo-btn-cancel" onClick={closeComboModal}>Hủy bỏ</button>
                  <button type="submit" className="menu-btn-primary">Tiếp theo</button>
                </div>
              </form>
            )}

            {createComboStep === 2 && (
              <div className="combo-create-form">
                <p className="combo-step2-placeholder">Chọn các món ăn sẽ có trong combo. (Chức năng sẽ tích hợp danh sách món từ hệ thống.)</p>
                <div className="combo-create-actions">
                  <button type="button" className="combo-btn-cancel" onClick={() => setCreateComboStep(1)}>Quay lại</button>
                  <button type="button" className="menu-btn-primary" onClick={handleFinishCombo}>{editComboId ? 'Lưu thay đổi' : 'Hoàn tất'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenuCombo;
