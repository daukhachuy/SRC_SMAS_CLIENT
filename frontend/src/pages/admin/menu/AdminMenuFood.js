import React, { useState, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, X, UploadCloud } from 'lucide-react';
import '../../../styles/AdminMenuManagement.css';

const CATEGORY_FILTERS = ['Khai vị', 'Món chính', 'Đồ uống', 'Tráng miệng', 'Đặc sản'];
const DISH_CATEGORIES = ['Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống', 'Đặc sản'];
const UNITS = ['Dĩa', 'Phần', 'Ly', 'Tô', 'Cái', 'Kg'];

const defaultDishForm = () => ({
  name: '',
  image: null,
  imagePreview: null,
  description: '',
  price: '',
  unit: 'Dĩa',
  categories: [],
  notes: '',
  status: true,
  promotionalPrice: '',
});

const MOCK_DISHES = [
  {
    id: 1,
    name: 'Salad Cá Hồi Sốt Mè',
    description: 'Salad tươi với cá hồi Na Uy và sốt mè thơm ngon.',
    category: 'Khai vị',
    categories: ['Khai vị'],
    price: 125000,
    priceDisplay: '125,000₫',
    promotionalPrice: 0,
    unit: 'Dĩa',
    image: 'https://picsum.photos/seed/salad/80/80',
    status: true,
    notes: '',
  },
  {
    id: 2,
    name: 'Bít Tết Bò Mỹ Ribeye',
    description: 'Thịt bò Mỹ Ribeye nướng kèm khoai tây chiên và sốt tiêu đen đặc biệt.',
    category: 'Món chính',
    categories: ['Món chính'],
    price: 450000,
    priceDisplay: '450,000₫',
    promotionalPrice: 0,
    unit: 'Dĩa',
    image: 'https://picsum.photos/seed/steak/80/80',
    status: true,
    notes: '',
  },
  {
    id: 3,
    name: 'Phở Bò Kobe Đặc Biệt',
    description: 'Phở bò truyền thống với thịt bò Kobe cao cấp.',
    category: 'Món chính',
    categories: ['Món chính'],
    price: 280000,
    priceDisplay: '280,000₫',
    promotionalPrice: 0,
    unit: 'Tô',
    image: 'https://picsum.photos/seed/pho/80/80',
    status: false,
    notes: '',
  },
  {
    id: 4,
    name: 'Cà Phê Muối Đặc Sản',
    description: 'Cà phê pha máy kèm kem muối đặc sản Đà Nẵng.',
    category: 'Đồ uống',
    categories: ['Đồ uống'],
    price: 55000,
    priceDisplay: '55,000₫',
    promotionalPrice: 0,
    unit: 'Ly',
    image: 'https://picsum.photos/seed/coffee/80/80',
    status: true,
    notes: '',
  },
];

