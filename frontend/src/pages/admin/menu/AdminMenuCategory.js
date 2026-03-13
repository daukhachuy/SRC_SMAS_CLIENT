import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import '../../../styles/AdminMenuManagement.css';

const MOCK_CATEGORIES = [
  { id: 1, name: 'Khai vị', description: 'Các món ăn nhẹ trước bữa chính', image: 'https://picsum.photos/seed/appetizer/80/80', status: 'active' },
  { id: 2, name: 'Món chính', description: 'Thực đơn chính bao gồm thịt, cá, hải sản', image: 'https://picsum.photos/seed/maincourse/80/80', status: 'active' },
  { id: 3, name: 'Đồ uống', description: 'Cà phê, trà, nước ép và đồ uống có cồn', image: 'https://picsum.photos/seed/drinks/80/80', status: 'inactive' },
  { id: 4, name: 'Tráng miệng', description: 'Bánh ngọt, trái cây và các loại kem', image: 'https://picsum.photos/seed/dessert/80/80', status: 'active' }
];

const AdminMenuCategory = () => {
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [search, setSearch] = useState('');

  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="menu-management-section">
      <div className="menu-section-toolbar">
        <div className="menu-search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="menu-search-input"
          />
        </div>
        <button type="button" className="menu-btn-primary">
          <Plus size={18} />
          Thêm danh mục mới
        </button>
      </div>

      <div className="menu-table-card">
        <table className="menu-table">
          <thead>
            <tr>
              <th>HÌNH ẢNH</th>
              <th>TÊN DANH MỤC</th>
              <th>MÔ TẢ</th>
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
                <td className="menu-cell-name">{row.name}</td>
                <td className="menu-cell-desc">{row.description}</td>
                <td>
                  <span className={`menu-status-pill ${row.status === 'active' ? 'active' : 'inactive'}`}>
                    {row.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="menu-actions-cell">
                    <button type="button" className="menu-icon-btn" aria-label="Sửa"><Pencil size={16} /></button>
                    <button type="button" className="menu-icon-btn menu-icon-btn-danger" aria-label="Xóa"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="menu-pagination">
          <span>Hiển thị 1-{filtered.length} trên {categories.length} danh mục</span>
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

export default AdminMenuCategory;
