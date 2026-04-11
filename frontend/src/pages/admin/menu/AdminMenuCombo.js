import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, Pencil, X, Calendar, Trash2, AlertCircle, CheckCircle, RefreshCw,
} from 'lucide-react';
import {
  getComboLists,
  normalizeComboListResponse,
  createCombo,
  updateCombo,
  deleteCombo,
  patchComboStatus,
  resolveFoodImageUrl,
  getComboCreatedBy,
} from '../../../api/foodApi';
import '../../../styles/AdminMenuManagement.css';

const STATUS_FILTERS = ['Tất cả trạng thái', 'Đang bán', 'Ngừng bán'];

const defaultComboForm = () => ({
  name: '',
  description: '',
  price: '',
  discountPercent: 0,
  startDate: '',
  expiryDate: '',
  maxUsage: '',
  isAvailable: true,
  imageFile: null,
  imagePreview: null,
  image: '',
});

function formatPriceVnd(num) {
  const n = Number(num) || 0;
  return `${n.toLocaleString('vi-VN')}₫`;
}

function unwrapArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.$values)) return value.$values;
  return [];
}

/** Các khóa thường gặp từ GET /api/combo (nested món trong combo) */
const COMBO_FOOD_ARRAY_KEYS = [
  'comboFoods',
  'ComboFoods',
  'foods',
  'Foods',
  'foodItems',
  'FoodItems',
  'comboDetails',
  'ComboDetails',
  'comboItems',
  'ComboItems',
];

function extractComboFoodArray(raw) {
  if (!raw || typeof raw !== 'object') return [];
  for (const key of COMBO_FOOD_ARRAY_KEYS) {
    const arr = unwrapArray(raw[key]);
    if (arr.length > 0) return arr;
  }
  return [];
}

function normalizeComboFoodLines(raw) {
  const items = extractComboFoodArray(raw);
  return items
    .map((item) => {
      const foodName =
        item?.foodName ??
        item?.FoodName ??
        item?.name ??
        item?.food?.foodName ??
        item?.food?.name ??
        item?.Food?.foodName ??
        '';
      const quantity =
        Number(item?.quantity ?? item?.Quantity ?? item?.qty ?? item?.Qty ?? 0) || 0;
      return { foodName: String(foodName).trim(), quantity };
    })
    .filter((row) => row.foodName || row.quantity > 0);
}

function normalizeComboRow(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.comboId ?? raw.id ?? null;
  if (id == null) return null;
  const price = Number(raw.price) || 0;
  let active = true;
  if (raw.isAvailable !== undefined && raw.isAvailable !== null) {
    active = raw.isAvailable === true || raw.isAvailable === 1 || raw.isAvailable === 'true';
  }
  const foodsLines = normalizeComboFoodLines(raw);
  return {
    id,
    comboId: id,
    code: `CB-${String(id).padStart(3, '0')}`,
    name: raw.name ?? '',
    description: raw.description ?? '',
    price,
    priceDisplay: formatPriceVnd(price),
    discountPercent: Number(raw.discountPercent) || 0,
    image: raw.image ?? '',
    imageUrl: resolveFoodImageUrl(raw.image),
    startDate: raw.startDate ? String(raw.startDate).slice(0, 10) : '',
    expiryDate: raw.expiryDate ? String(raw.expiryDate).slice(0, 10) : '',
    maxUsage: raw.maxUsage != null ? Number(raw.maxUsage) : 0,
    numberOfUsed: raw.numberOfUsed != null ? Number(raw.numberOfUsed) : 0,
    status: active,
    isAvailable: raw.isAvailable,
    foodsLines,
  };
}

