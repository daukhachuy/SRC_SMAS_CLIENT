import React, { useState } from 'react';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import '../../styles/AdminTableMap.css';

const TABLE_TYPES = [
  { value: 'indoor', label: 'Trong nhà' },
  { value: 'outdoor', label: 'Sân vườn' },
  { value: 'vip', label: 'VIP' },
  { value: 'none', label: 'None' },
];

const initialTables = [
  { id: 1, name: 'Bàn 01', area: 'Tầng 1', tableType: 'indoor', maxGuests: 6, currentGuests: 4, status: 'in-use', amount: 1250000, isVip: false, note: '' },
  { id: 2, name: 'Bàn 02', area: 'Tầng 1', tableType: 'indoor', maxGuests: 4, currentGuests: 0, status: 'empty', amount: 0, isVip: false, note: '' },
  { id: 3, name: 'Bàn 03', area: 'Tầng 1', tableType: 'vip', maxGuests: 10, currentGuests: 8, status: 'in-use', amount: 4800000, isVip: true, note: '' },
  { id: 4, name: 'Bàn 04', area: 'Tầng 2', tableType: 'indoor', maxGuests: 2, currentGuests: 0, status: 'empty', amount: 0, isVip: false, note: '' },
  { id: 5, name: 'Bàn 05', area: 'Tầng 1', tableType: 'none', maxGuests: 4, currentGuests: 0, status: 'empty', amount: 0, isVip: false, note: '' },
  { id: 6, name: 'Bàn 06', area: 'Sân vườn', tableType: 'outdoor', maxGuests: 4, currentGuests: 0, status: 'empty', amount: 0, isVip: false, note: '' },
  { id: 7, name: 'Bàn 07', area: 'Tầng 2', tableType: 'indoor', maxGuests: 6, currentGuests: 0, status: 'empty', amount: 0, isVip: false, note: '' },
];

