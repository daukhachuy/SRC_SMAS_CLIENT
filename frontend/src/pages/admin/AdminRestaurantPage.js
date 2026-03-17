import React, { useState } from 'react';
import { Search, Plus, Pencil, X, Eye, Bell } from 'lucide-react';
import '../../styles/AdminRestaurant.css';

const MOCK_CODES = [
  { id: 1, code: 'LUNCH20', type: 'Phần trăm (%)', value: '20% Giảm giá', start: '01/10/2023', end: '31/12/2023', status: 'running' },
  { id: 2, code: 'FREESHIP', type: 'Vận chuyển', value: 'Miễn phí vận chuyển', start: '15/09/2023', end: '15/10/2023', status: 'upcoming' },
  { id: 3, code: 'WINTER50', type: 'Cố định (VNĐ)', value: '50k VND Giảm', start: '01/08/2023', end: '31/08/2023', status: 'expired' },
];

const MOCK_BLOG = [
  { id: 1, title: '5 Món ngon mùa hè bạn nhất định phải thử', author: 'Admin_Chef', date: '12/10/2023', views: 1245, on: true },
  { id: 2, title: 'Quy trình chọn lọc thực phẩm sạch tại nhà hàng', author: 'QualityControl', date: '08/10/2023', views: 892, on: false },
];

const MOCK_REVIEWS = [
  { id: 1, name: 'Lê Thủy', initials: 'LT', time: '2 giờ trước', stars: 5, comment: 'Đồ ăn rất ngon, phục vụ tận tình chu đáo. Đặc biệt món sườn nướng rất mềm và thấm vị. Sẽ quay lại!' },
  { id: 2, name: 'Hoàng Minh', initials: 'HM', time: 'Hôm qua', stars: 5, comment: 'Không gian đẹp nhưng đợi món hơi lâu vào cuối tuần. Hy vọng quán sẽ cải thiện tốc độ ra món.' },
];

