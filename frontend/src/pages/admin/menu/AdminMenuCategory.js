import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, X, FileImage } from 'lucide-react';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
} from '../../../api/categoryApi';
import '../../../styles/AdminMenuManagement.css';

const defaultCategoryForm = () => ({
  name: '',
  description: '',
  imageFile: null,
  imagePreview: null,
  isProcessedGoods: false,
  isAvailable: true,
});

const normalize = (raw) => ({
  categoryId:        raw.categoryId ?? raw.id ?? null,
  name:              raw.name ?? '',
  description:       raw.description ?? '',
  image:             raw.image ?? null,
  isProcessedGoods:  raw.isProcessedGoods ?? false,
  isAvailable:       raw.isAvailable ?? true,
  createdAt:         raw.createdAt ?? null,
});

const AdminMenuCategory = () => {
  const [categories, setCategories]   = useState([]);
  const [search, setSearch]          = useState('');
  const [loading, setLoading]        = useState(true);
  const [saving, setSaving]          = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory]    = useState(null);
  const [categoryForm, setCategoryForm]          = useState(defaultCategoryForm());

  // ── Load categories ──
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AdminMenuCategory] load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Filter ──
  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Toggle status ──
  const handleToggleStatus = async (row) => {
    const id = row.categoryId;
    if (id == null) return;
    const next = !row.isAvailable;
    const action = next ? 'bật' : 'tắt';

    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.categoryId === id ? { ...c, isAvailable: next } : c))
    );
    setTogglingId(id);

    try {
      await toggleCategoryStatus(id, next);
      console.info(`[AdminMenuCategory] Toggle OK — id:${id} → isAvailable:${next}`);
    } catch (e) {
      // Revert optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.categoryId === id ? { ...c, isAvailable: !next } : c))
      );
      console.error('[AdminMenuCategory] toggle error:', e);
      const serverMsg = e?.response?.data?.message;
      if (serverMsg) {
        alert(`❌ Lỗi: ${serverMsg}`);
      } else {
        alert(`❌ Không thể ${action} trạng thái.\nVui lòng thử lại.`);
      }
    } finally {
      setTogglingId(null);
    }
  };

  // ── Open modal ──
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm(defaultCategoryForm());
    setCategoryModalOpen(true);
  };

  const openEditCategory = (row) => {
    setEditingCategory(row);
    setCategoryForm({
      name:             row.name,
      description:      row.description || '',
      imageFile:        null,
      imagePreview:     row.image || null,
      isProcessedGoods: row.isProcessedGoods ?? false,
      isAvailable:      row.isAvailable ?? true,
    });
    setCategoryModalOpen(true);
  };

  // ── Save (create / update) ──
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name:              categoryForm.name.trim(),
        description:        categoryForm.description.trim() || null,
        isProcessedGoods:  categoryForm.isProcessedGoods,
        image:             categoryForm.imagePreview || null,
        isAvailable:       categoryForm.isAvailable,
      };
      console.info('[AdminMenuCategory] Save payload:', payload);

      if (editingCategory) {
        const updated = await updateCategory(editingCategory.categoryId, payload);
        const norm = normalize(updated);
        setCategories((prev) =>
          prev.map((c) => c.categoryId === editingCategory.categoryId ? norm : c)
        );
        alert('✅ Cập nhật danh mục thành công!');
      } else {
        const created = await createCategory(payload);
        const norm = normalize(created);
        setCategories((prev) => [norm, ...prev]);
        alert('✅ Thêm danh mục mới thành công!');
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm(defaultCategoryForm());
    } catch (err) {
      console.error('[AdminMenuCategory] save error:', err);
      const serverMsg = err?.response?.data?.message;
      if (serverMsg) {
        alert(`❌ Lỗi: ${serverMsg}`);
      } else {
        alert('❌ Lưu thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm(defaultCategoryForm());
  };

  return (
    <div className="menu-management-section">
      {/* ── Toolbar ── */}
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
        <button
          type="button"
          className="menu-btn-primary"
          onClick={openAddCategory}
        >
          <Plus size={18} />
          Thêm danh mục mới
        </button>
      </div>

      {/* ── Table ── */}
      <div className="menu-table-card">
        {loading ? (
          <div className="menu-loading-state">
            <div className="Spinner"></div>
            <p>Đang tải danh mục...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="menu-empty-state">
            <p>Không có danh mục nào.</p>
          </div>
        ) : (
          <>
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
                  <tr key={row.categoryId}>
                    <td>
                      <div className="menu-table-img">
                        {row.image ? (
                          <img src={row.image} alt={row.name} />
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </td>
                    <td className="menu-cell-name">{row.name}</td>
                    <td className="menu-cell-desc">{row.description || '—'}</td>
                    <td>
                      <div className="menu-category-status-cell">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!!row.isAvailable}
                          aria-busy={togglingId === row.categoryId}
                          className={`menu-toggle menu-toggle--table ${row.isAvailable ? 'active' : ''} ${togglingId === row.categoryId ? 'busy' : ''}`}
                          onClick={() => handleToggleStatus(row)}
                          disabled={togglingId === row.categoryId}
                          title={
                            row.isAvailable
                              ? 'Đang hoạt động — bấm để tắt'
                              : 'Ngừng hoạt động — bấm để bật'
                          }
                        >
                          <span className="menu-toggle-thumb" />
                        </button>
                        <span
                          className={`menu-category-status-text ${row.isAvailable ? 'on' : 'off'}`}
                        >
                          {togglingId === row.categoryId
                            ? 'Đang cập nhật…'
                            : row.isAvailable
                              ? 'Đang hoạt động'
                              : 'Ngừng hoạt động'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="menu-actions-cell">
                        <button
                          type="button"
                          className="menu-icon-btn"
                          aria-label="Sửa"
                          title="Sửa"
                          onClick={() => openEditCategory(row)}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="menu-pagination">
              <span>
                Hiển thị {filtered.length} / {categories.length} danh mục
              </span>
              <div className="menu-pagination-btns">
                <button type="button" className="menu-page-btn" disabled>‹</button>
                <button type="button" className="menu-page-btn active">1</button>
                <button type="button" className="menu-page-btn">›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {categoryModalOpen && (
        <div
          className="category-modal-overlay"
          onClick={closeModal}
        >
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="category-modal-head">
              <h2 className="category-modal-title">
                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button
                type="button"
                className="category-modal-close"
                onClick={closeModal}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="category-modal-form">
              {/* Image */}
              <div className="category-form-group">
                <label>Ảnh danh mục</label>
                <label className="category-upload-zone">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="category-upload-input"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size > 2 * 1024 * 1024) {
                        window.alert('File tối đa 2MB.');
                        return;
                      }
                      if (f) {
                        setCategoryForm((prev) => ({
                          ...prev,
                          imageFile: f,
                          imagePreview: URL.createObjectURL(f),
                        }));
                      }
                    }}
                  />
                  {categoryForm.imagePreview ? (
                    <div className="category-upload-preview">
                      <img src={categoryForm.imagePreview} alt="" />
                    </div>
                  ) : (
                    <div className="category-upload-placeholder">
                      <FileImage size={32} />
                      <span>Chọn ảnh</span>
                    </div>
                  )}
                </label>
                <p className="category-upload-hint">Định dạng: JPG, PNG. Tối đa 2MB</p>
              </div>

              {/* Name */}
              <div className="category-form-group">
                <label>
                  Tên danh mục <span className="combo-required">*</span>
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ví dụ: Món chính"
                  required
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="category-form-group">
                <label>Mô tả</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Mô tả ngắn về danh mục..."
                  rows={2}
                />
              </div>

              {/* Is Processed Goods */}
              <div className="category-form-group">
                <div className="category-toggle-wrap">
                  <label className="category-toggle-label">Món cần chế biến</label>
                  <p className="category-toggle-sublabel">
                    Món ăn cần qua quy trình chế biến tại bếp
                  </p>
                  <button
                    type="button"
                    className={`menu-toggle ${categoryForm.isProcessedGoods ? 'active' : ''}`}
                    onClick={() =>
                      setCategoryForm((f) => ({
                        ...f,
                        isProcessedGoods: !f.isProcessedGoods,
                      }))
                    }
                    aria-label="Bật/tắt món cần chế biến"
                  >
                    <span className="menu-toggle-thumb" />
                  </button>
                </div>
              </div>

              {/* Available Status */}
              <div className="category-form-group">
                <div className="category-toggle-wrap">
                  <label className="category-toggle-label">Trạng thái hoạt động</label>
                  <p className="category-toggle-sublabel">
                    {categoryForm.isAvailable ? 'Hiển thị với khách hàng' : 'Ẩn với khách hàng'}
                  </p>
                  <button
                    type="button"
                    className={`menu-toggle ${categoryForm.isAvailable ? 'active' : ''}`}
                    onClick={() =>
                      setCategoryForm((f) => ({
                        ...f,
                        isAvailable: !f.isAvailable,
                      }))
                    }
                    aria-label="Bật/tắt trạng thái"
                  >
                    <span className="menu-toggle-thumb" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="category-modal-actions">
                <button
                  type="button"
                  className="combo-btn-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="menu-btn-primary"
                  disabled={saving || !categoryForm.name.trim()}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminMenuCategory;
