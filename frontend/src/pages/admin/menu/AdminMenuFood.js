import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus, Search, Pencil, Trash2, X, UploadCloud, AlertCircle,
  CheckCircle, RefreshCw
} from 'lucide-react';
import {
  getAllFoods,
  createFood,
  updateFood,
  deleteFood,
  toggleFoodStatus,
  getCategoryLists,
  resolveFoodImageUrl
} from '../../../api/foodApi';
import '../../../styles/AdminMenuManagement.css';

const FIXED_PRODUCT_IMAGE = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';
const UNITS = ['Dĩa', 'Phần', 'Ly', 'Tô', 'Cái', 'Kg', 'Chai', 'Bình', 'Nắm'];

const defaultDishForm = () => ({
  name: '',
  imageFile: null,
  imagePreview: null,
  image: '',         // URL ảnh cũ khi edit (nếu không đổi ảnh)
  description: '',
  price: '',
  unit: 'Dĩa',
  categoryId: null,
  categories: [],     // tên danh mục (string) — hiển thị trên UI
  notes: '',
  status: true,
  promotionalPrice: '',
});

function formatPrice(n) {
  if (n === '' || n == null) return '';
  const num = typeof n === 'number' ? n : parseInt(String(n).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN');
}

/** Chuẩn hóa 1 dòng từ GET /api/food (Swagger: foodId, isAvailable, promotionalPrice, image path, ...) */
function normalizeFood(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const cats = [];
  if (raw.categoryName) cats.push(String(raw.categoryName));
  if (raw.category && typeof raw.category === 'object' && raw.category.name) {
    cats.push(String(raw.category.name));
  }
  if (typeof raw.category === 'string' && raw.category.trim()) cats.push(raw.category.trim());
  if (raw.categories) {
    if (typeof raw.categories === 'string') cats.push(raw.categories);
    else if (Array.isArray(raw.categories)) {
      raw.categories.forEach((x) => {
        if (typeof x === 'string' && x) cats.push(x);
        else if (x && typeof x === 'object' && x.name) cats.push(String(x.name));
      });
    }
  }
  const uniqueCats = [...new Set(cats.filter(Boolean))];

  const price = Number(raw.price) || 0;
  const promo = Number(raw.promotionalPrice);
  const hasPromo = Number.isFinite(promo) && promo > 0 && promo < price;

  // Swagger: isAvailable — ưu tiên hơn field status cũ
  let active = true;
  if (raw.isAvailable !== undefined && raw.isAvailable !== null) {
    active = raw.isAvailable === true || raw.isAvailable === 1 || raw.isAvailable === 'true';
  } else {
    active = raw.status !== false && raw.status !== 0;
  }

  return {
    id: raw.foodId ?? raw.id ?? null,
    foodId: raw.foodId ?? raw.id ?? null,
    name: raw.name ?? '',
    description: raw.description ?? '',
    category: uniqueCats[0] ?? '—',
    categories: uniqueCats,
    price,
    priceDisplay: hasPromo
      ? `${formatPrice(promo)}₫`
      : `${formatPrice(price)}₫`,
    priceListDisplay: hasPromo ? `${formatPrice(price)}₫` : null,
    unit: raw.unit ?? 'Dĩa',
    image: raw.image ?? '',
    imageUrl: resolveFoodImageUrl(raw.image),
    status: active,
    isAvailable: raw.isAvailable,
    isDirectSale: raw.isDirectSale === true,
    isFeatured: raw.isFeatured === true,
    preparationTime: raw.preparationTime != null ? Number(raw.preparationTime) : null,
    notes: raw.notes ?? '',
    promotionalPrice: Number.isFinite(promo) ? promo : 0,
  };
}

/** Lấy categoryId từ categoryName (dựa vào categories đã load) */
function categoryLabel(c) {
  return (c?.name ?? c?.categoryName ?? c?.title ?? '').trim();
}

function findCategoryIdByName(name, categories) {
  const n = String(name).toLowerCase().trim();
  const found = categories.find((c) => categoryLabel(c).toLowerCase() === n);
  return found ? found.categoryId ?? found.id : null;
}

/** Lấy categoryName từ categoryId */
const AdminMenuFood = () => {
  /* ── State dữ liệu ── */
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'

  /* ── Filter / Search ── */
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  /* ── Modal thêm ── */
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState(defaultDishForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const addFileRef = useRef(null);

  /* ── Modal sửa ── */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formE, setFormE] = useState(defaultDishForm());
  const [formELoading, setFormELoading] = useState(false);
  const [formEErrors, setFormEErrors] = useState({});
  const editFileRef = useRef(null);

  /* ── Modal xóa ── */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingFood, setDeletingFood] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Toggle status đang xử lý ── */
  const [toggleBusyId, setToggleBusyId] = useState(null);

  /* ── Load dữ liệu ── */
  const loadData = useCallback(async (options = {}) => {
    if (!options.silent) {
      setLoading(true);
      setApiError('');
    }
    try {
      // GET /api/food — nguồn chính (Swagger)
      const foodList = await getAllFoods();
      const normFoods = (Array.isArray(foodList) ? foodList : [])
        .map(normalizeFood)
        .filter(Boolean);
      setFoods(normFoods);

      // Danh mục: tùy chọn, không chặn danh sách món nếu lỗi
      try {
        const catList = await getCategoryLists();
        const rawCats = Array.isArray(catList)
          ? catList
          : catList?.$values || catList?.items || catList?.data || [];
        setCategories(rawCats);
      } catch (catErr) {
        console.warn('[AdminMenuFood] getCategoryLists:', catErr?.message || catErr);
        setCategories([]);
      }
    } catch (e) {
      setApiError(e?.response?.data?.message || e?.message || 'Không tải được danh sách món ăn (GET /api/food).');
      setFoods([]);
    } finally {
      if (!options.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Toast auto-clear ── */
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  /* ── Filtered list ── */
  const filtered = foods.filter((d) => {
    const matchSearch = !search || (d.name || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || d.categories.includes(categoryFilter) || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  /* ── Helpers form ── */
  const setFormErrorsFn = (setter) => (errors) => setter(typeof errors === 'function' ? errors({}) : errors);
  const updateForm = (setter) => (field, value) => setter((prev) => ({ ...prev, [field]: value }));
  const availableCategoryNames = useMemo(
    () => [...new Set(categories.map(categoryLabel).filter(Boolean))],
    [categories]
  );

  const validateForm = (f) => {
    const e = {};
    if (!(f.name || '').trim()) e.name = 'Tên món ăn bắt buộc.';
    if (!f.price || isNaN(Number(String(f.price).replace(/\D/g, '')))) e.price = 'Giá bán bắt buộc và phải là số.';
    if (availableCategoryNames.length > 0 && !f.categories.length) {
      e.categories = 'Phải chọn ít nhất 1 danh mục.';
    }
    return e;
  };

  /* ── Image handling ── */
  const handleImageFile = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      setter((prev) => ({ ...prev, imageFile: null, imagePreview: null }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setter((prev) => ({ ...prev, imageFile: null, imagePreview: null }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter((prev) => ({ ...prev, imageFile: file, imagePreview: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (setter) => {
    setter((prev) => ({ ...prev, imageFile: null, imagePreview: null, image: '' }));
  };

  /* ── Category toggle ── */
  const handleCategoryToggle = (catName, setter) => {
    setter((prev) => {
      const next = prev.categories.includes(catName)
        ? prev.categories.filter((c) => c !== catName)
        : [...prev.categories, catName];
      const catId = findCategoryIdByName(next[0], categories);
      return { ...prev, categories: next, categoryId: catId };
    });
  };

  /* ── OPEN MODALS ── */
  const openAddModal = () => {
    setForm({ ...defaultDishForm(), categories: [], categoryId: null });
    setFormErrors({});
    setAddModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingFood(row);
    const initForm = {
      name: row.name || '',
      imageFile: null,
      imagePreview: row.imageUrl && row.imageUrl !== FIXED_PRODUCT_IMAGE ? row.imageUrl : null,
      image: row.image || '',
      description: row.description || '',
      price: String(row.price || ''),
      unit: row.unit || 'Dĩa',
      categoryId: null,
      categories: [...(row.categories || [])],
      notes: row.notes || '',
      status: row.status !== false,
      promotionalPrice: row.promotionalPrice != null ? String(row.promotionalPrice) : '0',
    };
    setFormE(initForm);
    setFormEErrors({});
    setEditModalOpen(true);
  };

  const openDeleteModal = (row) => {
    setDeletingFood(row);
    setDeleteModalOpen(true);
  };

  /* ── SAVE NEW ── */
  const handleSaveNew = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(String(form.price).replace(/\D/g, '')) || 0,
        unit: form.unit,
        categoryId: form.categoryId,
        status: form.status,
        image: '',
        imageFile: form.imageFile,
        notes: form.notes.trim(),
      };
      await createFood(payload);
      setToastMsg('Thêm món ăn thành công!');
      setToastType('success');
      setAddModalOpen(false);
      await loadData({ silent: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Thêm món ăn thất bại.';
      setFormErrors({ _api: msg });
    } finally {
      setFormLoading(false);
    }
  };

  /* ── SAVE EDIT ── */
  const handleSaveEdit = async () => {
    if (!editingFood) return;
    const errs = validateForm(formE);
    if (Object.keys(errs).length) { setFormEErrors(errs); return; }
    setFormELoading(true);
    try {
      const payload = {
        name: formE.name.trim(),
        description: formE.description.trim(),
        price: Number(String(formE.price).replace(/\D/g, '')) || 0,
        unit: formE.unit,
        categoryId: formE.categoryId,
        status: formE.status,
        image: formE.image || '',
        imageFile: formE.imageFile,
        notes: formE.notes.trim(),
      };
      await updateFood(editingFood.id, payload);
      setToastMsg('Cập nhật món ăn thành công!');
      setToastType('success');
      setEditModalOpen(false);
      await loadData({ silent: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Cập nhật món ăn thất bại.';
      setFormEErrors({ _api: msg });
    } finally {
      setFormELoading(false);
    }
  };

  /* ── DELETE ── */
  const handleConfirmDelete = async () => {
    if (!deletingFood) return;
    setDeleteLoading(true);
    try {
      await deleteFood(deletingFood.id);
      setToastMsg('Xóa món ăn thành công!');
      setToastType('success');
      setDeleteModalOpen(false);
      setDeletingFood(null);
      await loadData({ silent: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Xóa món ăn thất bại.';
      setToastMsg(msg);
      setToastType('error');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── TOGGLE STATUS ── */
  const handleToggleStatus = async (row) => {
    setToggleBusyId(row.id);
    try {
      await toggleFoodStatus(row.id, !row.status);
      setToastMsg(`Đã ${!row.status ? 'bật' : 'tắt'} kinh doanh món "${row.name}".`);
      setToastType('success');
      await loadData({ silent: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Không cập nhật được trạng thái.';
      setToastMsg(msg);
      setToastType('error');
    } finally {
      setToggleBusyId(null);
    }
  };

  /* ── Category filter buttons ── */
  const filterCats = useMemo(
    () => [
      ...new Set([
        ...categories.map(categoryLabel).filter(Boolean),
        ...foods.flatMap((f) => f.categories || [])
      ])
    ],
    [categories, foods]
  );

  /* ── Render helpers ── */
  const renderFormModal = (
    isEdit,
    open,
    onClose,
    formState,
    setFormState,
    formErrorsState,
    onSave,
    loading,
    fileRef
  ) => {
    if (!open) return null;
    return (
      <div className="dish-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="dish-modal" onClick={(e) => e.stopPropagation()}>
          <div className="dish-modal-head">
            <h2 className="dish-modal-title">{isEdit ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}</h2>
            <button type="button" className="dish-modal-close" onClick={onClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>
          <div className="dish-modal-form">
            {formErrorsState._api && (
              <div className="dish-api-error">
                <AlertCircle size={16} />
                <span>{formErrorsState._api}</span>
              </div>
            )}
            <div className="dish-form-grid">
              {/* LEFT: Tên, Ảnh, Mô tả */}
              <div className="dish-form-left">
                <div className="dish-form-group">
                  <label htmlFor={`${isEdit ? 'edit' : 'add'}-name`}>
                    Tên món ăn <span className="dish-required">*</span>
                  </label>
                  <input
                    id={`${isEdit ? 'edit' : 'add'}-name`}
                    type="text"
                    placeholder="Ví dụ: Salad Cá Hồi Sốt Mè"
                    value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    className={formErrorsState.name ? 'input-error' : ''}
                  />
                  {formErrorsState.name && <span className="dish-field-error">{formErrorsState.name}</span>}
                </div>
                <div className="dish-form-group">
                  <label>Hình ảnh món ăn</label>
                  <label className="dish-upload-zone">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="dish-upload-input"
                      onChange={(e) => handleImageFile(e, setFormState)}
                    />
                    {formState.imagePreview ? (
                      <div className="dish-upload-preview">
                        <img src={formState.imagePreview} alt="Preview" />
                        <button
                          type="button"
                          className="dish-upload-remove"
                          onClick={(e) => { e.preventDefault(); handleRemoveImage(setFormState); }}
                          aria-label="Xóa ảnh"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="dish-upload-placeholder">
                        <UploadCloud size={40} style={{ color: '#FF6C1F' }} />
                        <span>Kéo thả hoặc nhấn để tải lên</span>
                        <span className="dish-upload-hint">PNG, JPG, WEBP tối đa 5MB</span>
                      </div>
                    )}
                  </label>
                </div>
                <div className="dish-form-group">
                  <label htmlFor={`${isEdit ? 'edit' : 'add'}-desc`}>Miêu tả</label>
                  <textarea
                    id={`${isEdit ? 'edit' : 'add'}-desc`}
                    placeholder="Mô tả ngắn gọn về hương vị, thành phần..."
                    value={formState.description}
                    onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              {/* RIGHT: Giá, ĐVT, Danh mục, Ghi chú */}
              <div className="dish-form-right">
                <div className="dish-form-group">
                  <label htmlFor={`${isEdit ? 'edit' : 'add'}-price`}>
                    Giá bán (VNĐ) <span className="dish-required">*</span>
                  </label>
                  <div className="dish-price-wrap">
                    <input
                      id={`${isEdit ? 'edit' : 'add'}-price`}
                      type="text"
                      value={formState.price}
                      onChange={(e) => setFormState((p) => ({ ...p, price: e.target.value }))}
                      placeholder="0"
                      className={formErrorsState.price ? 'input-error' : ''}
                    />
                    <span className="dish-currency">đ</span>
                  </div>
                  {formErrorsState.price && <span className="dish-field-error">{formErrorsState.price}</span>}
                </div>
                <div className="dish-form-group">
                  <label htmlFor={`${isEdit ? 'edit' : 'add'}-unit`}>Đơn vị tính</label>
                  <select
                    id={`${isEdit ? 'edit' : 'add'}-unit`}
                    value={formState.unit}
                    onChange={(e) => setFormState((p) => ({ ...p, unit: e.target.value }))}
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="dish-form-group">
                  <label>Danh mục <span className="dish-required">*</span></label>
                  <div className="dish-categories-grid">
                    {filterCats.filter(Boolean).map((cat) => (
                      <label key={cat} className="dish-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formState.categories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat, setFormState)}
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                  {formErrorsState.categories && <span className="dish-field-error">{formErrorsState.categories}</span>}
                </div>
                {isEdit && (
                  <div className="dish-form-group dish-toggle-wrap">
                    <label className="dish-toggle-label">
                      {formState.status ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                    </label>
                    <button
                      type="button"
                      className={`menu-toggle ${formState.status ? 'active' : ''}`}
                      onClick={() => setFormState((p) => ({ ...p, status: !p.status }))}
                      aria-label="Trạng thái"
                    >
                      <span className="menu-toggle-thumb" />
                    </button>
                  </div>
                )}
                <div className="dish-form-group">
                  <label htmlFor={`${isEdit ? 'edit' : 'add'}-notes`}>Ghi chú</label>
                  <textarea
                    id={`${isEdit ? 'edit' : 'add'}-notes`}
                    placeholder="Ghi chú nội bộ cho bếp hoặc phục vụ..."
                    value={formState.notes}
                    onChange={(e) => setFormState((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="dish-modal-actions">
              <button type="button" className="dish-btn-cancel" onClick={onClose} disabled={loading}>
                Hủy
              </button>
              <button
                type="button"
                className="dish-btn-primary"
                onClick={onSave}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Lưu món ăn'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="menu-management-section">
      {/* ── Toolbar ── */}
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
          <button
            type="button"
            className={`menu-filter-btn ${categoryFilter === '' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('')}
          >
            Tất cả
          </button>
          {filterCats.filter(Boolean).map((cat) => (
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

      {/* ── Toast ── */}
      {toastMsg && (
        <div className={`kds-toast-msg ${toastType === 'error' ? 'kds-toast-msg--error' : ''}`} role="status">
          {toastType === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── API Error banner ── */}
      {apiError && (
        <div className="kds-api-error" role="alert">
          <AlertCircle size={20} />
          <span>{apiError}</span>
          <button type="button" className="menu-retry-btn" onClick={() => loadData()}>
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {/* ── Bảng món ăn ── */}
      <div className="menu-table-card">
        {loading ? (
          <div className="menu-loading-wrap">
            <RefreshCw size={32} className="spin" />
            <span>Đang tải danh sách món ăn...</span>
          </div>
        ) : (
          <>
            <table className="menu-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>HÌNH ẢNH</th>
                  <th>TÊN MÓN</th>
                  <th style={{ width: 130 }}>DANH MỤC</th>
                  <th style={{ width: 120 }}>GIÁ BÁN</th>
                  <th style={{ width: 100 }}>TRẠNG THÁI</th>
                  <th style={{ width: 100 }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="menu-empty-row">
                      {search || categoryFilter
                        ? 'Không có món ăn phù hợp với bộ lọc.'
                        : 'Chưa có món ăn nào. Nhấn "Thêm món mới" để bắt đầu.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className={!row.status ? 'row-inactive' : ''}>
                      <td>
                        <div className="menu-table-img">
                          {row.imageUrl && row.imageUrl !== FIXED_PRODUCT_IMAGE ? (
                            <img src={row.imageUrl} alt={row.name} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="menu-table-img-placeholder">
                              <span>{row.name?.[0]?.toUpperCase() ?? '?'}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="menu-cell-name">
                        <span className="menu-dish-name">
                          {row.name}
                          {row.isFeatured ? (
                            <span className="menu-featured-badge" title="Món nổi bật"> ★</span>
                          ) : null}
                        </span>
                        {row.description && (
                          <span className="menu-dish-desc">{row.description}</span>
                        )}
                        {row.preparationTime != null && row.preparationTime > 0 && (
                          <span className="menu-dish-meta">~{row.preparationTime} phút</span>
                        )}
                      </td>
                      <td>
                        <div className="menu-category-tags">
                          {row.categories.length ? (
                            row.categories.slice(0, 2).map((cat) => (
                              <span key={cat} className="menu-category-tag">{cat}</span>
                            ))
                          ) : (
                            <span className="menu-category-tag menu-category-tag--muted">—</span>
                          )}
                        </div>
                      </td>
                      <td className="menu-cell-price">
                        <span className="menu-price-main">{row.priceDisplay}</span>
                        {row.priceListDisplay && (
                          <span className="menu-price-old">{row.priceListDisplay}</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`menu-toggle ${row.status ? 'active' : ''}`}
                          aria-label="Toggle trạng thái"
                          disabled={toggleBusyId === row.id}
                          onClick={() => handleToggleStatus(row)}
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
                            onClick={() => openDeleteModal(row)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="menu-pagination">
              <span>
                Hiển thị {filtered.length} / {foods.length} món ăn
              </span>
              <div className="menu-pagination-btns">
                <button type="button" className="menu-page-btn" disabled>‹</button>
                <button type="button" className="menu-page-btn active">1</button>
                <button type="button" className="menu-page-btn" disabled>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal Thêm ── */}
      {renderFormModal(
        false,
        addModalOpen,
        () => { setAddModalOpen(false); },
        form,
        setForm,
        formErrors,
        handleSaveNew,
        formLoading,
        addFileRef
      )}

      {/* ── Modal Sửa ── */}
      {renderFormModal(
        true,
        editModalOpen,
        () => { setEditModalOpen(false); },
        formE,
        setFormE,
        formEErrors,
        handleSaveEdit,
        formELoading,
        editFileRef
      )}

      {/* ── Modal Xác nhận Xóa ── */}
      {deleteModalOpen && deletingFood && (
        <div className="kds-modal-overlay" onClick={() => !deleteLoading && setDeleteModalOpen(false)}>
          <div className="kds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header">
              <div className="modal-icon warning">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="kds-modal-title">
                  Xác nhận xóa món: <span className="highlight">{deletingFood.name}</span>
                </h3>
                <p className="kds-modal-subtitle">Thao tác này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="kds-modal-content">
              <p>Bạn có chắc chắn muốn xóa món <strong>{deletingFood.name}</strong> khỏi danh sách?</p>
            </div>
            <div className="kds-modal-footer">
              <button
                type="button"
                className="kds-btn secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="kds-btn danger"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                <Trash2 size={18} />
                {deleteLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenuFood;
