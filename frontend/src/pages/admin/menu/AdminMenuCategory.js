import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, FileImage } from 'lucide-react';
import '../../../styles/AdminMenuManagement.css';

const MOCK_CATEGORIES = [
  { id: 1, name: 'Khai vị', description: 'Các món ăn nhẹ trước bữa chính', image: 'https://picsum.photos/seed/appetizer/80/80', status: 'active', isProcessedDish: false },
  { id: 2, name: 'Món chính', description: 'Các món ăn chính đặc sắc của nhà hàng phục vụ từ 10h sáng.', image: 'https://picsum.photos/seed/maincourse/80/80', status: 'active', isProcessedDish: true },
  { id: 3, name: 'Đồ uống', description: 'Cà phê, trà, nước ép và đồ uống có cồn', image: 'https://picsum.photos/seed/drinks/80/80', status: 'inactive', isProcessedDish: false },
  { id: 4, name: 'Tráng miệng', description: 'Bánh ngọt, trái cây và các loại kem', image: 'https://picsum.photos/seed/dessert/80/80', status: 'active', isProcessedDish: true }
];

const defaultCategoryForm = () => ({ name: '', description: '', imageFile: null, imagePreview: null, isProcessedDish: false });

const AdminMenuCategory = () => {
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [search, setSearch] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);

  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm(defaultCategoryForm());
    setCategoryModalOpen(true);
  };

  const openEditCategory = (row) => {
    setEditingCategory(row);
    setCategoryForm({
      name: row.name,
      description: row.description || '',
      imageFile: null,
      imagePreview: row.image || null,
      isProcessedDish: row.isProcessedDish ?? false,
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    const imageUrl = categoryForm.imageFile ? categoryForm.imagePreview : (editingCategory?.image || null);
    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: categoryForm.name, description: categoryForm.description, image: imageUrl, isProcessedDish: categoryForm.isProcessedDish }
            : c
        )
      );
    } else {
      const newId = Math.max(...categories.map((c) => c.id), 0) + 1;
      setCategories((prev) => [
        ...prev,
        { id: newId, name: categoryForm.name, description: categoryForm.description, image: imageUrl, status: 'active', isProcessedDish: categoryForm.isProcessedDish },
      ]);
    }
    setCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm(defaultCategoryForm());
  };

  return (
    <div className="menu-management-section">
      <div className="menu-section-toolbar">
        <div className="menu-search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="menu-search-input"
          />
        </div>
        <button type="button" className="menu-btn-primary" onClick={openAddCategory}>
          <Plus size={18} />
          Thêm danh mục mới
        </button>
      </div>

      <div className="menu-table-card">
        <table className="menu-table">
          <thead>
            <tr>
              <th>HÌNH ẢNH</th>
              <th>TÊN DANH MỤC</th>
              <th>MÔ TẢ</th>
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
                <td className="menu-cell-desc">{row.description}</td>
                <td>
                  <span className={`menu-status-pill ${row.status === 'active' ? 'active' : 'inactive'}`}>
                    {row.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="menu-actions-cell">
                    <button type="button" className="menu-icon-btn" aria-label="Sửa" onClick={() => openEditCategory(row)}><Pencil size={16} /></button>
                    <button type="button" className="menu-icon-btn menu-icon-btn-danger" aria-label="Xóa"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="menu-pagination">
          <span>Hiển thị 1-{filtered.length} trên {categories.length} danh mục</span>
          <div className="menu-pagination-btns">
            <button type="button" className="menu-page-btn" disabled>‹</button>
            <button type="button" className="menu-page-btn active">1</button>
            <button type="button" className="menu-page-btn">›</button>
          </div>
        </div>
      </div>

      {categoryModalOpen && (
        <div className="category-modal-overlay" onClick={() => { setCategoryModalOpen(false); setEditingCategory(null); setCategoryForm(defaultCategoryForm()); }}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="category-modal-head">
              <h2 className="category-modal-title">{editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h2>
              <button type="button" className="category-modal-close" onClick={() => { setCategoryModalOpen(false); setEditingCategory(null); setCategoryForm(defaultCategoryForm()); }} aria-label="Đóng"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="category-modal-form">
              <div className="category-form-group">
                <label>Ảnh danh mục</label>
                <label className="category-upload-zone">
                  <input type="file" accept="image/jpeg,image/png,image/jpg" className="category-upload-input" onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size <= 2 * 1024 * 1024) setCategoryForm((prev) => ({ ...prev, imageFile: f, imagePreview: URL.createObjectURL(f) })); else if (f) window.alert('File tối đa 2MB.'); }} />
                  {categoryForm.imagePreview ? (
                    <div className="category-upload-preview"><img src={categoryForm.imagePreview} alt="" /></div>
                  ) : (
                    <div className="category-upload-placeholder">
                      <FileImage size={32} />
                      <span>Chọn ảnh</span>
                    </div>
                  )}
                </label>
                <p className="category-upload-hint">Định dạng: JPG, PNG. Tối đa 2MB</p>
              </div>
              <div className="category-form-group">
                <label>Tên danh mục <span className="combo-required">*</span></label>
                <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ví dụ: Món chính" required />
              </div>
              <div className="category-form-group">
                <label>Mô tả</label>
                <textarea value={categoryForm.description} onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về danh mục..." rows={2} />
              </div>
              <div className="category-form-group">
                <div className="category-toggle-wrap">
                  <label className="category-toggle-label">Là món chế biến</label>
                  <p className="category-toggle-sublabel">Món ăn cần qua quy trình chế biến tại bếp</p>
                  <button type="button" className={`menu-toggle ${categoryForm.isProcessedDish ? 'active' : ''}`} onClick={() => setCategoryForm((f) => ({ ...f, isProcessedDish: !f.isProcessedDish }))} aria-label="Bật/tắt">
                    <span className="menu-toggle-thumb" />
                  </button>
                </div>
              </div>
              <div className="category-modal-actions">
                <button type="button" className="combo-btn-cancel" onClick={() => { setCategoryModalOpen(false); setEditingCategory(null); setCategoryForm(defaultCategoryForm()); }}>Hủy</button>
                <button type="submit" className="menu-btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenuCategory;
