import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus, Search, Pencil, Eye, Trash2, X, UploadCloud, AlertCircle,
  CheckCircle, RefreshCw, Sparkles, Store,
} from 'lucide-react';

const STATUS_FILTERS = ['Tất cả', 'Còn hàng', 'Hết hàng'];
import {
  getFoodCategories,
  normalizeFoodCategoryPayload,
  createFood,
  updateFood,
  deleteFood,
  toggleFoodStatus,
  getCategoryLists,
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
  note: '',
  status: true,
  isAvailable: true,
  isDirectSale: false,
  isFeatured: false,
  preparationTime: '',
  calories: '',
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
      ? `${formatPrice(promo)}đ`
      : `${formatPrice(price)}đ`,
    priceListDisplay: hasPromo ? `${formatPrice(price)}đ` : null,
    unit: raw.unit ?? 'Dĩa',
    image: raw.image ?? '',
    imageUrl: raw.image,
    status: active,
    isAvailable: raw.isAvailable,
    isDirectSale: raw.isDirectSale === true,
    isFeatured: raw.isFeatured === true,
    preparationTime: raw.preparationTime != null ? Number(raw.preparationTime) : null,
    notes: raw.notes ?? raw.note ?? '',
    promotionalPrice: Number.isFinite(promo) ? promo : 0,
    /** Chuỗi hiển thị cột phân loại: "A, B, C" */
    categoriesLabel: uniqueCats.length ? uniqueCats.join(', ') : '—',
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
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0]);

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const pageSizeOptions = [5, 10, 20];

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

  /* ── Modal xem chi tiết ── */
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailFood, setDetailFood] = useState(null);

  /* ── Toggle status đang xử lý ── */
  const [toggleBusyId, setToggleBusyId] = useState(null);

  /* ── Load dữ liệu ── */
  const loadData = useCallback(async (options = {}) => {
    if (!options.silent) {
      setLoading(true);
      setApiError('');
    }
    try {
      // GET /api/food/category — danh sách món (Swagger: mảng món + categories lồng nhau)
      const payload = await getFoodCategories();
      const flatList = normalizeFoodCategoryPayload(payload);
      const normFoods = (Array.isArray(flatList) ? flatList : [])
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
      const msg =
        (typeof e?.message === 'string' && e.message) ||
        e?.response?.data?.message ||
        e?.error?.response?.data?.message ||
        e?.error?.message ||
        'Không tải được danh sách món ăn (GET /api/food/category).';
      setApiError(msg);
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
  const filtered = useMemo(() => {
    const list = foods.filter((d) => {
      const matchSearch = !search || (d.name || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || d.categories.includes(categoryFilter) || d.category === categoryFilter;
      const matchStatus =
        statusFilter === STATUS_FILTERS[0] ||
        (statusFilter === STATUS_FILTERS[1] && d.status) ||
        (statusFilter === STATUS_FILTERS[2] && !d.status);
      return matchSearch && matchCat && matchStatus;
    });
    return list;
  }, [foods, search, categoryFilter, statusFilter]);

  /* ── Paginated slice ── */
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  /* Reset page when filter changes */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

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
      note: row.note || '',
      status: row.status !== false,
      isAvailable: row.isAvailable !== false,
      isDirectSale: row.isDirectSale === true,
      isFeatured: row.isFeatured === true,
      preparationTime: row.preparationTime != null ? String(row.preparationTime) : '',
      calories: row.calories != null ? String(row.calories) : '',
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

  const openDetailModal = (row) => {
    setDetailFood(row);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setDetailFood(null);
  };

  /* ── SAVE NEW ── */
  const handleSaveNew = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    try {
      const cleanPrice = Number(String(form.price).replace(/[.,]/g, '')) || 0;
      const cleanPrepTime = form.preparationTime !== '' ? Number(String(form.preparationTime).replace(/\D/g, '')) : 0;

      const categoryIds = form.categories
        .map(name => findCategoryIdByName(name, categories))
        .filter(id => id != null);

      const payload = {
        name: form.name.trim(),
        description: form.description ? form.description.trim() : '',
        image: form.image || '',
        price: cleanPrice,
        isAvailable: Boolean(form.isAvailable),
        inStockable: true,
        preparationTime: cleanPrepTime,
        note: form.note ? form.note.trim() : '',
        colors: [],
        categoryIds,
        imageFile: form.imageFile,
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
      const cleanPrice = Number(String(formE.price).replace(/[.,]/g, '')) || 0;
      const cleanPrepTime = formE.preparationTime !== '' ? Number(String(formE.preparationTime).replace(/\D/g, '')) : 0;

      const categoryIds = formE.categories
        .map(name => findCategoryIdByName(name, categories))
        .filter(id => id != null);

      const payload = {
        name: formE.name.trim(),
        description: formE.description ? formE.description.trim() : '',
        image: formE.image || '',
        price: cleanPrice,
        isAvailable: Boolean(formE.isAvailable),
        inStockable: true,
        preparationTime: cleanPrepTime,
        note: formE.note ? formE.note.trim() : '',
        colors: [],
        categoryIds,
        imageFile: formE.imageFile,
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
          <span style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }} />
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

      {/* ── Bảng món ăn (GET /api/food/category) ── */}
      <div className="menu-table-card">
        {loading ? (
          <div className="menu-loading-wrap">
            <RefreshCw size={32} className="spin" />
            <span>Đang tải danh sách món ăn...</span>
          </div>
        ) : (
          <>
            <div className="menu-table-scroll">
        <table className="menu-table">
          <thead>
            <tr>
                  <th style={{ width: 72 }}>HÌNH ẢNH</th>
                  <th style={{ minWidth: 160 }}>TÊN MÓN</th>
                  <th style={{ width: 120 }}>GIÁ</th>
                  <th style={{ minWidth: 180 }}>PHÂN LOẠI</th>
                  <th style={{ minWidth: 200 }}>TRẠNG THÁI</th>
                  <th style={{ width: 140 }}>MÔ TẢ</th>
                  <th style={{ width: 104 }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
                {filtered.length === 0 ? (
                  <tr>
                      <td colSpan={7} className="menu-empty-row">
                      {search || categoryFilter
                        ? 'Không có món ăn phù hợp với bộ lọc.'
                        : 'Chưa có món ăn nào. Nhấn "Thêm món mới" để bắt đầu.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.id} className={!row.status ? 'row-inactive' : ''}>
                <td>
                  <div className="menu-table-img">
                          {row.image ? (
                            <img src={row.image} alt={row.name} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="menu-table-img-placeholder">
                              <span>{row.name?.[0]?.toUpperCase() ?? '?'}</span>
                            </div>
                          )}
                  </div>
                </td>
                      <td className="menu-cell-name">
                        <span className="menu-dish-name">{row.name}</span>
                        {(row.isFeatured || row.isDirectSale) && (
                          <div className="menu-food-tag-row">
                            {row.isFeatured && (
                              <span className="menu-food-tag-pill menu-food-tag-pill--featured" title="Món nổi bật">
                                <Sparkles size={12} aria-hidden />
                                Nổi bật
                              </span>
                            )}
                            {row.isDirectSale && (
                              <span className="menu-food-tag-pill menu-food-tag-pill--direct" title="Bán lẻ / trực tiếp">
                                <Store size={12} aria-hidden />
                                Bán lẻ
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="menu-cell-price">
                        <span className="menu-price-main">{row.priceDisplay}</span>
                        {row.priceListDisplay && (
                          <span className="menu-price-old">{row.priceListDisplay}</span>
                        )}
                      </td>
                      <td>
                        <span className="menu-categories-text" title={row.categoriesLabel}>
                          {row.categoriesLabel}
                        </span>
                </td>
                      <td>
                        <div className="menu-status-stack">
                          <span
                            className={`menu-stock-badge ${row.status ? 'menu-stock-badge--in' : 'menu-stock-badge--out'}`}
                          >
                            {row.status ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                  <button
                    type="button"
                    className={`menu-toggle ${row.status ? 'active' : ''}`}
                            aria-label={row.status ? 'Chuyển sang hết hàng' : 'Chuyển sang còn hàng'}
                            disabled={toggleBusyId === row.id}
                            onClick={() => handleToggleStatus(row)}
                  >
                    <span className="menu-toggle-thumb" />
                  </button>
                        </div>
                      </td>
                      <td>
                        <span className="menu-desc-text">{row.description || '—'}</span>
                </td>
                <td>
                  <div className="menu-actions-cell">
                    <button
                      type="button"
                      className="menu-icon-btn"
                      aria-label="Xem chi tiết"
                      onClick={() => openDetailModal(row)}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="menu-icon-btn"
                      aria-label="Sửa"
                      onClick={() => openEditModal(row)}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </td>
              </tr>
                  ))
                )}
          </tbody>
        </table>
            </div>

        <div className="menu-pagination">
          <div className="menu-pagination-info">
            <span>
              Hiển thị {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalItems)} của {totalItems} món ăn
            </span>
            <div className="menu-page-size-wrap">
              <label htmlFor="page-size-select">Hiển thị:</label>
              <select
                id="page-size-select"
                className="menu-page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span>/ trang</span>
            </div>
          </div>
          <div className="menu-pagination-btns">
            <button
              type="button"
              className="menu-page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              ‹
            </button>

            {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, safePage - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    type="button"
                    className={`menu-page-btn ${i === safePage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i)}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}

            <button
              type="button"
              className="menu-page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              ›
            </button>
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

      {/* ── Modal Xem Chi Tiết ── */}
      {detailModalOpen && detailFood && (
        <div className="kds-modal-overlay" onClick={closeDetailModal}>
          <div className="kds-modal kds-modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header">
              <div>
                <h3 className="kds-modal-title">Chi tiết món ăn</h3>
              </div>
              <button
                type="button"
                className="kds-modal-close"
                onClick={closeDetailModal}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <div className="kds-modal-content">
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {detailFood.image && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={detailFood.image}
                      alt={detailFood.name}
                      style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{detailFood.name}</h4>
                    {(detailFood.isFeatured || detailFood.isDirectSale) && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {detailFood.isFeatured && (
                          <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d', borderRadius: '9999px', textTransform: 'uppercase' }}>
                            Nổi bật
                          </span>
                        )}
                        {detailFood.isDirectSale && (
                          <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '9999px', textTransform: 'uppercase' }}>
                            Bán lẻ
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    {detailFood.description || 'Không có mô tả'}
                  </p>

                  {/* Giá */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>Giá bán</span>
                      <p style={{ margin: 0, fontWeight: 700, color: '#FF6C1F', fontSize: '1.125rem' }}>{detailFood.priceDisplay}</p>
                      {detailFood.priceListDisplay && (
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>{detailFood.priceListDisplay}</span>
                      )}
                    </div>
                    {detailFood.unit && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>Đơn vị</span>
                        <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{detailFood.unit}</p>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>Trạng thái</span>
                      <p style={{ margin: 0, fontWeight: 600, color: detailFood.status ? '#047857' : '#b91c1c' }}>
                        {detailFood.status ? 'Còn hàng' : 'Hết hàng'}
                      </p>
                    </div>
                  </div>

                  {/* Thông tin bổ sung */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: detailFood.notes ? '0.75rem' : 0 }}>
                    {detailFood.preparationTime != null && (
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#9ca3af', display: 'block' }}>Thời gian chuẩn bị</span>
                        <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{detailFood.preparationTime} phút</p>
                      </div>
                    )}
                    {detailFood.calories != null && (
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#9ca3af', display: 'block' }}>Calories</span>
                        <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{detailFood.calories} kcal</p>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#9ca3af', display: 'block' }}>Lượt xem</span>
                      <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{detailFood.viewCount || 0}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#9ca3af', display: 'block' }}>Lượt đặt</span>
                      <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{detailFood.orderCount || 0}</p>
                    </div>
                    {detailFood.rating != null && (
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#9ca3af', display: 'block' }}>Đánh giá</span>
                        <p style={{ margin: 0, fontWeight: 600, color: '#92400e', fontSize: '0.875rem' }}>★ {detailFood.rating}</p>
                      </div>
                    )}
                  </div>

                  {/* Ghi chú */}
                  {detailFood.notes && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>Ghi chú</span>
                      <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem' }}>{detailFood.notes}</p>
                    </div>
                  )}

                  {/* Danh mục */}
                  {detailFood.categories && detailFood.categories.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>Danh mục</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {detailFood.categories.map((cat, idx) => (
                          <span key={idx} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 500, background: '#fff7ed', color: '#FF6C1F', borderRadius: '0.25rem' }}>
                            {typeof cat === 'string' ? cat : cat.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin hệ thống */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                {detailFood.createdAt && (
                  <span>Ngày tạo: {new Date(detailFood.createdAt).toLocaleString('vi-VN')}</span>
                )}
                {detailFood.updatedAt && (
                  <span>Ngày cập nhật: {new Date(detailFood.updatedAt).toLocaleString('vi-VN')}</span>
                )}
              </div>
            </div>
            <div className="kds-modal-footer">
              <button
                type="button"
                className="kds-btn secondary"
                onClick={closeDetailModal}
              >
                Đóng
              </button>
              <button
                type="button"
                className="kds-btn primary"
                onClick={() => {
                  closeDetailModal();
                  openEditModal(detailFood);
                }}
              >
                <Pencil size={16} />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
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
