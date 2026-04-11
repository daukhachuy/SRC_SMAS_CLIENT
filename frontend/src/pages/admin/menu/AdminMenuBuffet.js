import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Pencil, X, Trash2, AlertCircle, CheckCircle, RefreshCw, Eye, Image as ImageIcon, Upload, Minus,
} from 'lucide-react';
import {
  getBuffetLists,
  getBuffetDetail,
  createBuffet,
  updateBuffet,
  removeFoodFromBuffet,
  updateBuffetStatus,
  getFoodCategories,
  normalizeFoodCategoryPayload,
  resolveFoodImageUrl,
} from '../../../api/foodApi';
import '../../../styles/AdminMenuManagement.css';

const STATUS_FILTERS = ['Tất cả', 'Đang bán', 'Ngừng bán'];

const defaultBuffetForm = () => ({
  name: '',
  description: '',
  image: '',
  mainPrice: '',
  childrenPrice: '',
  sidePrice: '',
  isAvailable: true,
  imageFile: null,
  imagePreview: null,
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

function extractBuffetFoods(raw) {
  if (!raw || typeof raw !== 'object') return [];
  const keys = ['foods', 'Foods', 'buffetFoods', 'BuffetFoods', 'items', 'Items', 'menuItems', 'MenuItems'];
  for (const key of keys) {
    const arr = unwrapArray(raw[key]);
    if (arr.length > 0) return arr;
  }
  return [];
}

function normalizeBuffetFoods(items) {
  return items.map((item) => {
    const foodId = Number(item.foodId ?? item.FoodId ?? item.id ?? 0);
    const foodName =
      item.foodName ?? item.FoodName ?? item.name ?? item.food?.foodName ?? item.food?.name ?? '';
    const foodImage =
      item.foodImage ?? item.FoodImage ?? item.image ?? item.food?.image ?? '';
    const quantity = Number(item.quantity ?? item.Quantity ?? 0);
    const isUnlimited = item.isUnlimited === true || item.isUnlimited === 1;
    const foodPrice = Number(item.foodPrice ?? item.price ?? item.food?.price ?? 0);
    return { foodId, foodName: String(foodName).trim(), foodImage, quantity, isUnlimited, foodPrice };
  });
}

function normalizeBuffetRow(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.buffetId ?? raw.id ?? null;
  if (id == null) return null;
  const mainPrice = Number(raw.mainPrice ?? raw.MainPrice ?? 0);
  const childrenPrice = Number(raw.childrenPrice ?? raw.ChildrenPrice ?? 0);
  const sidePrice = Number(raw.sidePrice ?? raw.SidePrice ?? 0);
  let isAvailable = true;
  if (raw.isAvailable !== undefined && raw.isAvailable !== null) {
    isAvailable = raw.isAvailable === true || raw.isAvailable === 1 || raw.isAvailable === 'true';
  }
  const foods = normalizeBuffetFoods(extractBuffetFoods(raw));
  return {
    id,
    name: raw.name || '',
    description: raw.description || '',
    image: raw.image || raw.imageUrl || '',
    imageUrl: resolveFoodImageUrl(raw.image || raw.imageUrl || ''),
    mainPrice,
    childrenPrice,
    sidePrice,
    isAvailable,
    foods,
    createdAt: raw.createdAt || raw.CreatedAt || '',
    updatedAt: raw.updatedAt || raw.UpdatedAt || '',
  };
}

export default function AdminMenuBuffet() {
  const [buffetList, setBuffetList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [createBuffetOpen, setCreateBuffetOpen] = useState(false);
  const [editBuffetId, setEditBuffetId] = useState(null);
  const [buffetForm, setBuffetForm] = useState(defaultBuffetForm());
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const [selectedFoods, setSelectedFoods] = useState({});
  const [availableFoods, setAvailableFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [showFoodSelector, setShowFoodSelector] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailBuffet, setDetailBuffet] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [removingFoodId, setRemovingFoodId] = useState(null);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadData = useMemo(
    () => async ({ silent } = {}) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const raw = await getBuffetLists();
        const normalized = (Array.isArray(raw) ? raw : []).map(normalizeBuffetRow).filter(Boolean);
        setBuffetList(normalized);
      } catch (e) {
        setError(e?.message || 'Không tải được danh sách buffet.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buffetList.filter((b) => {
      const matchSearch = !q || b.name.toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === STATUS_FILTERS[0] ||
        (statusFilter === STATUS_FILTERS[1] && b.isAvailable) ||
        (statusFilter === STATUS_FILTERS[2] && !b.isAvailable);
      return matchSearch && matchStatus;
    });
  }, [buffetList, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  // ---- Actions ----

  const openAddBuffet = () => {
    setEditBuffetId(null);
    setBuffetForm(defaultBuffetForm());
    setFormErrors({});
    setSelectedFoods({});
    setAvailableFoods([]);
    setShowFoodSelector(false);
    setCreateBuffetOpen(true);
  };

  const openEditBuffet = async (row) => {
    setEditBuffetId(row.id);
    setBuffetForm({
      name: row.name || '',
      description: row.description || '',
      image: row.image || '',
      mainPrice: String(row.mainPrice ?? ''),
      childrenPrice: String(row.childrenPrice ?? ''),
      sidePrice: String(row.sidePrice ?? ''),
      isAvailable: row.isAvailable,
      imageFile: null,
      imagePreview: row.imageUrl || row.image || null,
    });
    setFormErrors({});
    setSelectedFoods({});
    setAvailableFoods([]);
    setShowFoodSelector(false);
    setCreateBuffetOpen(true);

    if (row.foods && row.foods.length > 0) {
      const mapped = {};
      row.foods.forEach((f) => {
        mapped[f.foodId] = { ...f };
      });
      setSelectedFoods(mapped);
    }
  };

  const closeBuffetModal = () => {
    setCreateBuffetOpen(false);
    setBuffetForm(defaultBuffetForm());
    setEditBuffetId(null);
    setFormErrors({});
    setSelectedFoods({});
    setShowFoodSelector(false);
  };

  const openDetailModal = async (row) => {
    setDetailBuffet(null);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const raw = await getBuffetDetail(row.id);
      setDetailBuffet(normalizeBuffetRow(raw || row));
    } catch {
      setDetailBuffet(normalizeBuffetRow(row));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setDetailBuffet(null);
    setRemovingFoodId(null);
  };

  const loadAvailableFoods = async () => {
    setFoodsLoading(true);
    try {
      const data = await getFoodCategories();
      const foods = normalizeFoodCategoryPayload(data);
      setAvailableFoods(foods);
    } catch (e) {
      console.error('Không tải được danh sách món:', e);
    } finally {
      setFoodsLoading(false);
    }
  };

  const toggleFoodSelector = async () => {
    setShowFoodSelector((v) => !v);
    if (availableFoods.length === 0) await loadAvailableFoods();
  };

  const handleToggleFood = (food) => {
    const fid = food.foodId ?? food.id ?? 0;
    setSelectedFoods((prev) => {
      if (prev[fid]) {
        const next = { ...prev };
        delete next[fid];
        return next;
      }
      return { ...prev, [fid]: { ...food, quantity: 1, isUnlimited: false } };
    });
  };

  const handleUpdateFoodQty = (foodId, qty) => {
    setSelectedFoods((prev) => ({
      ...prev,
      [foodId]: { ...prev[foodId], quantity: Math.max(0, Number(qty) || 0) },
    }));
  };

  const handleUpdateFoodUnlimited = (foodId, isUnlimited) => {
    setSelectedFoods((prev) => ({
      ...prev,
      [foodId]: { ...prev[foodId], isUnlimited },
    }));
  };

  const validateForm = () => {
    const e = {};
    if (!(buffetForm.name || '').trim()) e.name = 'Tên gói Buffet bắt buộc.';
    const mp = Number(String(buffetForm.mainPrice).replace(/\D/g, ''));
    if (!buffetForm.mainPrice || Number.isNaN(mp) || mp < 0) e.mainPrice = 'Giá người lớn phải >= 0.';
    return e;
  };

  const buildPayload = () => {
    const mp = Number(String(buffetForm.mainPrice).replace(/\D/g, '')) || 0;
    const cp = Number(String(buffetForm.childrenPrice).replace(/\D/g, '')) || 0;
    const sp = Number(String(buffetForm.sidePrice).replace(/\D/g, '')) || 0;
    const foods = Object.entries(selectedFoods)
      .filter(([, v]) => v.quantity > 0 || v.isUnlimited)
      .map(([, v]) => ({
        foodId: v.foodId ?? v.id ?? 0,
        quantity: v.quantity,
        isUnlimited: Boolean(v.isUnlimited),
      }));
    return {
      name: buffetForm.name.trim(),
      description: (buffetForm.description || '').trim(),
      image: buffetForm.image || '',
      imageFile: buffetForm.imageFile || null,
      mainPrice: mp,
      childrenPrice: cp,
      sidePrice: sp,
      isAvailable: buffetForm.isAvailable,
      foods,
    };
  };

  const handleSubmitBuffet = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormLoading(true);
    setFormErrors({});
    try {
      const payload = buildPayload();
      if (editBuffetId) {
        await updateBuffet(editBuffetId, payload);
        setToastMsg('Cập nhật buffet thành công!');
      } else {
        await createBuffet(payload);
        setToastMsg('Tạo buffet thành công!');
      }
      setToastType('success');
      closeBuffetModal();
      await loadData({ silent: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Thao tác thất bại.';
      setFormErrors({ _api: msg });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveFoodFromBuffet = async (buffetId, foodId) => {
    setRemovingFoodId(foodId);
    try {
      await removeFoodFromBuffet(buffetId, foodId);
      setToastMsg('Đã xóa món ăn khỏi gói Buffet.');
      setToastType('success');
      const raw = await getBuffetDetail(buffetId);
      setDetailBuffet(normalizeBuffetRow(raw));
    } catch (e) {
      setToastMsg(e?.response?.data?.message || e?.message || 'Lỗi khi xóa món ăn.');
      setToastType('error');
    } finally {
      setRemovingFoodId(null);
    }
  };

  const handleToggleStatus = async (row) => {
    try {
      await updateBuffetStatus(row.id);
      setToastMsg('Cập nhật trạng thái thành công!');
      setToastType('success');
      await loadData({ silent: true });
    } catch (e) {
      setToastMsg(e?.message || 'Không cập nhật được trạng thái.');
      setToastType('error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBuffetForm((f) => ({ ...f, imageFile: file, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setBuffetForm((f) => ({ ...f, imageFile: null, imagePreview: null, image: '' }));
  };

  // ---- Render ----

  const renderToast = () => {
    if (!toastMsg) return null;
    return (
      <div className={`buffet-toast ${toastType === 'success' ? 'buffet-toast-success' : 'buffet-toast-error'}`}>
        <span className="buffet-toast-icon">
          {toastType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        </span>
        <span>{toastMsg}</span>
      </div>
    );
  };

  const renderFormModal = () => {
    if (!createBuffetOpen) return null;
    const selectedFoodsList = Object.values(selectedFoods);
    return (
      <div className="buffet-create-overlay" onClick={(e) => e.target === e.currentTarget && closeBuffetModal()}>
        <div className="buffet-create-modal buffet-modal-in">
          <div className="buffet-create-head">
            <h3 className="buffet-create-title">{editBuffetId ? 'Chỉnh sửa gói Buffet' : 'Thêm gói Buffet'}</h3>
            <button className="buffet-create-close" onClick={closeBuffetModal}><X size={20} /></button>
          </div>

          <div className="buffet-create-form">
            {formErrors._api && (
              <div className="buffet-error-banner">{formErrors._api}</div>
            )}

            <div className="buffet-form-group">
              <label>Tên gói Buffet <span className="buffet-required">*</span></label>
              <input
                type="text"
                value={buffetForm.name}
                onChange={(e) => setBuffetForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Buffet Hải Sản 5 Sao"
              />
              {formErrors.name && <span className="buffet-field-error">{formErrors.name}</span>}
            </div>

            <div className="buffet-form-group">
              <label>Mô tả</label>
              <textarea
                rows={3}
                value={buffetForm.description}
                onChange={(e) => setBuffetForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả chi tiết gói buffet..."
              />
            </div>

            <div className="buffet-form-row">
              <div className="buffet-form-group">
                <label>Giá người lớn (VNĐ) <span className="buffet-required">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={buffetForm.mainPrice}
                  onChange={(e) => setBuffetForm((f) => ({ ...f, mainPrice: e.target.value }))}
                  placeholder="VD: 299000"
                />
                {formErrors.mainPrice && <span className="buffet-field-error">{formErrors.mainPrice}</span>}
              </div>
              <div className="buffet-form-group">
                <label>Giá trẻ em (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={buffetForm.childrenPrice}
                  onChange={(e) => setBuffetForm((f) => ({ ...f, childrenPrice: e.target.value }))}
                  placeholder="VD: 149000"
                />
              </div>
              <div className="buffet-form-group">
                <label>Giá phụ (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={buffetForm.sidePrice}
                  onChange={(e) => setBuffetForm((f) => ({ ...f, sidePrice: e.target.value }))}
                  placeholder="VD: 99000"
                />
              </div>
            </div>

            <div className="buffet-form-group">
              <label className="buffet-toggle-label">
                <span>Trạng thái</span>
                <div
                  className={`buffet-toggle-switch ${buffetForm.isAvailable ? 'active' : ''}`}
                  onClick={() => setBuffetForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                >
                  <div className="buffet-toggle-knob" />
                </div>
                <span className="buffet-toggle-text">{buffetForm.isAvailable ? 'Đang bán' : 'Ngừng bán'}</span>
              </label>
            </div>

            <div className="buffet-form-group">
              <label>Ảnh gói Buffet</label>
              {buffetForm.imagePreview ? (
                <div className="buffet-upload-preview">
                  <img src={buffetForm.imagePreview} alt="preview" />
                  <button type="button" className="remove-img-btn" onClick={handleRemoveImage}><X size={12} /></button>
                </div>
              ) : (
                <label className="buffet-upload-zone">
                  <input type="file" accept="image/*" className="buffet-upload-input" onChange={handleImageUpload} />
                  <div className="buffet-upload-placeholder">
                    <Upload size={32} />
                    <span>Nhấn để tải ảnh lên</span>
                  </div>
                </label>
              )}
            </div>

            <div className="buffet-form-section-header" style={{ marginTop: '1rem' }}>
              <h4 className="buffet-form-section-title" style={{ margin: 0 }}>Danh sách món ăn</h4>
              <button type="button" className="buffet-btn-cancel" onClick={toggleFoodSelector}>
                {showFoodSelector ? 'Ẩn danh sách' : 'Chọn món'}
              </button>
            </div>

            {showFoodSelector && (
              <>
                {foodsLoading ? (
                  <div className="buffet-foods-loading">
                    <RefreshCw size={20} className="buffet-spin" /> Đang tải món ăn...
                  </div>
                ) : availableFoods.length === 0 ? (
                  <div className="buffet-foods-empty">Không có món ăn nào.</div>
                ) : (
                  <div className="buffet-foods-grid">
                    {availableFoods.map((food) => {
                      const fid = food.foodId ?? food.id ?? 0;
                      const isSelected = !!selectedFoods[fid];
                      const imgUrl = resolveFoodImageUrl(food.image || '');
                      return (
                        <div
                          key={fid}
                          className={`buffet-food-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleFood(food)}
                        >
                          <div className="buffet-food-img">
                            {imgUrl ? <img src={imgUrl} alt={food.name} /> : <ImageIcon size={24} />}
                          </div>
                          <div className="buffet-food-info">
                            <span className="buffet-food-name">{food.name || food.foodName}</span>
                            <span className="buffet-food-price">{formatPriceVnd(food.price)}</span>
                          </div>
                          {isSelected && <CheckCircle size={16} style={{ color: '#FF6C1F', flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {selectedFoodsList.length > 0 && (
              <>
                <p className="buffet-step2-desc" style={{ marginTop: '0.75rem' }}>
                  Đã chọn {selectedFoodsList.length} món — điều chỉnh số lượng bên dưới:
                </p>
                <div className="buffet-foods-grid">
                  {selectedFoodsList.map((food) => {
                    const fid = food.foodId ?? food.id ?? 0;
                    const imgUrl = resolveFoodImageUrl(food.image || '');
                    return (
                      <div key={fid} className="buffet-food-item selected">
                        <div className="buffet-food-img">
                          {imgUrl ? <img src={imgUrl} alt={food.name} /> : <ImageIcon size={24} />}
                        </div>
                        <div className="buffet-food-info">
                          <span className="buffet-food-name">{food.name || food.foodName}</span>
                          <div className="buffet-food-qty">
                            <button
                              type="button"
                              className="buffet-qty-btn"
                              onClick={() => handleUpdateFoodQty(fid, (food.quantity || 0) - 1)}
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min="0"
                              style={{ width: 50, padding: '2px 4px', border: '1px solid #e5e7eb', borderRadius: 4, textAlign: 'center', fontSize: '0.875rem' }}
                              value={food.isUnlimited ? '∞' : food.quantity}
                              onChange={(e) => handleUpdateFoodQty(fid, e.target.value)}
                              disabled={food.isUnlimited}
                            />
                            <button
                              type="button"
                              className="buffet-qty-btn"
                              onClick={() => handleUpdateFoodQty(fid, (food.quantity || 0) + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                            <input
                              type="checkbox"
                              checked={food.isUnlimited || false}
                              onChange={(e) => handleUpdateFoodUnlimited(fid, e.target.checked)}
                            />
                            Không giới hạn
                          </label>
                        </div>
                        <button
                          type="button"
                          className="buffet-create-close"
                          style={{ marginLeft: 'auto' }}
                          onClick={() => handleToggleFood(food)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {selectedFoodsList.length === 0 && (
              <div className="buffet-foods-empty" style={{ marginTop: '0.5rem' }}>
                Chưa chọn món nào.
              </div>
            )}
          </div>

          <div className="buffet-create-actions">
            <button className="buffet-btn-cancel" onClick={closeBuffetModal} disabled={formLoading}>
              Hủy
            </button>
            <button className="buffet-btn-primary" onClick={handleSubmitBuffet} disabled={formLoading}>
              {formLoading && <RefreshCw size={16} className="buffet-spin" />}
              {editBuffetId ? 'Lưu thay đổi' : 'Tạo Buffet'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!detailModalOpen) return null;
    return (
      <div className="buffet-create-overlay" onClick={(e) => e.target === e.currentTarget && closeDetailModal()}>
        <div className="buffet-create-modal buffet-modal-in" style={{ maxWidth: 720 }}>
          <div className="buffet-create-head">
            <h3 className="buffet-create-title">Chi tiết gói Buffet</h3>
            <button className="buffet-create-close" onClick={closeDetailModal}><X size={20} /></button>
          </div>

          <div className="buffet-create-form">
            {detailLoading ? (
              <div className="buffet-foods-loading">
                <RefreshCw size={24} className="buffet-spin" /> Đang tải...
              </div>
            ) : detailBuffet ? (
              <>
                <div className="buffet-detail-info">
                  <h4 className="buffet-detail-name">{detailBuffet.name}</h4>
                  <p className="buffet-detail-desc">{detailBuffet.description || 'Không có mô tả.'}</p>
                  <div className="buffet-detail-prices">
                    <div className="buffet-price-item">
                      <span className="buffet-price-label">Người lớn:</span>
                      <span className="buffet-price-value">{formatPriceVnd(detailBuffet.mainPrice)}</span>
                    </div>
                    <div className="buffet-price-item">
                      <span className="buffet-price-label">Trẻ em:</span>
                      <span className="buffet-price-value">{formatPriceVnd(detailBuffet.childrenPrice)}</span>
                    </div>
                    <div className="buffet-price-item">
                      <span className="buffet-price-label">Phụ:</span>
                      <span className="buffet-price-value">{formatPriceVnd(detailBuffet.sidePrice)}</span>
                    </div>
                  </div>
                  <div className={`combo-status-badge ${detailBuffet.isAvailable ? 'combo-status-active' : 'combo-status-inactive'}`}>
                    {detailBuffet.isAvailable ? 'Đang bán' : 'Ngừng bán'}
                  </div>
                </div>

                <div className="buffet-form-section-header">
                  <h4 className="buffet-form-section-title">Danh sách món ăn ({detailBuffet.foods?.length || 0})</h4>
                </div>

                {detailBuffet.foods && detailBuffet.foods.length > 0 ? (
                  <table className="combo-detail-table">
                    <thead>
                      <tr>
                        <th>Món ăn</th>
                        <th>Hình</th>
                        <th>Số lượng</th>
                        <th>Không giới hạn</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailBuffet.foods.map((f) => (
                        <tr key={f.foodId}>
                          <td className="combo-detail-food-name">{f.foodName || `Món #${f.foodId}`}</td>
                          <td>
                            {f.foodImage ? (
                              <img src={resolveFoodImageUrl(f.foodImage)} alt={f.foodName} className="buffet-food-thumb" />
                            ) : (
                              <span className="buffet-no-image">-</span>
                            )}
                          </td>
                          <td className="combo-detail-food-qty">
                            {f.isUnlimited ? (
                              <span style={{ color: '#FF6C1F', fontWeight: 600 }}>∞</span>
                            ) : f.quantity}
                          </td>
                          <td>{f.isUnlimited ? 'Có' : 'Không'}</td>
                          <td>
                            <button
                              className="combo-food-remove-btn"
                              onClick={() => handleRemoveFoodFromBuffet(detailBuffet.id, f.foodId)}
                              disabled={removingFoodId === f.foodId}
                              title="Xóa món khỏi gói Buffet"
                            >
                              {removingFoodId === f.foodId ? (
                                <RefreshCw size={15} className="buffet-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="buffet-foods-empty">Chưa có món ăn nào trong gói Buffet này.</div>
                )}
              </>
            ) : (
              <div className="buffet-foods-empty">Không có dữ liệu.</div>
            )}
          </div>

          <div className="buffet-create-actions">
            <button className="buffet-btn-cancel" onClick={closeDetailModal}>Đóng</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-menu-management">
      {renderToast()}
      {renderFormModal()}
      {renderDetailModal()}

      {/* Header */}
      <div className="buffet-page-header">
        <div className="buffet-page-header-left">
          <h2 className="buffet-page-title">Quản lý Buffet</h2>
          <p className="buffet-page-subtitle">Danh sách các gói buffet của nhà hàng</p>
        </div>
        <div className="buffet-page-header-right">
          <button className="buffet-refresh-btn" onClick={() => loadData()} title="Làm mới">
            <RefreshCw size={18} />
          </button>
          <button className="buffet-add-btn" onClick={openAddBuffet}>
            <Plus size={18} /> Thêm Buffet
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="buffet-search-bar">
        <div className="buffet-search-wrap">
          <Search size={18} className="buffet-search-icon" />
          <input
            type="text"
            className="buffet-search-input"
            placeholder="Tìm kiếm tên gói buffet..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="buffet-filter-tabs">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`buffet-filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Cards */}
      <div className="buffet-grid-container">
        {loading ? (
          <div className="buffet-loading-state">
            <RefreshCw size={32} className="buffet-spin" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="buffet-error-state">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button className="buffet-retry-btn" onClick={() => loadData()}>Thử lại</button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="buffet-empty-state">
            <div className="buffet-empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="buffet-empty-text">Không có gói Buffet nào</p>
            <button className="buffet-add-btn" onClick={openAddBuffet}>
              <Plus size={18} /> Thêm Buffet đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className="buffet-grid">
              {paginated.map((b) => (
                <div key={b.id} className="buffet-card">
                  {/* Card Image */}
                  <div className="buffet-card-image">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.name} />
                    ) : (
                      <div className="buffet-card-image-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )}
                    <div
                      className={`buffet-card-status ${b.isAvailable ? 'status-open' : 'status-closed'}`}
                      onClick={() => handleToggleStatus(b)}
                    >
                      <span className="buffet-status-dot" />
                      {b.isAvailable ? 'Đang bán' : 'Ngừng bán'}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="buffet-card-content">
                    <h3 className="buffet-card-name">{b.name}</h3>
                    <p className="buffet-card-desc">{b.description || 'Không có mô tả'}</p>

                    <div className="buffet-card-prices">
                      <div className="buffet-price-tag">
                        <span className="buffet-price-label">NL</span>
                        <span className="buffet-price-amount">{formatPriceVnd(b.mainPrice)}</span>
                      </div>
                      <div className="buffet-price-tag">
                        <span className="buffet-price-label">TE</span>
                        <span className="buffet-price-amount">{formatPriceVnd(b.childrenPrice)}</span>
                      </div>
                      <div className="buffet-price-tag">
                        <span className="buffet-price-label">Phụ</span>
                        <span className="buffet-price-amount">{formatPriceVnd(b.sidePrice)}</span>
                      </div>
                    </div>

                    <div className="buffet-card-footer">
                      <div className="buffet-card-foods">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>
                        <span>{b.foods?.length || 0} món</span>
                      </div>
                      <div className="buffet-card-actions">
                        <button className="buffet-action-btn" onClick={() => openDetailModal(b)} title="Xem chi tiết">
                          <Eye size={16} />
                        </button>
                        <button className="buffet-action-btn" onClick={() => openEditBuffet(b)} title="Chỉnh sửa">
                          <Pencil size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="buffet-pagination">
                <button
                  className="buffet-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="buffet-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`buffet-page-btn ${safePage === p ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  className="buffet-page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
