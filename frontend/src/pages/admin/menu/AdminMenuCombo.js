import React, { useState } from 'react';
import { Plus, Search, Pencil } from 'lucide-react';
import '../../../styles/AdminMenuManagement.css';

const STATUS_FILTERS = ['Tất cả trạng thái', 'Đang bán', 'Ngừng bán'];

const MOCK_COMBOS = [
  { id: 1, code: 'CB-001', name: 'Combo Tiết Kiệm S1', description: 'Bao gồm 2 món chính, 1 khoai tây chiên và 1 nước ngọt size vừa.', price: '150.000₫', image: 'https://picsum.photos/seed/combo1/80/80', status: true },
  { id: 2, code: 'CB-002', name: 'Combo Gia Đình Happy', description: 'Phù hợp cho nhóm 4-5 người, bao gồm set gà, burger và tráng miệng.', price: '450.000₫', image: 'https://picsum.photos/seed/combo2/80/80', status: true },
  { id: 3, code: 'CB-003', name: 'Combo Lunch Special', description: 'Bữa trưa dinh dưỡng cho nhân viên văn phòng, phục vụ 11h-14h hàng ngày.', price: '85.000₫', image: 'https://picsum.photos/seed/combo3/80/80', status: false }
];

const AdminMenuCombo = () => {
  const [combos, setCombos] = useState(MOCK_COMBOS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');

  const filtered = combos.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'Tất cả trạng thái' ||
      (statusFilter === 'Đang bán' && c.status) ||
      (statusFilter === 'Ngừng bán' && !c.status);
    return matchSearch && matchStatus;
  });

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
        <button type="button" className="menu-btn-primary">
          <Plus size={18} />
          Thêm Combo mới
        </button>
      </div>

      <div className="menu-table-card">
        <table className="menu-table">
          <thead>
            <tr>
              <th>HÌNH ẢNH</th>
              <th>TÊN COMBO</th>
              <th>MÔ TẢ</th>
              <th>GIÁ BÁN</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="menu-table-img">
                    {row.image ? <img src={row.image} alt={row.name} /> : <span>—</span>}
                  </div>
                </td>
                <td className="menu-cell-name">
                  <div>{row.name}</div>
                  <div className="menu-cell-code">Mã: {row.code}</div>
                </td>
                <td className="menu-cell-desc">{row.description}</td>
                <td className="menu-cell-price">{row.price}</td>
                <td>
                  <button type="button" className={`menu-toggle ${row.status ? 'active' : ''}`} aria-label="Toggle">
                    <span className="menu-toggle-thumb" />
                  </button>
                </td>
                <td>
                  <div className="menu-actions-cell">
                    <button type="button" className="menu-icon-btn" aria-label="Sửa"><Pencil size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="menu-pagination">
          <span>Hiển thị 1-{filtered.length} trong tổng số {combos.length} combos</span>
          <div className="menu-pagination-btns">
            <button type="button" className="menu-page-btn" disabled>‹</button>
            <button type="button" className="menu-page-btn active">1</button>
            <button type="button" className="menu-page-btn">›</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMenuCombo;
