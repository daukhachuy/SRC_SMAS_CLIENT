import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import '../../../styles/AdminMenuManagement.css';

const MOCK_BUFFETS = [
  { id: 1, name: 'Buffet Nướng Cao Cấp', description: 'Gồm 50 món nướng, hải sản tươi sống và tráng miệng.', priceMain: '399,000₫', priceChild: '199,000₫', priceExtra: '49,000₫', image: 'https://picsum.photos/seed/buffet1/80/80', status: true },
  { id: 2, name: 'Buffet Lẩu Hải Sản', description: 'Đặc sản biển tươi sống kèm 12 loại nước dùng.', priceMain: '299,000₫', priceChild: '149,000₫', priceExtra: '39,000₫', image: 'https://picsum.photos/seed/buffet2/80/80', status: true },
  { id: 3, name: 'Buffet Chay Thanh Đạm', description: 'Các món chay từ rau củ quả hữu cơ.', priceMain: '199,000₫', priceChild: '99,000₫', priceExtra: '29,000₫', image: 'https://picsum.photos/seed/buffet3/80/80', status: false }
];

const AdminMenuBuffet = () => {
  const [buffets, setBuffets] = useState(MOCK_BUFFETS);
  const [search, setSearch] = useState('');

  const filtered = buffets.filter(
    (b) => !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <button type="button" className="menu-btn-primary">
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
            <span className="menu-cell-price">{row.priceMain}</span>
            <span className="menu-cell-price">{row.priceChild}</span>
            <span className="menu-cell-price">{row.priceExtra}</span>
            <div>
              <button type="button" className={`menu-toggle ${row.status ? 'active' : ''}`} aria-label="Toggle">
                <span className="menu-toggle-thumb" />
              </button>
            </div>
            <div className="menu-actions-cell">
              <button type="button" className="menu-icon-btn" aria-label="Sửa"><Pencil size={16} /></button>
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
    </div>
  );
};

export default AdminMenuBuffet;
