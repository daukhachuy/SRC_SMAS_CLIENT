import React, { useState } from 'react';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import '../../styles/AdminTableMap.css';

const FLOORS = ['Tất cả các khu vực', 'Tầng 1', 'Tầng 2', 'Sân vườn'];
const TABLE_TYPES = ['Tất cả loại bàn', 'Thường', 'VIP'];
const LOCATION_TYPES = ['Trong nhà', 'Ngoài trời'];
const VIP_OPTIONS = [{ value: 'none', label: 'None' }, { value: 'vip', label: 'VIP' }];

const MOCK_TABLES = [
  { id: 1, name: 'Bàn 01', area: 'Tầng 1', current: 4, max: 6, status: 'in_use', amount: '1,250,000₫', locationType: 'Trong nhà', vipStatus: 'none', notes: '' },
  { id: 2, name: 'Bàn 02', area: 'Tầng 1', current: 0, max: 4, status: 'empty', amount: '0đ', locationType: 'Trong nhà', vipStatus: 'none', notes: '' },
  { id: 3, name: 'Bàn 03 (VIP)', area: 'Tầng 1', current: 8, max: 10, status: 'in_use', amount: '4,800,000₫', locationType: 'Trong nhà', vipStatus: 'vip', notes: '' },
  { id: 4, name: 'Bàn 04', area: 'Tầng 1', current: 0, max: 2, status: 'empty', amount: '0đ', locationType: 'Trong nhà', vipStatus: 'none', notes: '' },
  { id: 5, name: 'Bàn 05', area: 'Tầng 1', current: 0, max: 4, status: 'empty', amount: '0đ', locationType: 'Trong nhà', vipStatus: 'none', notes: '' },
  { id: 6, name: 'Bàn 06', area: 'Tầng 2', current: 0, max: 4, status: 'empty', amount: '0đ', locationType: 'Trong nhà', vipStatus: 'none', notes: '' },
  { id: 7, name: 'Bàn 07', area: 'Sân vườn', current: 0, max: 6, status: 'empty', amount: '0đ', locationType: 'Ngoài trời', vipStatus: 'none', notes: '' }
];

/** Lấy số hiển thị từ tên bàn: "Bàn 01" -> "01", "Bàn 03 (VIP)" -> "03 (VIP)" */
const getTableDisplayNumber = (name) => {
  const match = name.replace(/^Bàn\s+/i, '').trim();
  return match || name;
};

const PAGE_SIZE = 7;

