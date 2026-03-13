import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ComboPage.css';
import { ShoppingCart, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { getComboLists } from '../api/foodApi';
import { isAuthenticated } from '../api/authApi';

const ComboPage = () => {
  const navigate = useNavigate();
  const FIXED_PRODUCT_IMAGE = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';

  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPricePreset, setSelectedPricePreset] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const itemsPerPage = 8;

  const showToast = (item) => {
    setToast(item);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getComboLists();
        const data = Array.isArray(response) ? response : response?.$values || [];

        const mapped = data.map((item) => ({
          id: item.comboId || item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image || FIXED_PRODUCT_IMAGE,
        }));

        setCombos(mapped);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu combo:', err);
        setError('Không thể tải dữ liệu combo lúc này.');
        setCombos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const addToCart = (combo) => {
    if (!isAuthenticated()) {
      setShowAuthRequired(true);
      return;
    }

    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = existingCart.findIndex((item) => item.id === combo.id && item.isCombo === true);

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity += 1;
    } else {
      existingCart.push({
        id: combo.id,
        name: combo.name,
        price: combo.price,
        image: combo.image,
        quantity: 1,
        isCombo: true,
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('storage'));
    showToast(combo);
  };

  const inSelectedPrice = (price) => {
    if (selectedPricePreset === 'all') return true;
    if (selectedPricePreset === 'under-200') return price < 200000;
    if (selectedPricePreset === '200-500') return price >= 200000 && price <= 500000;
    return price > 500000;
  };

  const filteredCombos = combos.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();
    const matchesSearch = !keyword || item.name.toLowerCase().includes(keyword) || (item.description || '').toLowerCase().includes(keyword);
    const matchesPrice = inSelectedPrice(item.price || 0);
    return matchesSearch && matchesPrice;
  });

  const sortedItems = [...filteredCombos].sort((a, b) => {
    if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const effectiveTotalPages = Math.max(1, totalPages);
  const displayedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPricePreset, sortBy]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  return (
    <div className="combo-page-shell">
      <Header />

      <div className="combo-page-container">
        <div className="combo-tabs-row">
          <button className="combo-tab-btn" onClick={() => navigate('/menu')}>Menu</button>
          <button className="combo-tab-btn active" onClick={() => navigate('/combo')}>Combo</button>
          <button className="combo-tab-btn" onClick={() => navigate('/buffet')}>Buffet</button>
        </div>

        <div className="combo-content">
          <aside className="combo-sidebar">
            <div className="combo-sidebar-sticky">
              <section className="combo-filter-section">
                <h3 className="combo-price-range-heading"><span className="combo-price-heading-bar" />Khoảng giá</h3>
                <div className="combo-filter-options">
                  <label className="combo-filter-option">
                    <input type="radio" name="combo-price" className="combo-custom-radio" checked={selectedPricePreset === 'all'} onChange={() => setSelectedPricePreset('all')} />
                    <span>Tất cả</span>
                  </label>
                  <label className="combo-filter-option">
                    <input type="radio" name="combo-price" className="combo-custom-radio" checked={selectedPricePreset === 'under-200'} onChange={() => setSelectedPricePreset('under-200')} />
                    <span>Dưới 200k</span>
                  </label>
                  <label className="combo-filter-option">
                    <input type="radio" name="combo-price" className="combo-custom-radio" checked={selectedPricePreset === '200-500'} onChange={() => setSelectedPricePreset('200-500')} />
                    <span>200k - 500k</span>
                  </label>
                  <label className="combo-filter-option">
                    <input type="radio" name="combo-price" className="combo-custom-radio" checked={selectedPricePreset === 'over-500'} onChange={() => setSelectedPricePreset('over-500')} />
                    <span>Trên 500k</span>
                  </label>
                </div>

                <button
                  type="button"
                  className="combo-price-reset-link"
                  onClick={() => {
                    setSelectedPricePreset('all');
                  }}
                >
                  Đặt lại bộ lọc
                </button>
              </section>
            </div>
          </aside>

          <main className="combo-main-content">
            <div className="combo-toolbar">
              <div className="combo-search-wrapper">
                <Search size={17} className="combo-search-icon" />
                <input
                  type="text"
                  className="combo-search-input"
                  placeholder="Tìm kiếm combo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="combo-toolbar-right">
                <p className="combo-result-text">Tổng {sortedItems.length} combo</p>
                <div className="combo-sort">
                  <label htmlFor="combo-sort-select">Sắp xếp</label>
                  <select
                    id="combo-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="default">Mặc định</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="status-msg">Đang chuẩn bị các combo hấp dẫn...</p>
            ) : error ? (
              <p className="status-msg error">{error}</p>
            ) : (
              <>
                <div className="combo-grid">
                  {displayedItems.map((item) => (
                    <div key={item.id} className="combo-item">
                      <div className="combo-item-image-wrap">
                        <img
                          className="combo-item-image"
                          src={item.image}
                          alt={item.name}
                          onError={(e) => e.target.src = FIXED_PRODUCT_IMAGE}
                        />
                        <span className="combo-item-badge">Combo</span>
                      </div>

                      <h3 className="combo-item-name">{item.name}</h3>
                      <p className="combo-item-desc">
                        {item.description}
                      </p>

                      <div className="combo-item-footer">
                        <div className="combo-item-prices">
                          <span className="combo-new-price">{item.price?.toLocaleString()}đ</span>
                        </div>
                        <button className="combo-cart-btn" onClick={() => addToCart(item)} aria-label="Thêm combo vào giỏ">
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {sortedItems.length > 0 && (
                  <div className="pagination-wrapper">
                    <div className="pagination-info">Hiển thị {displayedItems.length} / {sortedItems.length} món</div>
                    <div className="pagination-btns">
                      <button className="p-btn" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        <ChevronLeft size={16} />
                      </button>
                      {[...Array(effectiveTotalPages)].map((_, i) => (
                        <button key={i} className={`p-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => handlePageChange(i + 1)}>
                          {i + 1}
                        </button>
                      ))}
                      <button className="p-btn" onClick={() => handlePageChange(Math.min(effectiveTotalPages, currentPage + 1))} disabled={currentPage === effectiveTotalPages}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {toast && (
        <div className="combo-toast" role="status">
          <img
            src={toast.image || FIXED_PRODUCT_IMAGE}
            alt={toast.name}
            className="combo-toast-img"
            onError={(e) => {
              e.target.src = FIXED_PRODUCT_IMAGE;
            }}
          />
          <div className="combo-toast-body">
            <span className="combo-toast-title">Đã thêm vào giỏ hàng ✅</span>
            <span className="combo-toast-name">{toast.name}</span>
          </div>
          <button className="combo-toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <AuthRequiredModal
        isOpen={showAuthRequired}
        onClose={() => setShowAuthRequired(false)}
      />

      <Footer />
    </div>
  );
};

export default ComboPage;