const AdminTableMap = () => {
  const [tables, setTables] = useState(initialTables);
  const [activeTab, setActiveTab] = useState('in-use');
  const [floorFilter, setFloorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
  const [editingTable, setEditingTable] = useState(null);
  const [form, setForm] = useState({ name: '', tableType: 'indoor', maxGuests: 4, note: '' });
  const totalTables = 50;
  const perPage = 7;

  const formatMoney = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(0)},${String(n % 1000000).padStart(6, '0').slice(0, 3)}`;
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const openAddModal = () => {
    setModalMode('add');
    setForm({ name: `Bàn ${tables.length + 1}`, tableType: 'indoor', maxGuests: 4, note: '' });
    setEditingTable(null);
  };

  const openEditModal = (table) => {
    setModalMode('edit');
    setEditingTable(table);
    setForm({
      name: table.name,
      tableType: table.tableType || 'indoor',
      maxGuests: table.maxGuests,
      note: table.note || '',
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingTable(null);
  };

  const handleSaveTable = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newTable = {
        id: Math.max(...tables.map((t) => t.id), 0) + 1,
        name: form.name,
        area: form.tableType === 'outdoor' ? 'Sân vườn' : form.tableType === 'vip' ? 'Tầng 1' : 'Tầng 1',
        tableType: form.tableType,
        maxGuests: Number(form.maxGuests) || 4,
        currentGuests: 0,
        status: 'empty',
        amount: 0,
        isVip: form.tableType === 'vip',
        note: form.note,
      };
      setTables((prev) => [...prev, newTable]);
    } else if (editingTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === editingTable.id
            ? {
                ...t,
                name: form.name,
                tableType: form.tableType,
                maxGuests: Number(form.maxGuests) || t.maxGuests,
                isVip: form.tableType === 'vip',
                note: form.note,
              }
            : t
        )
      );
    }
    closeModal();
  };

  const handleDeleteTable = (table) => {
    if (window.confirm(`Bạn có chắc muốn xóa ${table.name}?`)) {
      setTables((prev) => prev.filter((t) => t.id !== table.id));
    }
  };

  return (
    <div className="admin-tablemap">
      <header className="tablemap-header">
        <div>
          <h1 className="tablemap-title">Sơ đồ bàn</h1>
          <p className="tablemap-subtitle">Quản lý vị trí và tình trạng bàn thời gian thực</p>
        </div>
        <div className="tablemap-actions">
          <select className="tablemap-select" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
            <option value="all">Tất cả các khu vực</option>
            <option value="1">Tầng 1</option>
            <option value="2">Tầng 2</option>
            <option value="garden">Sân vườn</option>
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

      {activeTab === 'in-use' ? (
        <div className="tablemap-cards">
          {tables.map((t) => (
            <div
              key={t.id}
              className={`tablemap-card ${t.status === 'in-use' ? 'in-use' : 'empty'}`}
            >
              <div className="tablemap-card-header">
                <span className="tablemap-card-number">
                  {t.name.replace('Bàn ', '')}
                  {t.isVip && ' (VIP)'}
                </span>
                <span className={`tablemap-card-badge ${t.status}`}>
                  {t.status === 'in-use' ? 'ĐANG DÙNG' : 'TRỐNG'}
                </span>
              </div>
              <div className="tablemap-card-body">
                <div className="tablemap-card-capacity">
                  <Users size={16} />
                  {t.status === 'in-use'
                    ? `${t.currentGuests}/${t.maxGuests} người`
                    : `Tối đa ${t.maxGuests} người`}
                </div>
                <div className="tablemap-card-amount">
                  {formatMoney(t.amount)}₫
                </div>
              </div>
            </div>
          ))}
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
                {tables.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}{t.isVip ? ' (VIP)' : ''}</td>
                    <td>{t.area}</td>
                    <td>{t.currentGuests} / {t.maxGuests} người</td>
                    <td>
                      <span className={`tablemap-status-pill ${t.status}`}>
                        {t.status === 'in-use' ? 'ĐANG DÙNG' : 'TRỐNG'}
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
                ))}
              </tbody>
            </table>
          </div>
          <div className="tablemap-pagination">
            <span className="tablemap-pagination-info">
              Hiển thị 1-{tables.length} của {totalTables} bàn
            </span>
            <div className="tablemap-pagination-btns">
              <button type="button" className="tablemap-page-btn">Trước</button>
              <button type="button" className="tablemap-page-btn active">1</button>
              <button type="button" className="tablemap-page-btn">2</button>
              <button type="button" className="tablemap-page-btn">3</button>
              <button type="button" className="tablemap-page-btn">Sau</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa / Thêm bàn mới */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="tablemap-modal-overlay" onClick={closeModal}>
          <div className="tablemap-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tablemap-modal-title">
              {modalMode === 'add' ? 'Thêm bàn mới' : 'Chỉnh sửa thông tin bàn'}
            </h2>
            <form onSubmit={handleSaveTable} className="tablemap-modal-form">
              <div className="tablemap-form-group">
                <label>Tên bàn</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Bàn 01"
                  required
                />
              </div>
              <div className="tablemap-form-group">
                <label>Loại bàn</label>
                <select
                  value={form.tableType}
                  onChange={(e) => setForm((f) => ({ ...f, tableType: e.target.value }))}
                >
                  {TABLE_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="tablemap-form-group">
                <label>Số lượng khách tối đa</label>
                <div className="tablemap-input-with-icon">
                  <Users size={18} className="tablemap-input-icon" />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.maxGuests}
                    onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  />
                </div>
              </div>
              <div className="tablemap-form-group">
                <label>Ghi chú bàn</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Nhập ghi chú cho bàn này..."
                  rows={3}
                />
              </div>
              <div className="tablemap-modal-actions">
                <button type="button" className="tablemap-modal-btn tablemap-modal-cancel" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="tablemap-modal-btn tablemap-modal-save">
                  {modalMode === 'add' ? 'Thêm bàn' : 'Lưu thay đổi'}
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