const AdminMenuCombo = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  const [createComboOpen, setCreateComboOpen] = useState(false);
  const [createComboForm, setCreateComboForm] = useState(defaultComboForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [editComboId, setEditComboId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCombo, setDeletingCombo] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleBusyId, setToggleBusyId] = useState(null);

  const loadData = useCallback(async (opts = {}) => {
    if (!opts.silent) {
      setLoading(true);
      setApiError('');
    }
    try {
      const payload = await getComboLists();
      const list = normalizeComboListResponse(payload);
      setCombos(list.map(normalizeComboRow).filter(Boolean));
    } catch (e) {
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        'Không tải được danh sách combo (GET /api/combo).';
      setApiError(msg);
      setCombos([]);
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    return combos.filter((c) => {
      const matchSearch =
        !search || (c.name || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'Tất cả trạng thái' ||
        (statusFilter === 'Đang bán' && c.status) ||
        (statusFilter === 'Ngừng bán' && !c.status);
      return matchSearch && matchStatus;
    });
  }, [combos, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const validateForm = (f) => {
    const e = {};
    if (!(f.name || '').trim()) e.name = 'Tên combo bắt buộc.';
    const p = Number(String(f.price).replace(/\D/g, ''));
    if (!f.price || Number.isNaN(p) || p < 0) e.price = 'Giá hợp lệ bắt buộc.';
    return e;
  };

  const openAddCombo = () => {
    setEditComboId(null);
    setCreateComboForm(defaultComboForm());
    setFormErrors({});
    setCreateComboOpen(true);
  };

  const openEditCombo = (row) => {
    setEditComboId(row.id);
    setFormErrors({});
    setCreateComboForm({
      name: row.name || '',
      description: row.description || '',
      price: String(row.price ?? ''),
      discountPercent: row.discountPercent ?? 0,
      startDate: row.startDate || '',
      expiryDate: row.expiryDate || '',
      maxUsage: row.maxUsage != null && row.maxUsage < 2147483647 ? String(row.maxUsage) : '',
      isAvailable: row.status !== false,
      imageFile: null,
      imagePreview: row.imageUrl || null,
      image: row.image || '',
    });
    setCreateComboOpen(true);
  };

  const closeComboModal = () => {
    setCreateComboOpen(false);
    setCreateComboForm(defaultComboForm());
    setEditComboId(null);
    setFormErrors({});
  };

  const formatComboDateField = (v) => {
    if (v == null || v === '') return undefined;
    return String(v).slice(0, 10);
  };

  /** Body khớp Swagger POST/PUT /api/combo (JSON); có file ảnh thì foodApi dùng multipart */
  const buildPayloadFromForm = () => {
    const priceNum = Number(String(createComboForm.price).replace(/\D/g, '')) || 0;
    const maxUsage =
      createComboForm.maxUsage === '' || createComboForm.maxUsage == null
        ? 2147483647
        : Math.max(0, parseInt(String(createComboForm.maxUsage).replace(/\D/g, ''), 10) || 0);
    const payload = {
      name: createComboForm.name.trim(),
      description: (createComboForm.description || '').trim(),
      price: priceNum,
      discountPercent: Math.min(100, Math.max(0, Number(createComboForm.discountPercent) || 0)),
      startDate: formatComboDateField(createComboForm.startDate),
      expiryDate: formatComboDateField(createComboForm.expiryDate),
      maxUsage,
      isAvailable: createComboForm.isAvailable !== false,
      image: (createComboForm.image || '').trim(),
      imageFile: createComboForm.imageFile,
    };
    if (!editComboId) {
      payload.createdBy = Number(getComboCreatedBy()) || 0;
    }
    return payload;
  };

  const submitCombo = async () => {
    const errs = validateForm(createComboForm);
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setFormLoading(true);
    setFormErrors({});
    try {
      const payload = buildPayloadFromForm();
      if (editComboId) {
        await updateCombo(editComboId, payload);
        setToastMsg('Cập nhật combo thành công!');
      } else {
        await createCombo(payload);
        setToastMsg('Tạo combo thành công!');
      }
      setToastType('success');
      closeComboModal();
      await loadData({ silent: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Thao tác thất bại.';
      setFormErrors({ _api: msg });
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCombo) return;
    setDeleteLoading(true);
    try {
      await deleteCombo(deletingCombo.id);
      setToastMsg('Đã xóa combo.');
      setToastType('success');
      setDeleteModalOpen(false);
      setDeletingCombo(null);
      await loadData({ silent: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Xóa combo thất bại.';
      setToastMsg(msg);
      setToastType('error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (row) => {
    setToggleBusyId(row.id);
    try {
      await patchComboStatus(row.id, !row.status);
      setToastMsg(`Đã ${!row.status ? 'bật' : 'tắt'} bán combo "${row.name}".`);
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

      {toastMsg && (
        <div className={`kds-toast-msg ${toastType === 'error' ? 'kds-toast-msg--error' : ''}`} role="status">
          {toastType === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toastMsg}</span>
        </div>
      )}

      {apiError && (
        <div className="kds-api-error" role="alert">
          <AlertCircle size={20} />
          <span>{apiError}</span>
          <button type="button" className="menu-retry-btn" onClick={() => loadData()}>
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      <div className="menu-table-card">
        {loading ? (
          <div className="menu-loading-wrap">
            <RefreshCw size={32} className="spin" />
            <span>Đang tải danh sách combo...</span>
          </div>
        ) : (
          <>
            <div className="menu-table-scroll">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>HÌNH ẢNH</th>
                    <th style={{ minWidth: 160 }}>TÊN COMBO</th>
                    <th style={{ minWidth: 200 }}>MÔ TẢ</th>
                    <th style={{ minWidth: 200 }}>MÓN ĂN</th>
                    <th style={{ width: 120 }}>GIÁ</th>
                    <th style={{ width: 110 }}>HẾT HẠN</th>
                    <th style={{ width: 120 }}>TRẠNG THÁI</th>
                    <th style={{ width: 104 }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="menu-empty-row">
                        {search || statusFilter !== 'Tất cả trạng thái'
                          ? 'Không có combo phù hợp.'
                          : 'Chưa có combo. Nhấn "Thêm Combo mới".'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((row) => (
                      <tr key={row.id} className={!row.status ? 'row-inactive' : ''}>
                        <td>
                          <div className="menu-table-img">
                            {row.imageUrl ? (
                              <img src={row.imageUrl} alt={row.name} onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </td>
                        <td className="menu-cell-name">
                          <div>{row.name}</div>
                          <div className="menu-cell-code">Mã: {row.code}</div>
                        </td>
                        <td className="menu-cell-desc">{row.description || '—'}</td>
                        <td className="menu-cell-combo-foods">
                          {row.foodsLines?.length ? (
                            <ul className="combo-foods-list">
                              {row.foodsLines.map((f, idx) => (
                                <li key={`${row.id}-${idx}`}>
                                  <span className="combo-food-name">{f.foodName || '—'}</span>
                                  <span className="combo-food-qty"> × {f.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="menu-cell-price">{row.priceDisplay}</td>
                        <td>{row.expiryDate || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className={`menu-toggle ${row.status ? 'active' : ''}`}
                            aria-label={row.status ? 'Ngừng bán' : 'Đang bán'}
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
                              onClick={() => openEditCombo(row)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className="menu-icon-btn menu-icon-btn-danger"
                              aria-label="Xóa"
                              onClick={() => { setDeletingCombo(row); setDeleteModalOpen(true); }}
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
            </div>

            <div className="menu-pagination">
              <span>
                Hiển thị {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} / {filtered.length} combo
              </span>
              <div className="menu-pagination-btns">
                <button
                  type="button"
                  className="menu-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                <button type="button" className="menu-page-btn active">
                  {safePage}
                </button>
                <button
                  type="button"
                  className="menu-page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {createComboOpen && (
        <div className="combo-create-overlay" onClick={closeComboModal}>
          <div className="combo-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="combo-create-head">
              <h2 className="combo-create-title">{editComboId ? 'Cập nhật Combo' : 'Tạo Combo Mới'}</h2>
              <button type="button" className="combo-create-close" onClick={closeComboModal} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
            <form
                className="combo-create-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitCombo();
                }}
              >
                {formErrors._api && (
                  <div className="dish-api-error" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={16} />
                    <span>{formErrors._api}</span>
                  </div>
                )}
                <div className="combo-form-group">
                  <label>
                    Tên Combo <span className="combo-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={createComboForm.name}
                    onChange={(e) => setCreateComboForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ví dụ: Combo Gia Đình 4 Người"
                    className={formErrors.name ? 'input-error' : ''}
                  />
                  {formErrors.name && <span className="dish-field-error">{formErrors.name}</span>}
                </div>
                <div className="combo-form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    value={createComboForm.description}
                    onChange={(e) => setCreateComboForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Mô tả combo..."
                    rows={3}
                  />
                </div>
                <div className="combo-form-group">
                  <label>
                    Giá bán (VNĐ) <span className="combo-required">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={createComboForm.price}
                    onChange={(e) => setCreateComboForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    className={formErrors.price ? 'input-error' : ''}
                  />
                  {formErrors.price && <span className="dish-field-error">{formErrors.price}</span>}
                </div>
                <div className="combo-form-group">
                  <label>Giảm giá (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={createComboForm.discountPercent}
                    onChange={(e) =>
                      setCreateComboForm((f) => ({
                        ...f,
                        discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      }))
                    }
                  />
                </div>
                <div className="combo-form-group">
                  <label>Ngày bắt đầu</label>
                  <div className="combo-date-wrap">
                    <input
                      type="date"
                      value={createComboForm.startDate}
                      onChange={(e) => setCreateComboForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="combo-date-input"
                    />
                    <Calendar size={18} className="combo-date-icon" />
                  </div>
                </div>
                <div className="combo-form-group">
                  <label>Ngày hết hạn</label>
                  <div className="combo-date-wrap">
                    <input
                      type="date"
                      value={createComboForm.expiryDate}
                      onChange={(e) => setCreateComboForm((f) => ({ ...f, expiryDate: e.target.value }))}
                      className="combo-date-input"
                    />
                    <Calendar size={18} className="combo-date-icon" />
                  </div>
                </div>
                <div className="combo-form-group">
                  <label>Giới hạn lượt dùng (để trống = không giới hạn)</label>
                  <input
                    type="number"
                    min={0}
                    value={createComboForm.maxUsage}
                    onChange={(e) => setCreateComboForm((f) => ({ ...f, maxUsage: e.target.value }))}
                    placeholder="Không giới hạn"
                  />
                </div>
                <div className="combo-form-group dish-toggle-wrap">
                  <label className="dish-toggle-label">Đang mở bán</label>
                  <button
                    type="button"
                    className={`menu-toggle ${createComboForm.isAvailable ? 'active' : ''}`}
                    onClick={() =>
                      setCreateComboForm((f) => ({ ...f, isAvailable: !f.isAvailable }))
                    }
                    aria-label="Trạng thái bán"
                  >
                    <span className="menu-toggle-thumb" />
                  </button>
                </div>
                <div className="combo-form-group">
                  <label>Hình ảnh Combo</label>
                  <label className="combo-upload-zone">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="combo-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCreateComboForm((prev) => ({
                            ...prev,
                            imageFile: file,
                            imagePreview: URL.createObjectURL(file),
                          }));
                        }
                      }}
                    />
                    {createComboForm.imagePreview ? (
                      <div className="combo-upload-preview">
                        <img src={createComboForm.imagePreview} alt="Preview" />
                      </div>
                    ) : (
                      <div className="combo-upload-placeholder">
                        <Plus size={32} />
                        <span>Tải ảnh lên</span>
                      </div>
                    )}
                  </label>
                </div>
                <div className="combo-create-actions">
                  <button type="button" className="combo-btn-cancel" onClick={closeComboModal} disabled={formLoading}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="menu-btn-primary" disabled={formLoading}>
                    {formLoading ? 'Đang lưu...' : editComboId ? 'Lưu thay đổi' : 'Tạo combo'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {deleteModalOpen && deletingCombo && (
        <div className="kds-modal-overlay" onClick={() => !deleteLoading && setDeleteModalOpen(false)}>
          <div className="kds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header">
              <div className="modal-icon warning">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="kds-modal-title">
                  Xóa combo: <span className="highlight">{deletingCombo.name}</span>
                </h3>
                <p className="kds-modal-subtitle">Thao tác không thể hoàn tác.</p>
              </div>
            </div>
            <div className="kds-modal-content">
              <p>
                Bạn có chắc muốn xóa combo <strong>{deletingCombo.name}</strong>?
              </p>
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

export default AdminMenuCombo;
