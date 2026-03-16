import React, { useState } from 'react';
import { Search, Package, Layers, Plus, Pencil, X } from 'lucide-react';
import '../../styles/AdminInventory.css';

const UNITS = [
  { value: 'kg', label: 'Kg' },
  { value: 'lit', label: 'Lit' },
  { value: 'gram', label: 'g (Gam)' },
  { value: 'cai', label: 'Cái' },
];

const MOCK_STOCK = [
  { batchId: 'BATCH-001', name: 'Thịt bò Wagyu (Thắt lưng)', unit: 'Kg', stock: 4.5, warningLevel: 10, status: 'warning' },
  { batchId: 'BATCH-012', name: 'Gạo Tám thơm ST25', unit: 'Kg', stock: 45.0, warningLevel: 20, status: 'normal' },
  { batchId: 'BATCH-605', name: 'Dầu ăn Neptune Gold', unit: 'Lit', stock: 8.0, warningLevel: 15, status: 'warning' },
  { batchId: 'BATCH-668', name: 'Cá hồi Nauy tươi', unit: 'Kg', stock: 12.5, warningLevel: 5, status: 'normal' },
];

const MOCK_HISTORY = [
  { time: '24/10/2023 14:30', batchId: 'BATCH-001', material: 'Thịt bò Wagyu', type: 'import', qty: 20, unit: 'Kg', reason: 'Nhập từ nhà cung cấp MeatWorld', performer: 'Lan Anh' },
  { time: '24/10/2023 10:15', batchId: 'BATCH-612', material: 'Gạo ST25', type: 'export', qty: -15, unit: 'Kg', reason: 'Sử dụng cho bếp chính (Sáng)', performer: 'Minh Hoàng' },
  { time: '23/10/2023 18:45', batchId: 'BATCH-008', material: 'Cá hồi Nauy', type: 'export', qty: -2, unit: 'Kg', reason: 'Nguyên liệu hỏng/Hết hạn', performer: 'Quốc Thái' },
  { time: '23/10/2023 09:00', batchId: 'BATCH-005', material: 'Dầu ăn Neptune', type: 'import', qty: 10, unit: 'Lit', reason: 'Đơn hàng định kỳ', performer: 'Lan Anh' },
];

const MOCK_CATEGORY = [
  { id: 1, name: 'Thịt bò Wagyu', unit: 'kg', description: 'Nhập khẩu trực tiếp từ Nhật Bản, loại A5 cao cấp.', active: true },
  { id: 2, name: 'Gạo thơm ST25', unit: 'kg', description: 'Gạo đạt giải nhất thế giới, sử dụng cho cơm niêu.', active: true },
  { id: 3, name: 'Rượu vang đỏ', unit: 'lit', description: 'Vang Cabernet Sauvignon niên đại 2018.', active: true },
  { id: 4, name: 'Nấm Truffle Đen', unit: 'gram', description: 'Nguyên liệu nhập theo mùa vụ đặc biệt.', active: false },
  { id: 5, name: 'Khăn giấy cao cấp', unit: 'cái', description: 'Dùng trong khu vực VIP, định lượng 3 lớp.', active: true },
];

