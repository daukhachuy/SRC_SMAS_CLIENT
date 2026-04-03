import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  isTableRowInUse,
  parseTableApiError,
} from '../../api/tableApi';
import '../../styles/AdminTableMap.css';

const TABLE_TYPES = [
  { value: 'indoor', label: 'Trong nhà' },
  { value: 'outdoor', label: 'Sân vườn' },
  { value: 'vip', label: 'VIP' },
  { value: 'none', label: 'None' },
];

/** Form khớp Swagger POST /api/table: tableName, tableType, numberOfPeople */
const emptyForm = () => ({
  name: '',
  tableType: '',
  maxGuests: 4,
});

const isBusy = isTableRowInUse;

const tableTypeLabel = (table) => {
  const v = String(table?.tableType || '').toLowerCase();
  const opt = TABLE_TYPES.find((o) => o.value === v);
  if (opt) return opt.label;
  const raw = table?.tableType;
  return raw != null && String(raw).trim() !== '' ? String(raw) : '—';
};

const AdminTableMap = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('in-use');
  /** GET /api/table?tableType=… (Swagger) — không còn lọc theo area ở client */
  const [regionTableType, setRegionTableType] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalMode, setModalMode] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const perPage = 7;

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    const baseParams =
      regionTableType === 'all' ? {} : { tableType: regionTableType };

    const applyInUseFilter = (list) =>
      (Array.isArray(list) ? list : []).filter(isBusy);

    try {
      const list = await getTables(baseParams);
      const rows = Array.isArray(list) ? list : [];
      if (activeTab === 'in-use') {
        setTables(applyInUseFilter(rows));
      } else {
        setTables(rows);
      }
    } catch (e) {
      setError(parseTableApiError(e, 'Không tải được danh sách bàn.'));
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [regionTableType, activeTab]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, regionTableType, typeFilter, activeTab]);

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        String(t.tableCode || '')
          .toLowerCase()
          .includes(q);

      let matchType = true;
      if (typeFilter === 'vip') matchType = t.tableType === 'vip' || t.isVip;
      else if (typeFilter === 'normal') matchType = t.tableType !== 'vip' && !t.isVip;

      return matchSearch && matchType;
    });
  }, [tables, searchQuery, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTables.length / perPage));

  const pageTables = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredTables.slice(start, start + perPage);
  }, [filteredTables, currentPage, perPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const formatMoney = (n) => {
    const v = Number(n) || 0;
    if (v >= 1000000)
      return `${(v / 1000000).toFixed(0)},${String(v % 1000000).padStart(6, '0').slice(0, 3)}`;
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const openAddModal = () => {
    setModalMode('add');
    setForm({
      ...emptyForm(),
      name: tables.length ? `Bàn ${tables.length + 1}` : 'Bàn 1',
    });
    setEditingTable(null);
  };

  const openEditModal = (table) => {
    setModalMode('edit');
    setEditingTable(table);
    setForm({
      name: table.name,
      tableType: String(table.tableType ?? '').trim(),
      maxGuests: table.maxGuests ?? table.capacity ?? 4,
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingTable(null);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const n = Number.parseInt(form.maxGuests, 10);
      const payload = {
        ...form,
        maxGuests: Number.isFinite(n) && n >= 1 ? Math.min(99, n) : 4,
      };
      if (modalMode === 'add') {
        const nameNorm = String(form.name || '').trim().toLowerCase();
        if (
          nameNorm &&
          tables.some((t) => String(t.name || '').trim().toLowerCase() === nameNorm)
        ) {
          alert('Tên bàn đã tồn tại. Vui lòng chọn tên khác.');
          return;
        }
        await createTable(payload);
      } else if (editingTable) {
        await updateTable(editingTable.id, payload);
      }
      await loadTables();
      closeModal();
    } catch (err) {
      alert(parseTableApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (table) => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${table.name}?`)) return;
    try {
      await deleteTable(table.id);
      await loadTables();
    } catch (err) {
      alert(parseTableApiError(err));
    }
  };

  const displayNameShort = (name) => String(name || '').replace(/^Bàn\s*/i, '');

  return (
    <div className="admin-tablemap">
      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            color: '#991b1b',
            background: '#fee2e2',
            borderRadius: '0.5rem',
          }}
        >
          {error}
        </div>
      )}

      <header className="tablemap-header">
        <div>
          <h1 className="tablemap-title">Sơ đồ bàn</h1>
          <p className="tablemap-subtitle">Quản lý vị trí và tình trạng bàn (API /table)</p>
        </div>
        <div className="tablemap-actions">
          <button
            type="button"
            className="tablemap-select"
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            onClick={() => loadTables()}
            disabled={loading}
            title="Tải lại"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Làm mới
          </button>
          <div className="tablemap-search-wrap">
            <Search size={18} className="tablemap-search-icon" />
            <input
              type="text"
              className="tablemap-search"
              placeholder="Tìm kiếm theo số bàn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="tablemap-select"
            value={regionTableType}
            onChange={(e) => setRegionTableType(e.target.value)}
          >
            <option value="all">Tất cả các khu vực</option>
            {TABLE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select className="tablemap-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">Tất cả loại bàn</option>
            <option value="normal">Bàn thường</option>
            <option value="vip">Bàn VIP</option>
          </select>
          <button type="button" className="tablemap-add-btn" onClick={openAddModal}>
            <Plus size={18} />
            Thêm bàn mới
          </button>
        </div>
      </header>

      <div className="tablemap-tabs">
        <button
          type="button"
          className={`tablemap-tab ${activeTab === 'in-use' ? 'active' : ''}`}
          onClick={() => setActiveTab('in-use')}
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

      {loading && !tables.length ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Đang tải danh sách bàn…</p>
      ) : activeTab === 'in-use' ? (
        <div className="tablemap-cards">
          {filteredTables.length === 0 ? (
            <p style={{ padding: '2rem', color: '#6b7280' }}>Không có bàn đang sử dụng trong bộ lọc hiện tại.</p>
          ) : (
            filteredTables.map((t) => (
              <div
                key={t.id}
                className={`tablemap-card ${isBusy(t) ? 'in-use' : 'empty'}`}
              >
                <div className="tablemap-card-header">
                  <span className="tablemap-card-number">
                    {displayNameShort(t.name)}
                    {t.isVip && ' (VIP)'}
                  </span>
                  <span className={`tablemap-card-badge ${isBusy(t) ? 'in-use' : 'empty'}`}>
                    {isBusy(t) ? 'ĐANG DÙNG' : 'TRỐNG'}
                  </span>
                </div>
                <div className="tablemap-card-body">
                  <div className="tablemap-card-capacity">
                    <Users size={16} />
                    {isBusy(t)
                      ? `${t.currentGuests}/${t.maxGuests} người`
                      : `Tối đa ${t.maxGuests} người`}
                  </div>
                  <div className="tablemap-card-amount">{formatMoney(t.amount)}₫</div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="tablemap-table-card">
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
                {pageTables.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      Không có bàn phù hợp.
                    </td>
                  </tr>
                ) : (
                  pageTables.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">
                        {t.name}
                        {t.isVip ? ' (VIP)' : ''}
                      </td>
                      <td>{tableTypeLabel(t)}</td>
                      <td>
                        {t.currentGuests} / {t.maxGuests} người
                      </td>
                      <td>
                        <span className={`tablemap-status-pill ${isBusy(t) ? 'in-use' : 'empty'}`}>
                          {isBusy(t) ? 'ĐANG DÙNG' : 'TRỐNG'}
                        </span>
                      </td>
                      <td>
                        <div className="tablemap-actions-cell">
                          <button
                            type="button"
                            className="tablemap-icon-btn"
                            aria-label="Sửa"
                            onClick={() => openEditModal(t)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="tablemap-icon-btn"
                            aria-label="Xóa"
                            onClick={() => handleDeleteTable(t)}
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
          <div className="tablemap-pagination">
            <span className="tablemap-pagination-info">
              {filteredTables.length === 0
                ? '0 bàn'
                : `Hiển thị ${(currentPage - 1) * perPage + 1}-${Math.min(
                    currentPage * perPage,
                    filteredTables.length
                  )} / ${filteredTables.length} bàn`}
            </span>
            <div className="tablemap-pagination-btns">
              <button
                type="button"
                className="tablemap-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`tablemap-page-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="tablemap-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="tablemap-modal-overlay" onClick={closeModal}>
          <div className="tablemap-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tablemap-modal-title">
              {modalMode === 'add' ? 'Thêm bàn mới' : 'Chỉnh sửa thông tin bàn'}
            </h2>
            <form onSubmit={handleSaveTable} className="tablemap-modal-form">
              <div className="tablemap-form-group">
                <label>Tên bàn (tableName)</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Bàn 01"
                  required
                />
              </div>
              <div className="tablemap-form-group">
                <label>Loại bàn (tableType)</label>
                <input
                  type="text"
                  value={form.tableType}
                  onChange={(e) => setForm((f) => ({ ...f, tableType: e.target.value }))}
                  placeholder="VD: vip, indoor, outdoor — tự nhập theo API"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="tablemap-form-group">
                <label>Số người tối đa (numberOfPeople)</label>
                <div className="tablemap-input-with-icon">
                  <Users size={18} className="tablemap-input-icon" />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={form.maxGuests}
                    onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  />
                </div>
              </div>
              <div className="tablemap-modal-actions">
                <button type="button" className="tablemap-modal-btn tablemap-modal-cancel" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="tablemap-modal-btn tablemap-modal-save" disabled={saving}>
                  {saving ? 'Đang lưu…' : modalMode === 'add' ? 'Thêm bàn' : 'Lưu thay đổi'}
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
