import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, FileImage } from 'lucide-react';
import '../../../styles/AdminMenuManagement.css';

const MOCK_BUFFETS = [
  { id: 1, name: 'Buffet Hải Sản Cao Cấp', description: 'Hơn 50 món hải sản tươi sống được chế biến theo phong cách Á - Âu, bao gồm tôm hùm, cua tuyết...', priceMain: 599000, priceChild: 299000, priceExtra: 50000, image: 'https://picsum.photos/seed/buffet1/80/80', status: true, menuIds: [1, 2, 6] },
  { id: 2, name: 'Buffet Lẩu Hải Sản', description: 'Đặc sản biển tươi sống kèm 12 loại nước dùng.', priceMain: 299000, priceChild: 149000, priceExtra: 39000, image: 'https://picsum.photos/seed/buffet2/80/80', status: true, menuIds: [] },
  { id: 3, name: 'Buffet Chay Thanh Đạm', description: 'Các món chay từ rau củ quả hữu cơ.', priceMain: 199000, priceChild: 99000, priceExtra: 29000, image: 'https://picsum.photos/seed/buffet3/80/80', status: false, menuIds: [] }
];

const DISH_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'khai-vi', label: 'Khai vị' },
  { id: 'mon-chinh', label: 'Món chính' },
  { id: 'hai-san', label: 'Trải nghiệm Hải sản' },
  { id: 'trang-mieng', label: 'Tráng miệng' }
];

const MOCK_DISHES = [
  { id: 1, name: 'Súp Bào Ngư Vi Cá', description: 'Súp bào ngư đặc biệt', category: 'khai-vi', categoryLabel: 'Món khai vị', image: 'https://picsum.photos/seed/soup/80/80' },
  { id: 2, name: 'Tôm Hùm Nướng Phô Mai', description: 'Tôm hùm tươi nướng phô mai', category: 'mon-chinh', categoryLabel: 'Món chính', image: 'https://picsum.photos/seed/lobster/80/80' },
  { id: 3, name: 'Cua Tuyết Hấp Nhiệt', description: 'Cua tuyết hấp giữ vị ngọt', category: 'hai-san', categoryLabel: 'Hải sản', image: 'https://picsum.photos/seed/crab/80/80' },
  { id: 4, name: 'Sashimi Cá Hồi Tươi', description: 'Cá hồi Na Uy tươi sống', category: 'hai-san', categoryLabel: 'Hải sản', image: 'https://picsum.photos/seed/sashimi/80/80' },
  { id: 5, name: 'Hàu Nướng Mỡ Hành', description: 'Hàu nướng mỡ hành thơm', category: 'hai-san', categoryLabel: 'Hải sản', image: 'https://picsum.photos/seed/oyster/80/80' },
  { id: 6, name: 'Chè Tổ Yến Hạt Sen', description: 'Chè tổ yến bổ dưỡng', category: 'trang-mieng', categoryLabel: 'Tráng miệng', image: 'https://picsum.photos/seed/che/80/80' }
];

const formatPrice = (n) => (n != null && n !== '' ? Number(n).toLocaleString('vi-VN') + ' đ' : '0 đ');

const defaultBuffetForm = () => ({
  name: '',
  description: '',
  priceMain: 0,
  priceChild: 0,
  priceExtra: 0,
  imageFile: null,
  imagePreview: null,
  status: true,
});