const AdminInventoryPage = () => {
  const [mainTab, setMainTab] = useState('stock'); // 'stock' | 'category'
  const [searchStock, setSearchStock] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('01/10/2023 - 31/10/2023');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryTab, setCategoryTab] = useState('danh-muc'); // 'danh-muc' | 'lo-hang'
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [ingredients, setIngredients] = useState(MOCK_CATEGORY);
  const [form, setForm] = useState({
    name: '',
    unit: '',
    smallestUnit: 'gram',
    warningLevel: 0,
    description: '',
  });

  const handleAddIngredient = (e) => {
    e.preventDefault();
    const newItem = {
      id: Math.max(...ingredients.map((i) => i.id), 0) + 1,
      name: form.name,
      unit: form.unit,
      description: form.description,
      active: true,
    };
    setIngredients((prev) => [...prev, newItem]);
    setForm({ name: '', unit: '', smallestUnit: 'gram', warningLevel: 0, description: '' });
    setAddModalOpen(false);
  };

  const toggleIngredientStatus = (id) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, active: !i.active } : i))
    );
  };

  const filteredCategory = ingredients.filter((i) => {
    const matchSearch = !searchCategory || i.name.toLowerCase().includes(searchCategory.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && i.active) ||
      (statusFilter === 'inactive' && !i.active);
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-inventory">
      <header className="inv-header">
        <div>
          <h1 className="inv-title">Quản lý Kho hàng</h1>
          <p className="inv-subtitle">Theo dõi nguyên liệu và lịch sử nhập xuất</p>
        </div>
        <div className="inv-top-actions">
          <div className="inv-search-wrap">
            <Search size={18} className="inv-search-icon" />
            <input
              type="text"
              className="inv-search"
              placeholder={mainTab === 'stock' ? 'Tìm kiếm nguyên liệu...' : 'Tìm kiếm tên nguyên liệu...'}
              value={mainTab === 'stock' ? searchStock : searchCategory}
              onChange={(e) => (mainTab === 'stock' ? setSearchStock(e.target.value) : setSearchCategory(e.target.value))}
            />
          </div>
          {mainTab === 'stock' ? (
            <button type="button" className="inv-btn-primary" onClick={() => window.alert('Chức năng nhập hàng sẽ tích hợp sau.')}>
              <Plus size={18} />
              Nhập hàng mới
            </button>
          ) : (
            <button type="button" className="inv-btn-primary" onClick={() => setAddModalOpen(true)}>
              <Plus size={18} />
              Thêm nguyên liệu mới
            </button>
          )}
        </div>
      </header>

      <div className="inv-tabs-main">
        <button
          type="button"
          className={`inv-tab-main ${mainTab === 'stock' ? 'active' : ''}`}
          onClick={() => setMainTab('stock')}
        >
          Tồn kho & Lịch sử
        </button>
        <button
          type="button"
          className={`inv-tab-main ${mainTab === 'category' ? 'active' : ''}`}
          onClick={() => setMainTab('category')}
        >
          Quản lý Danh mục hàng hóa
        </button>
      </div>

      {mainTab === 'stock' ? (
        <>
          <section className="inv-card">
            <div className="inv-card-head">
              <h2 className="inv-card-title">Tồn kho hiện tại</h2>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Mã lô</th>
                    <th>Tên nguyên liệu</th>
                    <th>Đơn vị</th>
                    <th>Tồn kho</th>
                    <th>Mức cảnh báo</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_STOCK.map((row) => (
                    <tr key={row.batchId}>
                      <td>{row.batchId}</td>
                      <td>{row.name}</td>
                      <td>{row.unit}</td>
                      <td className={row.status === 'warning' ? 'inv-stock-low' : ''}>{row.stock}</td>
                      <td>{row.warningLevel}</td>
                      <td>
                        <span className={`inv-pill inv-pill-${row.status}`}>
                          {row.status === 'warning' ? 'Cảnh báo: Sắp hết hàng' : 'Bình thường'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="inv-pagination">
              <span>Hiển thị 4 trong tổng số 56 nguyên liệu</span>
              <div className="inv-pagination-btns">
                <button type="button" className="inv-page-btn">&lt;</button>
                <button type="button" className="inv-page-btn active">1</button>
                <button type="button" className="inv-page-btn">2</button>
                <button type="button" className="inv-page-btn">3</button>
                <button type="button" className="inv-page-btn">...</button>
                <button type="button" className="inv-page-btn">6</button>
                <button type="button" className="inv-page-btn">&gt;</button>
              </div>
            </div>
          </section>

          <section className="inv-card">
            <div className="inv-card-head">
              <h2 className="inv-card-title">Lịch sử Nhập/Xuất kho</h2>
              <div className="inv-filters">
                <div className="inv-filter-date">
                  <input type="text" className="inv-input" value={dateRange} readOnly />
                </div>
                <select className="inv-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">Tất cả loại</option>
                  <option value="import">Nhập kho</option>
                  <option value="export">Xuất kho</option>
                </select>
              </div>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Mã lô</th>
                    <th>Nguyên liệu</th>
                    <th>Loại</th>
                    <th>Số lượng</th>
                    <th>Lý do</th>
                    <th>Người thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_HISTORY.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.time}</td>
                      <td>{row.batchId}</td>
                      <td>{row.material}</td>
                      <td>
                        <span className={row.type === 'import' ? 'inv-type-import' : 'inv-type-export'}>
                          {row.type === 'import' ? 'Nhập kho' : 'Xuất kho'}
                        </span>
                      </td>
                      <td className={row.qty >= 0 ? 'inv-qty-import' : 'inv-qty-export'}>
                        {row.qty >= 0 ? '+' : ''}{row.qty} {row.unit}
                      </td>
                      <td>{row.reason}</td>
                      <td>{row.performer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="inv-pagination">
              <span>Hiển thị 4 trong tổng số 128 bản ghi</span>
              <div className="inv-pagination-btns">
                <button type="button" className="inv-page-btn">&lt;</button>
                <button type="button" className="inv-page-btn active">1</button>
                <button type="button" className="inv-page-btn">2</button>
                <button type="button" className="inv-page-btn">3</button>
                <button type="button" className="inv-page-btn">...</button>
                <button type="button" className="inv-page-btn">12</button>
                <button type="button" className="inv-page-btn">&gt;</button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="inv-card">
          {categoryTab === 'danh-muc' && (
            <>
              <div className="inv-filter-bar">
                <div className="inv-search-wrap inv-search-wrap-inline">
                  <Search size={18} className="inv-search-icon" />
                  <input
                    type="text"
                    className="inv-search"
                    placeholder="Tìm kiếm tên nguyên liệu..."
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                  />
                </div>
                <div className="inv-status-filter">
                  <span>Trạng thái:</span>
                  <select className="inv-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngừng bán</option>
                  </select>
                </div>
              </div>
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>TÊN NGUYÊN LIỆU</th>
                      <th>ĐƠN VỊ TÍNH</th>
                      <th>MIÊU TẢ</th>
                      <th>TRẠNG THÁI</th>
                      <th>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategory.map((row) => (
                      <tr key={row.id}>
                        <td className="inv-name">{row.name}</td>
                        <td>{row.unit}</td>
                        <td className="inv-desc">{row.description}</td>
                        <td>
                          <button
                            type="button"
                            className={`inv-toggle ${row.active ? 'active' : ''}`}
                            onClick={() => toggleIngredientStatus(row.id)}
                            aria-label={row.active ? 'Tắt' : 'Bật'}
                          >
                            <span className="inv-toggle-slider" />
                          </button>
                          <span className="inv-status-label">{row.active ? 'Hoạt động' : 'Ngừng bán'}</span>
                        </td>
                        <td>
                          <button type="button" className="inv-icon-btn" aria-label="Sửa">
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="inv-pagination">
                <span>Hiển thị 1 đến {filteredCategory.length} trên {ingredients.length} kết quả</span>
                <div className="inv-pagination-btns">
                  <button type="button" className="inv-page-btn">Trước</button>
                  <button type="button" className="inv-page-btn active">1</button>
                  <button type="button" className="inv-page-btn">2</button>
                  <button type="button" className="inv-page-btn">3</button>
                  <button type="button" className="inv-page-btn">Sau</button>
                </div>
              </div>
            </>
          )}
          {categoryTab === 'lo-hang' && (
            <div className="inv-placeholder">
              <p>Nội dung Lô hàng sẽ hiển thị tại đây.</p>
            </div>
          )}
        </section>
      )}

      {addModalOpen && (
        <div className="inv-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-head">
              <h2 className="inv-modal-title">Thêm nguyên liệu mới</h2>
              <button type="button" className="inv-modal-close" onClick={() => setAddModalOpen(false)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddIngredient} className="inv-modal-form">
              <div className="inv-form-group">
                <label>Tên nguyên liệu <span className="inv-required">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thịt bò thân, Hành lá..."
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="inv-form-group">
                <label>Đơn vị tính <span className="inv-required">*</span></label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  required
                >
                  <option value="">Chọn đơn vị</option>
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div className="inv-form-group">
                <label>Đơn vị đo (nhỏ nhất)</label>
                <select
                  value={form.smallestUnit}
                  onChange={(e) => setForm((f) => ({ ...f, smallestUnit: e.target.value }))}
                >
                  <option value="gram">g (Gam)</option>
                  <option value="ml">ml</option>
                  <option value="cai">Cái</option>
                </select>
              </div>
              <div className="inv-form-group">
                <label>Mức cảnh báo tồn kho</label>
                <div className="inv-form-row">
                  <input
                    type="number"
                    min={0}
                    value={form.warningLevel}
                    onChange={(e) => setForm((f) => ({ ...f, warningLevel: e.target.value }))}
                  />
                  <span className="inv-form-unit">số lượng</span>
                </div>
                <p className="inv-form-hint">Hệ thống sẽ thông báo khi tồn kho thấp hơn mức này.</p>
              </div>
              <div className="inv-form-group">
                <label>Miêu tả</label>
                <textarea
                  placeholder="Nhập ghi chú hoặc miêu tả chi tiết về nguyên liệu..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="inv-modal-actions">
                <button type="button" className="inv-modal-btn inv-modal-cancel" onClick={() => setAddModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="inv-modal-btn inv-modal-confirm">
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryPage;
