import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import '../../../styles/AdminMenuManagement.css';

const CATEGORY_FILTERS = ['Khai vị', 'Món chính', 'Đồ uống', 'Tráng miệng'];

const MOCK_DISHES = [
  { id: 1, name: 'Salad Cá Hồi Sốt Mè', category: 'Khai vị', price: '125,000₫', image: 'https://picsum.photos/seed/salad/80/80', status: true },
  { id: 2, name: 'Bít Tết Bò Mỹ Ribeye', category: 'Món chính', price: '450,000₫', image: 'https://picsum.photos/seed/steak/80/80', status: true },
  { id: 3, name: 'Phở Bò Kobe Đặc Biệt', category: 'Món chính', price: '280,000₫', image: 'https://picsum.photos/seed/pho/80/80', status: false },
  { id: 4, name: 'Cà Phê Muối Đặc Sản', category: 'Đồ uống', price: '55,000₫', image: 'https://picsum.photos/seed/coffee/80/80', status: true }
];

const AdminMenuFood = () => {
  const [dishes, setDishes] = useState(MOCK_DISHES);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = dishes.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="menu-management-section">
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
          {CATEGORY_FILTERS.map((cat) => (
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
        <button type="button" className="menu-btn-primary">
          <Plus size={18} />
          Thêm món mới
        </button>
      </div>

      <div className="menu-table-card">
        <table className="menu-table">
          <thead>
            <tr>
              <th>HÌNH ẢNH</th>
              <th>TÊN MÓN</th>
              <th>DANH MỤC</th>
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
                <td className="menu-cell-name">{row.name}</td>
                <td><span className="menu-category-tag">{row.category}</span></td>
                <td className="menu-cell-price">{row.price}</td>
                <td>
                  <button
                    type="button"
                    className={`menu-toggle ${row.status ? 'active' : ''}`}
                    aria-label="Toggle"
                  >
                    <span className="menu-toggle-thumb" />
                  </button>
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
          <span>Hiển thị 1-{filtered.length} trên {dishes.length} món ăn</span>
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

export default AdminMenuFood;