const AdminMenuBuffet = () => {
  const [buffets, setBuffets] = useState(MOCK_BUFFETS);
  const [search, setSearch] = useState('');
  const [buffetModalOpen, setBuffetModalOpen] = useState(false);
  const [editingBuffetId, setEditingBuffetId] = useState(null);
  const [buffetModalTab, setBuffetModalTab] = useState(1);
  const [buffetForm, setBuffetForm] = useState(defaultBuffetForm);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [dishSearch, setDishSearch] = useState('');
  const [dishCategoryFilter, setDishCategoryFilter] = useState('all');

  const filtered = buffets.filter(
    (b) => !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddBuffet = () => {
    setEditingBuffetId(null);
    setBuffetForm(defaultBuffetForm());
    setSelectedMenuIds([]);
    setBuffetModalTab(1);
    setBuffetModalOpen(true);
  };

  const openEditBuffet = (row) => {
    setEditingBuffetId(row.id);
    setBuffetForm({
      name: row.name,
      description: row.description || '',
      priceMain: row.priceMain ?? 0,
      priceChild: row.priceChild ?? 0,
      priceExtra: row.priceExtra ?? 0,
      imageFile: null,
      imagePreview: row.image || null,
      status: row.status ?? true,
    });
    setSelectedMenuIds(row.menuIds ?? []);
    setBuffetModalTab(1);
    setBuffetModalOpen(true);
  };

  const closeBuffetModal = () => {
    setBuffetModalOpen(false);
    setEditingBuffetId(null);
    setBuffetForm(defaultBuffetForm());
    setSelectedMenuIds([]);
    setBuffetModalTab(1);
  };

  const handleSaveBuffet = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const imageUrl = buffetForm.imageFile ? buffetForm.imagePreview : (editingBuffetId && buffets.find((b) => b.id === editingBuffetId)?.image) || null;
    const payload = {
      name: buffetForm.name,
      description: buffetForm.description,
      priceMain: buffetForm.priceMain,
      priceChild: buffetForm.priceChild,
      priceExtra: buffetForm.priceExtra,
      image: imageUrl,
      status: buffetForm.status,
      menuIds: selectedMenuIds,
    };
    if (editingBuffetId) {
      setBuffets((prev) => prev.map((b) => (b.id === editingBuffetId ? { ...b, ...payload } : b)));
    } else {
      const newId = Math.max(...buffets.map((b) => b.id), 0) + 1;
      setBuffets((prev) => [...prev, { id: newId, ...payload }]);
    }
    closeBuffetModal();
  };

  const filteredDishes = MOCK_DISHES.filter((d) => {
    const matchSearch = !dishSearch || d.name.toLowerCase().includes(dishSearch.toLowerCase());
    const matchCat = dishCategoryFilter === 'all' || d.category === dishCategoryFilter;
    return matchSearch && matchCat;
  });

  const selectedDishes = MOCK_DISHES.filter((d) => selectedMenuIds.includes(d.id));

  const addDishToMenu = (id) => {
    if (!selectedMenuIds.includes(id)) setSelectedMenuIds((prev) => [...prev, id]);
  };

  const removeDishFromMenu = (id) => {
    setSelectedMenuIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className="menu-management-section">
      <div className="menu-section-toolbar">
        <div className="menu-search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm món, tên buffet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="menu-search-input"
          />
        </div>
        <select className="menu-select-filter">
          <option>Tất cả Category</option>
        </select>
        <select className="menu-select-filter">
          <option>Trạng thái: Tất cả</option>
        </select>
        <button type="button" className="menu-btn-primary" onClick={openAddBuffet}>
          <Plus size={18} />
          Thêm Buffet mới
        </button>
      </div>

      <div className="menu-buffet-list">
        <div className="menu-buffet-header">
          <span>GIÁ CHÍNH</span>
          <span>GIÁ TRẺ EM</span>
          <span>GIÁ PHỤ</span>
          <span>TRẠNG THÁI</span>
          <span>THAO TÁC</span>
        </div>
        {filtered.map((row) => (
          <div key={row.id} className="menu-buffet-row">
            <div className="menu-buffet-info">
              <div className="menu-buffet-img">
                {row.image ? <img src={row.image} alt={row.name} /> : <span>—</span>}
              </div>
              <div>
                <div className="menu-cell-name">{row.name}</div>
                <div className="menu-cell-desc">{row.description}</div>
              </div>
            </div>
            <span className="menu-cell-price">{formatPrice(row.priceMain)}</span>
            <span className="menu-cell-price">{formatPrice(row.priceChild)}</span>
            <span className="menu-cell-price">{formatPrice(row.priceExtra)}</span>
            <div>
              <button type="button" className={`menu-toggle ${row.status ? 'active' : ''}`} aria-label="Toggle">
                <span className="menu-toggle-thumb" />
              </button>
            </div>
            <div className="menu-actions-cell">
              <button type="button" className="menu-icon-btn" aria-label="Sửa" onClick={() => openEditBuffet(row)}><Pencil size={16} /></button>
              <button type="button" className="menu-icon-btn menu-icon-btn-danger" aria-label="Xóa"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="menu-pagination">
        <span>Hiển thị 1-{filtered.length} của {buffets.length} buffet</span>
        <div className="menu-pagination-btns">
          <button type="button" className="menu-page-btn" disabled>‹</button>
          <button type="button" className="menu-page-btn active">1</button>
          <button type="button" className="menu-page-btn">›</button>
        </div>
      </div>

      {buffetModalOpen && (
        <div className="buffet-modal-overlay" onClick={closeBuffetModal}>
          <div className="buffet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="buffet-modal-head">
              <div>
                <h2 className="buffet-modal-title">{editingBuffetId ? 'Chỉnh sửa thông tin Buffet' : 'Thêm Buffet mới'}</h2>
                <p className="buffet-modal-subtitle">Cập nhật chi tiết gói dịch vụ và thực đơn</p>
              </div>
              <button type="button" className="buffet-modal-close" onClick={closeBuffetModal} aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="buffet-modal-tabs">
              <button type="button" className={`buffet-tab ${buffetModalTab === 1 ? 'active' : ''}`} onClick={() => setBuffetModalTab(1)}>Thông tin chung</button>
              <button type="button" className={`buffet-tab ${buffetModalTab === 2 ? 'active' : ''}`} onClick={() => setBuffetModalTab(2)}>Chọn thực đơn</button>
            </div>

            {buffetModalTab === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setBuffetModalTab(2); }} className="buffet-modal-form">
                <div className="buffet-form-row">
                  <div className="buffet-form-group">
                    <label>Ảnh đại diện</label>
                    <label className="buffet-upload-zone">
                      <input type="file" accept="image/jpeg,image/png,image/jpg" className="buffet-upload-input" onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size <= 2 * 1024 * 1024) setBuffetForm((p) => ({ ...p, imageFile: f, imagePreview: URL.createObjectURL(f) })); else if (f) window.alert('File tối đa 2MB.'); }} />
                      {buffetForm.imagePreview ? (
                        <div className="buffet-upload-preview"><img src={buffetForm.imagePreview} alt="" /></div>
                      ) : (
                        <div className="buffet-upload-placeholder"><FileImage size={40} /><span>Chọn ảnh</span></div>
                      )}
                    </label>
                    <p className="buffet-upload-hint">Định dạng JPG, PNG. Tối đa 2MB</p>
                  </div>
                  <div className="buffet-form-fields">
                    <div className="buffet-form-group">
                      <label>Tên gói Buffet</label>
                      <input type="text" value={buffetForm.name} onChange={(e) => setBuffetForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ví dụ: Buffet Hải Sản Cao Cấp" />
                    </div>
                    <div className="buffet-form-group">
                      <label>Miêu tả ngắn</label>
                      <textarea value={buffetForm.description} onChange={(e) => setBuffetForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả gói buffet..." rows={4} />
                    </div>
                    <div className="buffet-form-row-prices">
                      <div className="buffet-form-group">
                        <label>Giá người lớn</label>
                        <input type="number" min={0} value={buffetForm.priceMain || ''} onChange={(e) => setBuffetForm((f) => ({ ...f, priceMain: Number(e.target.value) || 0 }))} /> <span className="buffet-currency">đ</span>
                      </div>
                      <div className="buffet-form-group">
                        <label>Giá trẻ em</label>
                        <input type="number" min={0} value={buffetForm.priceChild || ''} onChange={(e) => setBuffetForm((f) => ({ ...f, priceChild: Number(e.target.value) || 0 }))} /> <span className="buffet-currency">đ</span>
                      </div>
                      <div className="buffet-form-group">
                        <label>Phụ phí (Lễ/ Tết)</label>
                        <input type="number" min={0} value={buffetForm.priceExtra || ''} onChange={(e) => setBuffetForm((f) => ({ ...f, priceExtra: Number(e.target.value) || 0 }))} /> <span className="buffet-currency">đ</span>
                      </div>
                    </div>
                    <div className="buffet-form-group buffet-toggle-wrap">
                      <label className="buffet-toggle-label">Cho phép khách hàng đặt gói buffet này</label>
                      <button type="button" className={`menu-toggle ${buffetForm.status ? 'active' : ''}`} onClick={() => setBuffetForm((f) => ({ ...f, status: !f.status }))} aria-label="Bật/tắt"><span className="menu-toggle-thumb" /></button>
                    </div>
                  </div>
                </div>
                <div className="buffet-modal-actions">
                  <button type="button" className="combo-btn-cancel" onClick={closeBuffetModal}>Hủy bỏ</button>
                  <button type="submit" className="menu-btn-primary">Tiếp theo</button>
                </div>
              </form>
            )}

            {buffetModalTab === 2 && (
              <div className="buffet-tab2-wrap">
                <div className="buffet-tab2-left">
                  <div className="buffet-dish-search-wrap">
                    <Search size={18} className="buffet-dish-search-icon" />
                    <input type="text" placeholder="Tìm kiếm món ăn..." value={dishSearch} onChange={(e) => setDishSearch(e.target.value)} className="buffet-dish-search" />
                  </div>
                  <div className="buffet-dish-filters">
                    {DISH_CATEGORIES.map((c) => (
                      <button key={c.id} type="button" className={`menu-filter-btn ${dishCategoryFilter === c.id ? 'active' : ''}`} onClick={() => setDishCategoryFilter(c.id)}>{c.label}</button>
                    ))}
                  </div>
                  <div className="buffet-dish-grid">
                    {filteredDishes.map((d) => (
                      <div key={d.id} className="buffet-dish-card">
                        <div className="buffet-dish-card-img">{d.image ? <img src={d.image} alt={d.name} /> : <FileImage size={24} />}</div>
                        <div className="buffet-dish-card-body">
                          <div className="buffet-dish-card-name">{d.name}</div>
                          <div className="buffet-dish-card-desc">{d.description}</div>
                          <span className="buffet-dish-card-cat">{d.categoryLabel}</span>
                          <button type="button" className="buffet-dish-add-btn" onClick={() => addDishToMenu(d.id)} disabled={selectedMenuIds.includes(d.id)}><Plus size={14} /> Thêm</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="buffet-tab2-right">
                  <h3 className="buffet-selected-title">THỰC ĐƠN ĐÃ CHỌN <span className="buffet-selected-count">{selectedMenuIds.length} món</span></h3>
                  <ul className="buffet-selected-list">
                    {selectedDishes.map((d) => (
                      <li key={d.id} className="buffet-selected-item">
                        <span className="buffet-selected-name">{d.name}</span>
                        <span className="buffet-selected-cat">{d.categoryLabel}</span>
                        <button type="button" className="buffet-selected-remove" onClick={() => removeDishFromMenu(d.id)} aria-label="Xóa">×</button>
                      </li>
                    ))}
                  </ul>
                  <p className="buffet-limit-hint">Giới hạn món: Không giới hạn</p>
                  <p className="buffet-min-hint">Chọn ít nhất 1 món để lưu thực đơn này</p>
                  <div className="buffet-modal-actions">
                    <button type="button" className="combo-btn-cancel" onClick={() => setBuffetModalTab(1)}>Quay lại</button>
                    <button type="button" className="menu-btn-primary" onClick={handleSaveBuffet} disabled={selectedMenuIds.length === 0}>Lưu thay đổi</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenuBuffet;