const AdminTableMap = () => {
  const [activeTab, setActiveTab] = useState('in_use'); // 'in_use' | 'all'
  const [floorFilter, setFloorFilter] = useState(FLOORS[0]);
  const [typeFilter, setTypeFilter] = useState(TABLE_TYPES[0]);
  const [tables, setTables] = useState(MOCK_TABLES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null); // { id, name, area, max, locationType, vipStatus, notes }
  const [listPage, setListPage] = useState(1);

  const totalTables = tables.length;
  const totalPages = Math.ceil(totalTables / PAGE_SIZE) || 1;
  const paginatedTables = tables.slice(
    (listPage - 1) * PAGE_SIZE,
    listPage * PAGE_SIZE
  );
  const startItem = (listPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(listPage * PAGE_SIZE, totalTables);

  const applyVipToName = (name, vipStatus) => {
    const base = name.replace(/\s*\(VIP\)\s*$/i, '').trim();
    return vipStatus === 'vip' ? `${base} (VIP)` : base;
  };

  const handleAddTable = (e) => {
    e.preventDefault();
    const form = e.target;
    let name = form.tableName?.value?.trim() || `Bàn ${tables.length + 1}`;
    const area = form.area?.value || 'Tầng 1';
    const max = parseInt(form.maxGuests?.value, 10) || 4;
    const locationType = form.locationType?.value || 'Trong nhà';
    const vipStatus = form.vipStatus?.value || 'none';
    const notes = form.notes?.value?.trim() || '';
    name = applyVipToName(name, vipStatus);
    setTables((prev) => [
      ...prev,
      { id: Date.now(), name, area, current: 0, max, status: 'empty', amount: '0đ', locationType, vipStatus, notes }
    ]);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTable) return;
    const form = e.target;
    let name = form.tableName?.value?.trim() || editingTable.name;
    const locationType = form.locationType?.value || 'Trong nhà';
    const vipStatus = form.vipStatus?.value || 'none';
    const max = parseInt(form.maxGuests?.value, 10) || editingTable.max;
    const notes = form.notes?.value?.trim() || '';
    name = applyVipToName(name, vipStatus);
    setTables((prev) =>
      prev.map((t) =>
        t.id === editingTable.id
          ? { ...t, name, locationType, vipStatus, max, notes }
          : t
      )
    );
    setEditingTable(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa bàn này?')) {
      setTables((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="admin-tablemap">
      <header className="tablemap-header">
        <div>
          <h1 className="tablemap-title">Sơ đồ bàn</h1>
          <p className="tablemap-subtitle">
            Quản lý vị trí và tình trạng bàn thời gian thực
          </p>
        </div>
      </header>

      <div className="tablemap-tabs-row">
        <div className="tablemap-tabs">
          <button
            type="button"
            className={`tablemap-tab ${activeTab === 'in_use' ? 'active' : ''}`}
            onClick={() => setActiveTab('in_use')}
          >
            Bàn đang dùng
          </button>
          <button
            type="button"
            className={`tablemap-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả bàn
          </button>
        </div>
        <div className="tablemap-actions">
          <select
            className="tablemap-select"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
          >
            {FLOORS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            className="tablemap-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {TABLE_TYPES.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <button
            type="button"
            className="tablemap-add-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} />
            <span>Thêm bàn mới</span>
          </button>
        </div>
      </div>

      {/* Ảnh 1: Bàn đang dùng = lưới thẻ */}
      {activeTab === 'in_use' && (
        <section className="tablemap-grid-wrap">
          <div className="tablemap-grid">
            {tables.map((t) => (
              <article
                key={t.id}
                className={`tablemap-table-card tablemap-table-card-${t.status}`}
              >
                <div className="tablemap-card-head">
                  <span className="tablemap-card-number">{getTableDisplayNumber(t.name)}</span>
                  <span className={`tablemap-card-badge tablemap-card-badge-${t.status}`}>
                    {t.status === 'in_use' ? 'ĐANG DÙNG' : 'TRỐNG'}
                  </span>
                </div>
                <div className="tablemap-card-capacity">
                  <Users size={16} />
                  {t.status === 'in_use' ? (
                    <span>{t.current}/{t.max} người</span>
                  ) : (
                    <span>Tối đa {t.max} người</span>
                  )}
                </div>
                {t.status === 'in_use' && (
                  <p className="tablemap-card-amount">{t.amount}</p>
                )}
                {t.status === 'empty' && t.amount === '0đ' && (
                  <p className="tablemap-card-amount tablemap-card-amount-empty">{t.amount}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Ảnh 2: Tất cả bàn = dạng danh sách (bảng) */}
      {activeTab === 'all' && (
        <section className="tablemap-card tablemap-list-card">
          <div className="tablemap-table-wrap">
            <table className="tablemap-table">
              <thead>
                <tr>
                  <th>TÊN BÀN</th>
                  <th>KHU VỰC</th>
                  <th>SỐ LƯỢNG KHÁCH</th>
                  <th>TRẠNG THÁI</th>
                  <th>HOẠT ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTables.map((row) => (
                  <tr key={row.id}>
                    <td className="tablemap-cell-name">{row.name}</td>
                    <td>{row.area}</td>
                    <td>
                      <span className="tablemap-guests">
                        <Users size={14} />
                        {row.current} / {row.max} người
                      </span>
                    </td>
                    <td>
                      <span className={`tablemap-status tablemap-status-${row.status}`}>
                        {row.status === 'in_use' ? 'ĐANG DÙNG' : 'TRỐNG'}
                      </span>
                    </td>
                    <td>
                      <div className="tablemap-actions-cell">
                        <button
                          type="button"
                          className="tablemap-icon-btn"
                          title="Sửa"
                          aria-label="Sửa"
                          onClick={() => setEditingTable({ ...row })}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="tablemap-icon-btn tablemap-icon-btn-danger"
                          title="Xóa"
                          aria-label="Xóa"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="tablemap-pagination">
            <span className="tablemap-pagination-info">
              Hiển thị {startItem}-{endItem} của {totalTables} bàn
            </span>
            <div className="tablemap-pagination-controls">
              <button
                type="button"
                className="tablemap-page-btn"
                disabled={listPage <= 1}
                onClick={() => setListPage((p) => p - 1)}
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`tablemap-page-btn ${listPage === p ? 'active' : ''}`}
                  onClick={() => setListPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="tablemap-page-btn"
                disabled={listPage >= totalPages}
                onClick={() => setListPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      )}

      {showAddModal && (
        <div className="tablemap-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="tablemap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tablemap-modal-header">
              <h2>Thêm bàn mới</h2>
              <button type="button" className="tablemap-modal-close" onClick={() => setShowAddModal(false)} aria-label="Đóng">
                ×
              </button>
            </div>
            <form onSubmit={handleAddTable} className="tablemap-modal-body">
              <div className="tablemap-form-group">
                <label htmlFor="add-tableName">Tên bàn</label>
                <input id="add-tableName" name="tableName" type="text" placeholder="VD: Bàn 08" />
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="add-area">Khu vực</label>
                <select id="add-area" name="area">
                  <option value="Tầng 1">Tầng 1</option>
                  <option value="Tầng 2">Tầng 2</option>
                  <option value="Sân vườn">Sân vườn</option>
                </select>
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="add-locationType">Loại bàn</label>
                <select id="add-locationType" name="locationType">
                  {LOCATION_TYPES.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="add-vipStatus">VIP</label>
                <select id="add-vipStatus" name="vipStatus">
                  {VIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="add-maxGuests">Số lượng khách tối đa</label>
                <div className="tablemap-input-with-icon">
                  <Users size={18} />
                  <input id="add-maxGuests" name="maxGuests" type="number" min="1" max="20" defaultValue={4} />
                </div>
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="add-notes">Ghi chú bàn</label>
                <textarea id="add-notes" name="notes" rows={3} placeholder="Nhập ghi chú cho bàn này..." />
              </div>
              <div className="tablemap-modal-footer">
                <button type="button" className="tablemap-btn-secondary" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="tablemap-btn-primary">
                  Thêm bàn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTable && (
        <div className="tablemap-modal-overlay" onClick={() => setEditingTable(null)}>
          <div className="tablemap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tablemap-modal-header">
              <h2>Chỉnh sửa thông tin bàn</h2>
              <button type="button" className="tablemap-modal-close" onClick={() => setEditingTable(null)} aria-label="Đóng">
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="tablemap-modal-body">
              <div className="tablemap-form-group">
                <label htmlFor="edit-tableName">Tên bàn</label>
                <input id="edit-tableName" name="tableName" type="text" defaultValue={editingTable.name} />
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="edit-locationType">Loại bàn</label>
                <select id="edit-locationType" name="locationType" defaultValue={editingTable.locationType || 'Trong nhà'}>
                  {LOCATION_TYPES.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="edit-vipStatus">VIP</label>
                <select id="edit-vipStatus" name="vipStatus" defaultValue={editingTable.vipStatus || 'none'}>
                  {VIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="edit-maxGuests">Số lượng khách tối đa</label>
                <div className="tablemap-input-with-icon">
                  <Users size={18} />
                  <input id="edit-maxGuests" name="maxGuests" type="number" min="1" max="20" defaultValue={editingTable.max} />
                </div>
              </div>
              <div className="tablemap-form-group">
                <label htmlFor="edit-notes">Ghi chú bàn</label>
                <textarea id="edit-notes" name="notes" rows={3} placeholder="Nhập ghi chú cho bàn này..." defaultValue={editingTable.notes} />
              </div>
              <div className="tablemap-modal-footer">
                <button type="button" className="tablemap-btn-secondary" onClick={() => setEditingTable(null)}>
                  Hủy
                </button>
                <button type="submit" className="tablemap-btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTableMap;