const formatPrice = (n) => {
  if (n === '' || n == null) return '';
  const num = typeof n === 'number' ? n : parseInt(String(n).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN');
};

const AdminMenuFood = () => {
  const [dishes, setDishes] = useState(MOCK_DISHES);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [form, setForm] = useState(defaultDishForm());
  const addFileRef = useRef(null);
  const editFileRef = useRef(null);

  const filtered = dishes.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || (d.categories && d.categories.includes(categoryFilter)) || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const openAddModal = () => {
    setForm(defaultDishForm());
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    addFileRef.current = null;
  };

  const openEditModal = (row) => {
    setEditingDish(row);
    setForm({
      name: row.name || '',
      image: null,
      imagePreview: row.image || null,
      description: row.description || '',
      price: row.price != null ? String(row.price) : '',
      unit: row.unit || 'Dĩa',
      categories: row.categories ? [...row.categories] : (row.category ? [row.category] : []),
      notes: row.notes || '',
      status: row.status !== false,
      promotionalPrice: row.promotionalPrice != null ? String(row.promotionalPrice) : '0',
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingDish(null);
    editFileRef.current = null;
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (cat) => {
    setForm((prev) => {
      const next = prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: next };
    });
  };

  const handleAddImage = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: file, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
    if (isEdit && editFileRef.current) editFileRef.current.value = '';
    if (!isEdit && addFileRef.current) addFileRef.current.value = '';
  };

  const handleSaveNew = () => {
    const name = (form.name || '').trim();
    const priceNum = parseInt(String(form.price).replace(/\D/g, ''), 10);
    if (!name) return;
    if (!form.categories.length) return;
    const newDish = {
      id: Math.max(0, ...dishes.map((d) => d.id)) + 1,
      name,
      description: (form.description || '').trim(),
      category: form.categories[0],
      categories: form.categories,
      price: isNaN(priceNum) ? 0 : priceNum,
      priceDisplay: formatPrice(priceNum) + '₫',
      promotionalPrice: 0,
      unit: form.unit,
      image: form.imagePreview || '',
      status: true,
      notes: (form.notes || '').trim(),
    };
    setDishes((prev) => [...prev, newDish]);
    closeAddModal();
  };

  const handleSaveEdit = () => {
    if (!editingDish) return;
    const name = (form.name || '').trim();
    const priceNum = parseInt(String(form.price).replace(/\D/g, ''), 10);
    const promoNum = parseInt(String(form.promotionalPrice || '0').replace(/\D/g, ''), 10);
    if (!name) return;
    if (!form.categories.length) return;
    setDishes((prev) =>
      prev.map((d) =>
        d.id === editingDish.id
          ? {
              ...d,
              name,
              description: (form.description || '').trim(),
              category: form.categories[0],
              categories: form.categories,
              price: isNaN(priceNum) ? d.price : priceNum,
              priceDisplay: formatPrice(priceNum) + '₫',
              promotionalPrice: isNaN(promoNum) ? 0 : promoNum,
              unit: form.unit,
              image: form.imagePreview || d.image,
              status: form.status,
              notes: (form.notes || '').trim(),
            }
          : d
      )
    );
    closeEditModal();
  };

  const toggleStatus = (row) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === row.id ? { ...d, status: !d.status } : d))
    );
  };

  return (
    <div className="menu-management-section">
      <div className="menu-section-toolbar">
        <div className="menu-search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="menu-search-input"
          />
        </div>
        <div className="menu-filters">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`menu-filter-btn ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button type="button" className="menu-btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          Thêm món mới
        </button>
      </div>

      <div className="menu-table-card">
        <table className="menu-table">
          <thead>
            <tr>
              <th>HÌNH ẢNH</th>
              <th>TÊN MÓN</th>
              <th>DANH MỤC</th>
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
                <td className="menu-cell-name">{row.name}</td>
                <td>
                  <span className="menu-category-tag">{row.category || (row.categories && row.categories[0]) || '—'}</span>
                </td>
                <td className="menu-cell-price">{row.priceDisplay}</td>
                <td>
                  <button
                    type="button"
                    className={`menu-toggle ${row.status ? 'active' : ''}`}
                    aria-label="Toggle"
                    onClick={() => toggleStatus(row)}
                  >
                    <span className="menu-toggle-thumb" />
                  </button>
                </td>
                <td>
                  <div className="menu-actions-cell">
                    <button
                      type="button"
                      className="menu-icon-btn"
                      aria-label="Sửa"
                      onClick={() => openEditModal(row)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="menu-icon-btn menu-icon-btn-danger"
                      aria-label="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="menu-pagination">
          <span>Hiển thị 1-{filtered.length} trên {dishes.length} món ăn</span>
          <div className="menu-pagination-btns">
            <button type="button" className="menu-page-btn" disabled>‹</button>
            <button type="button" className="menu-page-btn active">1</button>
            <button type="button" className="menu-page-btn">›</button>
          </div>
        </div>
      </div>

      {/* Modal Thêm món ăn mới */}
      {addModalOpen && (
        <div
          className="dish-modal-overlay"
          onClick={closeAddModal}
          onKeyDown={(e) => e.key === 'Escape' && closeAddModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-add-title"
        >
          <div className="dish-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dish-modal-head">
              <h2 id="dish-add-title" className="dish-modal-title">Thêm món ăn mới</h2>
              <button type="button" className="dish-modal-close" onClick={closeAddModal} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
            <div className="dish-modal-form">
              <div className="dish-form-grid">
                <div className="dish-form-left">
                  <div className="dish-form-group">
                    <label htmlFor="add-name">Tên món ăn <span className="dish-required">*</span></label>
                    <input
                      id="add-name"
                      type="text"
                      placeholder="Ví dụ: Salad Cá Hồi Sốt Mè"
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                    />
                  </div>
                  <div className="dish-form-group">
                    <label>Hình ảnh món ăn</label>
                    <label className="dish-upload-zone">
                      <input
                        ref={addFileRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="dish-upload-input"
                        onChange={(e) => handleAddImage(e, false)}
                      />
                      {form.imagePreview ? (
                        <div className="dish-upload-preview">
                          <img src={form.imagePreview} alt="Preview" />
                        </div>
                      ) : (
                        <div className="dish-upload-placeholder">
                          <UploadCloud size={40} style={{ color: '#FF6C1F' }} />
                          <span>Kéo thả hoặc nhấn để tải lên</span>
                          <span className="dish-upload-hint">PNG, JPG tối đa 5MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="dish-form-group">
                    <label htmlFor="add-desc">Miêu tả</label>
                    <textarea
                      id="add-desc"
                      placeholder="Mô tả ngắn gọn về hương vị, thành phần..."
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="dish-form-right">
                  <div className="dish-form-group">
                    <label htmlFor="add-price">Giá bán <span className="dish-required">*</span></label>
                    <div className="dish-price-wrap">
                      <input
                        id="add-price"
                        type="text"
                        value={form.price}
                        onChange={(e) => updateForm('price', e.target.value)}
                        placeholder="0"
                      />
                      <span className="dish-currency">đ</span>
                    </div>
                  </div>
                  <div className="dish-form-group">
                    <label htmlFor="add-unit">Đơn vị tính</label>
                    <select
                      id="add-unit"
                      value={form.unit}
                      onChange={(e) => updateForm('unit', e.target.value)}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dish-form-group">
                    <label>Chọn Danh mục (Chọn ít nhất 1) <span className="dish-required">*</span></label>
                    <div className="dish-categories-grid">
                      {DISH_CATEGORIES.map((cat) => (
                        <label key={cat} className="dish-checkbox-label">
                          <input
                            type="checkbox"
                            checked={form.categories.includes(cat)}
                            onChange={() => handleCategoryToggle(cat)}
                          />
                          <span>{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="dish-form-group">
                    <label htmlFor="add-notes">Ghi chú</label>
                    <textarea
                      id="add-notes"
                      placeholder="Ghi chú nội bộ cho bếp hoặc phục vụ..."
                      value={form.notes}
                      onChange={(e) => updateForm('notes', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="dish-modal-actions">
                <button type="button" className="dish-btn-cancel" onClick={closeAddModal}>Hủy</button>
                <button type="button" className="dish-btn-primary" onClick={handleSaveNew}>Lưu món ăn</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa thông tin món ăn */}
      {editModalOpen && editingDish && (
        <div
          className="dish-modal-overlay"
          onClick={closeEditModal}
          onKeyDown={(e) => e.key === 'Escape' && closeEditModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-edit-title"
        >
          <div className="dish-modal dish-modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="dish-modal-head">
              <h2 id="dish-edit-title" className="dish-modal-title">Chỉnh sửa thông tin món ăn</h2>
              <button type="button" className="dish-modal-close" onClick={closeEditModal} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
            <div className="dish-modal-form">
              <div className="dish-form-grid">
                <div className="dish-form-left">
                  <div className="dish-form-group">
                    <label>Hình ảnh món ăn</label>
                    <label className="dish-upload-zone">
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="dish-upload-input"
                        onChange={(e) => handleAddImage(e, true)}
                      />
                      {form.imagePreview ? (
                        <div className="dish-upload-preview">
                          <img src={form.imagePreview} alt="Preview" />
                        </div>
                      ) : (
                        <div className="dish-upload-placeholder">
                          <UploadCloud size={40} style={{ color: '#9ca3af' }} />
                          <span>Kéo thả hoặc nhấn để thay đổi ảnh</span>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="dish-form-group">
                    <label htmlFor="edit-name">Tên món ăn <span className="dish-required">*</span></label>
                    <input
                      id="edit-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                    />
                  </div>
                  <div className="dish-form-group">
                    <label htmlFor="edit-desc">Miêu tả</label>
                    <textarea
                      id="edit-desc"
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="dish-form-right">
                  <div className="dish-form-group">
                    <label htmlFor="edit-price">Giá bán (VNĐ) <span className="dish-required">*</span></label>
                    <input
                      id="edit-price"
                      type="text"
                      value={form.price}
                      onChange={(e) => updateForm('price', e.target.value)}
                    />
                  </div>
                  <div className="dish-form-group">
                    <label htmlFor="edit-promo">Giá khuyến mãi</label>
                    <input
                      id="edit-promo"
                      type="text"
                      value={form.promotionalPrice}
                      onChange={(e) => updateForm('promotionalPrice', e.target.value)}
                    />
                  </div>
                  <div className="dish-form-group">
                    <label htmlFor="edit-unit">Đơn vị tính</label>
                    <select
                      id="edit-unit"
                      value={form.unit}
                      onChange={(e) => updateForm('unit', e.target.value)}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dish-form-group dish-toggle-wrap">
                    <label className="dish-toggle-label">Trạng thái (Còn món)</label>
                    <button
                      type="button"
                      className={`menu-toggle ${form.status ? 'active' : ''}`}
                      onClick={() => updateForm('status', !form.status)}
                      aria-label="Trạng thái"
                    >
                      <span className="menu-toggle-thumb" />
                    </button>
                  </div>
                  <div className="dish-form-group">
                    <label>Chọn danh mục <span className="dish-required">*</span></label>
                    <div className="dish-categories-grid">
                      {DISH_CATEGORIES.map((cat) => (
                        <label key={cat} className="dish-checkbox-label">
                          <input
                            type="checkbox"
                            checked={form.categories.includes(cat)}
                            onChange={() => handleCategoryToggle(cat)}
                          />
                          <span>{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="dish-form-group">
                    <label htmlFor="edit-notes">Ghi chú</label>
                    <textarea
                      id="edit-notes"
                      placeholder="Ghi chú cho bếp..."
                      value={form.notes}
                      onChange={(e) => updateForm('notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              <div className="dish-modal-actions">
                <button type="button" className="dish-btn-cancel" onClick={closeEditModal}>Hủy</button>
                <button type="button" className="dish-btn-primary" onClick={handleSaveEdit}>Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenuFood;