const AdminRestaurantPage = () => {
  const [tab, setTab] = useState('codes');
  const [codeSearch, setCodeSearch] = useState('');
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [codes, setCodes] = useState(MOCK_CODES);
  const [posts, setPosts] = useState(MOCK_BLOG);
  const [codeForm, setCodeForm] = useState({
    code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '',
    startDate: '', endDate: '', quantity: '',
  });
  const [blogForm, setBlogForm] = useState({
    title: '', content: '', expireDate: '', category: '',
  });

  const handleSubmitCode = (e) => {
    e.preventDefault();
    const typeLabel = codeForm.type === 'percent' ? 'Phần trăm (%)' : codeForm.type === 'ship' ? 'Vận chuyển' : 'Cố định (VNĐ)';

    if (editingCode) {
      setCodes((prev) => prev.map((c) => (c.id === editingCode.id ? {
        ...c,
        code: codeForm.code,
        type: typeLabel,
        value: codeForm.value,
        start: codeForm.startDate,
        end: codeForm.endDate,
      } : c)));
      setEditingCode(null);
    } else {
      setCodes((prev) => [...prev, {
        id: prev.length + 1,
        code: codeForm.code,
        type: typeLabel,
        value: codeForm.value,
        start: codeForm.startDate,
        end: codeForm.endDate,
        status: 'running',
      }]);
    }
    setCodeForm({ code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '', startDate: '', endDate: '', quantity: '' });
    setCodeModalOpen(false);
  };

  const handleSubmitBlog = (e) => {
    e.preventDefault();
    if (editingBlog) {
      setPosts((prev) => prev.map((p) => (p.id === editingBlog.id ? {
        ...p,
        title: blogForm.title,
        content: blogForm.content,
        expireDate: blogForm.expireDate,
        category: blogForm.category,
      } : p)));
      setEditingBlog(null);
    } else {
      setPosts((prev) => [...prev, {
        id: prev.length + 1,
        title: blogForm.title,
        author: 'Admin',
        date: new Date().toLocaleDateString('vi-VN'),
        views: 0,
        on: true,
      }]);
    }
    setBlogForm({ title: '', content: '', expireDate: '', category: '' });
    setBlogModalOpen(false);
  };

  const openEditCode = (code) => {
    const typeValue = code.type === 'Phần trăm (%)' ? 'percent' : code.type === 'Vận chuyển' ? 'ship' : 'fixed';
    setCodeForm({
      code: code.code,
      type: typeValue,
      description: '',
      value: code.value.replace(/\D/g, ''),
      minOrder: '',
      maxDiscount: '',
      startDate: code.start,
      endDate: code.end,
      quantity: '',
    });
    setEditingCode(code);
    setCodeModalOpen(true);
  };

  const openEditBlog = (blog) => {
    setBlogForm({
      title: blog.title,
      content: blog.content || '',
      expireDate: blog.expireDate || '',
      category: blog.category || '',
    });
    setEditingBlog(blog);
    setBlogModalOpen(true);
  };

  const closeCodeModal = () => {
    setCodeModalOpen(false);
    setEditingCode(null);
    setCodeForm({ code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '', startDate: '', endDate: '', quantity: '' });
  };

  const closeBlogModal = () => {
    setBlogModalOpen(false);
    setEditingBlog(null);
    setBlogForm({ title: '', content: '', expireDate: '', category: '' });
  };

  const togglePostStatus = (id) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, on: !p.on } : p)));
  };

  const statusLabel = (s) => ({ running: 'ĐANG CHẠY', upcoming: 'SẮP TỚI', expired: 'HẾT HẠN' }[s] || s);

  return (
    <div className="admin-restaurant">
      <header className="rest-header">
        <div>
          <h1 className="rest-title">Quản lý Nhà hàng</h1>
          <p className="rest-subtitle">Xem và cập nhật thông tin vận hành của bạn</p>
        </div>
        <button type="button" className="rest-bell-btn" aria-label="Thông báo">
          <Bell size={20} />
        </button>
      </header>

      <div className="rest-tabs">
        <button type="button" className={`rest-tab ${tab === 'codes' ? 'active' : ''}`} onClick={() => setTab('codes')}>
          Mã giảm giá
        </button>
        <button type="button" className={`rest-tab ${tab === 'blog' ? 'active' : ''}`} onClick={() => setTab('blog')}>
          Blog
        </button>
        <button type="button" className={`rest-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          Đánh giá
        </button>
      </div>

      {tab === 'codes' && (
        <>
          <div className="rest-toolbar">
            <div className="rest-search-wrap">
              <Search size={18} className="rest-search-icon" />
              <input
                type="text"
                className="rest-search"
                placeholder="Tìm theo mã code..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
              />
            </div>
            <button type="button" className="rest-btn-primary" onClick={() => { setEditingCode(null); setCodeForm({ code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '', startDate: '', endDate: '', quantity: '' }); setCodeModalOpen(true); }}>
              <Plus size={18} />
              Thêm mã mới
            </button>
          </div>
          <div className="rest-card">
            <div className="rest-table-wrap">
              <table className="rest-table">
                <thead>
                  <tr>
                    <th>MÃ CODE</th>
                    <th>LOẠI GIẢM GIÁ</th>
                    <th>GIÁ TRỊ</th>
                    <th>BẮT ĐẦU</th>
                    <th>KẾT THÚC</th>
                    <th>TRẠNG THÁI</th>
                    <th>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((row) => (
                    <tr key={row.id}>
                      <td className="rest-code">{row.code}</td>
                      <td>{row.type}</td>
                      <td>{row.value}</td>
                      <td>{row.start}</td>
                      <td>{row.end}</td>
                      <td>
                        <span className={`rest-badge rest-badge-${row.status}`}>{statusLabel(row.status)}</span>
                      </td>
                      <td>
                        <button type="button" className="rest-icon-btn" aria-label="Sửa" onClick={() => openEditCode(row)}><Pencil size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rest-pagination">
              <span>Hiển thị 1-{codes.length} trong 15 mã</span>
              <div className="rest-pagination-btns">
                <button type="button" className="rest-page-btn">&lt;</button>
                <button type="button" className="rest-page-btn active">1</button>
                <button type="button" className="rest-page-btn">2</button>
                <button type="button" className="rest-page-btn">3</button>
                <button type="button" className="rest-page-btn">&gt;</button>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'blog' && (
        <>
          <div className="rest-toolbar rest-toolbar-end">
            <button type="button" className="rest-btn-primary" onClick={() => { setEditingBlog(null); setBlogForm({ title: '', content: '', expireDate: '', category: '' }); setBlogModalOpen(true); }}>
              <Pencil size={18} />
              Tạo bài mới
            </button>
          </div>
          <div className="rest-card">
            <div className="rest-table-wrap">
              <table className="rest-table">
                <thead>
                  <tr>
                    <th>TIÊU ĐỀ BÀI VIẾT</th>
                    <th>TÁC GIẢ</th>
                    <th>NGÀY ĐĂNG</th>
                    <th>LƯỢT XEM</th>
                    <th>TRẠNG THÁI (BẬT/TẮT)</th>
                    <th>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((row) => (
                    <tr key={row.id}>
                      <td className="rest-title-cell">{row.title}</td>
                      <td>{row.author}</td>
                      <td>{row.date}</td>
                      <td>{row.views.toLocaleString()}</td>
                      <td>
                        <button type="button" className={`rest-toggle ${row.on ? 'active' : ''}`} onClick={() => togglePostStatus(row.id)} aria-label={row.on ? 'Tắt' : 'Bật'}>
                          <span className="rest-toggle-slider" />
                        </button>
                        <span className="rest-status-text">{row.on ? 'Bật' : 'Tắt'}</span>
                      </td>
                      <td>
                        <button type="button" className="rest-icon-btn" aria-label="Xem"><Eye size={16} /></button>
                        <button type="button" className="rest-icon-btn" aria-label="Sửa" onClick={() => openEditBlog(row)}><Pencil size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rest-pagination">
              <span>Hiển thị 1-{posts.length} trong 10 bài viết</span>
              <div className="rest-pagination-btns">
                <button type="button" className="rest-page-btn">&lt;</button>
                <button type="button" className="rest-page-btn active">1</button>
                <button type="button" className="rest-page-btn">2</button>
                <button type="button" className="rest-page-btn">&gt;</button>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'reviews' && (
        <div className="rest-reviews-layout">
          <div className="rest-reviews-left">
            <div className="rest-rating-card">
              <h3 className="rest-rating-title">Tổng quan đánh giá</h3>
              <div className="rest-rating-score">4.8</div>
              <div className="rest-rating-stars">★★★★½</div>
              <p className="rest-rating-count">1,240 đánh giá</p>
              <div className="rest-rating-bars">
                <div className="rest-bar-row"><span>5 sao</span><div className="rest-bar-bg"><div className="rest-bar-fill rest-bar-5" style={{ width: '85%' }} /></div><span>85%</span></div>
                <div className="rest-bar-row"><span>4 sao</span><div className="rest-bar-bg"><div className="rest-bar-fill rest-bar-4" style={{ width: '10%' }} /></div><span>10%</span></div>
                <div className="rest-bar-row"><span>3 sao</span><div className="rest-bar-bg"><div className="rest-bar-fill rest-bar-3" style={{ width: '3%' }} /></div><span>3%</span></div>
                <div className="rest-bar-row"><span>2 sao</span><div className="rest-bar-bg"><div className="rest-bar-fill rest-bar-2" style={{ width: '2%' }} /></div><span>2%</span></div>
                <div className="rest-bar-row"><span>1 sao</span><div className="rest-bar-bg"><div className="rest-bar-fill rest-bar-1" style={{ width: '1%' }} /></div><span>1%</span></div>
              </div>
            </div>
            <div className="rest-sentiment-card">
              <h3 className="rest-sentiment-title">Sắc thái phản hồi</h3>
              <div className="rest-sentiment-row">
                <div className="rest-sentiment-positive">95% TÍCH CỰC</div>
                <div className="rest-sentiment-negative">5% TIÊU CỰC</div>
              </div>
            </div>
          </div>
          <div className="rest-reviews-right">
            <div className="rest-reviews-head">
              <h3 className="rest-reviews-title">Đánh giá gần đây</h3>
              <select className="rest-select rest-select-sm">
                <option>Mới nhất</option>
              </select>
            </div>
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="rest-review-card">
                <div className="rest-review-header">
                  <div className="rest-review-avatar">{r.initials}</div>
                  <div>
                    <strong>{r.name}</strong>
                    <span className="rest-review-time">{r.time}</span>
                  </div>
                </div>
                <div className="rest-review-stars">{'★'.repeat(r.stars)}</div>
                <p className="rest-review-comment">{r.comment}</p>
              </div>
            ))}
            <a href="#all" className="rest-view-all">Xem thêm tất cả đánh giá</a>
          </div>
        </div>
      )}

      {codeModalOpen && (
        <div className="rest-modal-overlay" onClick={closeCodeModal}>
          <div className="rest-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rest-modal-head">
              <h2 className="rest-modal-title">{editingCode ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</h2>
              <button type="button" className="rest-modal-close" onClick={closeCodeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitCode} className="rest-modal-form">
              <div className="rest-form-group">
                <label>Mã Code <span className="rest-required">*</span></label>
                <input type="text" placeholder="VD: LUNCH2023" value={codeForm.code} onChange={(e) => setCodeForm((f) => ({ ...f, code: e.target.value }))} required />
              </div>
              <div className="rest-form-group">
                <label>Loại giảm giá <span className="rest-required">*</span></label>
                <select value={codeForm.type} onChange={(e) => setCodeForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="percent">Phần trăm %</option>
                  <option value="fixed">Cố định (VNĐ)</option>
                  <option value="ship">Vận chuyển</option>
                </select>
              </div>
              <div className="rest-form-group">
                <label>Miêu tả</label>
                <textarea placeholder="Nhập mô tả ngắn cho chương trình giảm giá..." value={codeForm.description} onChange={(e) => setCodeForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="rest-form-group">
                <label>Giá trị giảm <span className="rest-required">*</span></label>
                <div className="rest-form-suffix">
                  <input type="text" placeholder="VD: 20" value={codeForm.value} onChange={(e) => setCodeForm((f) => ({ ...f, value: e.target.value }))} />
                  <span className="rest-suffix">VND</span>
                </div>
              </div>
              <div className="rest-form-row2">
                <div className="rest-form-group">
                  <label>Đơn tối thiểu</label>
                  <div className="rest-form-suffix">
                    <input type="text" value={codeForm.minOrder} onChange={(e) => setCodeForm((f) => ({ ...f, minOrder: e.target.value }))} />
                    <span className="rest-suffix">VND</span>
                  </div>
                </div>
                <div className="rest-form-group">
                  <label>Giảm tối đa</label>
                  <div className="rest-form-suffix">
                    <input type="text" value={codeForm.maxDiscount} onChange={(e) => setCodeForm((f) => ({ ...f, maxDiscount: e.target.value }))} />
                    <span className="rest-suffix">VND</span>
                  </div>
                </div>
              </div>
              <div className="rest-form-row2">
                <div className="rest-form-group">
                  <label>Ngày bắt đầu <span className="rest-required">*</span></label>
                  <input type="text" placeholder="mm/dd/yyyy" value={codeForm.startDate} onChange={(e) => setCodeForm((f) => ({ ...f, startDate: e.target.value }))} required />
                </div>
                <div className="rest-form-group">
                  <label>Ngày kết thúc <span className="rest-required">*</span></label>
                  <input type="text" placeholder="mm/dd/yyyy" value={codeForm.endDate} onChange={(e) => setCodeForm((f) => ({ ...f, endDate: e.target.value }))} required />
                </div>
              </div>
              <div className="rest-form-group">
                <label>Số lượng mã</label>
                <input type="text" placeholder="Số lượng tối đa" value={codeForm.quantity} onChange={(e) => setCodeForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="rest-modal-actions">
                <button type="button" className="rest-modal-btn rest-modal-cancel" onClick={closeCodeModal}>Hủy</button>
                <button type="submit" className="rest-modal-btn rest-modal-submit">{editingCode ? 'Lưu thay đổi' : 'Tạo mã mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {blogModalOpen && (
        <div className="rest-modal-overlay" onClick={closeBlogModal}>
          <div className="rest-modal rest-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="rest-modal-head">
              <h2 className="rest-modal-title">{editingBlog ? 'Chỉnh sửa bài viết Blog' : 'Tạo bài viết Blog mới'}</h2>
              <button type="button" className="rest-modal-close" onClick={closeBlogModal}><X size={20} /></button>
            </div>
            <p className="rest-modal-desc">Điền các thông tin dưới đây để đăng tải bài viết lên hệ thống</p>
            <form onSubmit={handleSubmitBlog} className="rest-modal-form">
              <div className="rest-form-group">
                <label>Ảnh đại diện bài viết</label>
                <div className="rest-upload-zone">
                  <span>Nhấn để tải lên hoặc kéo và thả</span>
                  <small>PNG, JPG hoặc WebP (Tỉ lệ 16:9 - Tối đa 5MB)</small>
                </div>
              </div>
              <div className="rest-form-group">
                <label>Tiêu đề bài viết</label>
                <input type="text" placeholder="Nhập tiêu đề thu hút người xem..." value={blogForm.title} onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="rest-form-group">
                <label>Nội dung bài viết</label>
                <textarea placeholder="Chia sẻ câu chuyện hoặc công thức món ăn của bạn tại đây..." value={blogForm.content} onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))} rows={5} />
              </div>
              <div className="rest-form-group">
                <label>Ngày hết hạn đăng bài (Tùy chọn)</label>
                <input type="text" placeholder="mm/dd/yyyy" value={blogForm.expireDate} onChange={(e) => setBlogForm((f) => ({ ...f, expireDate: e.target.value }))} />
              </div>
              <div className="rest-form-group">
                <label>Danh mục</label>
                <select value={blogForm.category} onChange={(e) => setBlogForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="">Chọn danh mục</option>
                  <option value="food">Món ăn</option>
                  <option value="news">Tin tức</option>
                </select>
              </div>
              <div className="rest-modal-actions">
                <button type="button" className="rest-modal-btn rest-modal-cancel" onClick={closeBlogModal}>Hủy</button>
                <button type="submit" className="rest-modal-btn rest-modal-submit">{editingBlog ? 'Lưu thay đổi' : 'Đăng bài'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurantPage;
