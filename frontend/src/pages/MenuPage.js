import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MenuPage.css';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  UtensilsCrossed,
  Martini,
  Leaf,
  Soup,
  IceCreamCone,
  Globe,
  BookOpen,
  Droplets,
  Coffee,
  GlassWater,
  Beer,
  Search,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { getAllCategories } from '../api/categoryApi';
import { getFoodByFilter, resolveFoodImageUrl } from '../api/foodApi';
import { isAuthenticated } from '../api/authApi';

const MenuPage = () => {
  const navigate = useNavigate();
  const FIXED_PRODUCT_IMAGE = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [selectedPricePreset, setSelectedPricePreset] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const itemsPerPage = 8;

  const showToast = (item) => {
    setToast(item);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getAllCategories();
        let categoryData = [];
        if (Array.isArray(res)) categoryData = res;
        else if (Array.isArray(res?.$values)) categoryData = res.$values;
        else if (Array.isArray(res?.data)) categoryData = res.data;
        else if (Array.isArray(res?.data?.$values)) categoryData = res.data.$values;
        setCategories(categoryData);
      } catch (err) {
        setCategories([]);
      }
    };

    fetchCats();
  }, []);

  useEffect(() => {
    const loadFilteredFoods = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        selectedCategoryIds.forEach((id) => params.append('CategoryIds', id));
        if (priceRange.min !== null) params.append('MinPrice', priceRange.min);
        if (priceRange.max !== null) params.append('MaxPrice', priceRange.max);

        const foodArray = await getFoodByFilter(params);
        const mapped = foodArray.map((item) => ({
          id: item.foodId,
          name: item.name,
          price: item.price,
          oldPrice: item.promotionalPrice,
          image: resolveFoodImageUrl(item.image),
          categoryName: item.categories?.[0]?.name || 'Món ăn',
          isAvailable: item.isAvailable !== false,
        }));

        setMenuItems(mapped);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading foods:', err);
        setError('Không thể tải dữ liệu món ăn.');
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadFilteredFoods();
  }, [selectedCategoryIds, priceRange]);

  const addToCart = (item) => {
    if (item.isAvailable === false) return;
    if (!isAuthenticated()) {
      setShowAuthRequired(true);
      return;
    }

    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = existingCart.findIndex((cartItem) => cartItem.id === item.id);

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity += 1;
    } else {
      existingCart.push({
        ...item,
        quantity: 1,
        isCombo: false,
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('storage'));
    showToast(item);
  };

  const handleCategoryChange = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getCategoryIcon = (name) => {
    const normalized = (name || '').toLowerCase();
    if (normalized.includes('đồ ăn')) return UtensilsCrossed;
    if (normalized.includes('đồ uống')) return Martini;
    if (normalized.includes('khai vị')) return Leaf;
    if (normalized.includes('món chính')) return Soup;
    if (normalized.includes('tráng miệng')) return IceCreamCone;
    if (normalized.includes('món âu')) return Globe;
    if (normalized.includes('món á')) return BookOpen;
    if (normalized.includes('nước ngọt')) return Droplets;
    if (normalized.includes('trà') || normalized.includes('cà phê')) return Coffee;
    if (normalized.includes('nước ép')) return GlassWater;
    if (normalized.includes('rượu') || normalized.includes('bia')) return Beer;
    return UtensilsCrossed;
  };

  const handlePriceChange = (min, max) => {
    setPriceRange({ min, max });
  };

  const handlePricePresetChange = (preset) => {
    setSelectedPricePreset(preset);

    if (preset === 'all') {
      handlePriceChange(null, null);
      return;
    }
    if (preset === '0-50') {
      handlePriceChange(0, 50000);
      return;
    }
    if (preset === '50-100') {
      handlePriceChange(50000, 100000);
      return;
    }
    if (preset === '100-200') {
      handlePriceChange(100000, 200000);
      return;
    }

    handlePriceChange(200000, null);
  };

  const filteredItems = menuItems.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return item.name.toLowerCase().includes(keyword) || item.categoryName.toLowerCase().includes(keyword);
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  const featuredItems = sortedItems.slice(0, 2);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const displayedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  return (
    <div className="menu-page-shell">
      <Header />

      <div className="menu-page-container">
        <div className="menu-tabs-row">
          <button className="menu-tab-btn active">Menu</button>
          <button className="menu-tab-btn" onClick={() => navigate('/combo')}>Combo</button>
          <button className="menu-tab-btn" onClick={() => navigate('/buffet')}>Buffet</button>
        </div>

        <div className="menu-layout">
          <aside className="menu-sidebar">
            <div className="sidebar-sticky">
              <section className="filter-section">
                <h3 className="filter-heading">Danh Mục Món Ăn</h3>
                <div className="category-list">
                  <button
                    type="button"
                    className={`category-item ${selectedCategoryIds.length === 0 ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryIds([])}
                  >
                    <LayoutGrid size={16} />
                    <span>Tất cả</span>
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.categoryId}
                      type="button"
                      className={`category-item ${selectedCategoryIds.includes(cat.categoryId) ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(cat.categoryId)}
                    >
                      {React.createElement(getCategoryIcon(cat.name), { size: 16 })}
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="filter-section">
                <h3 className="price-range-heading"><span className="price-heading-bar" />Khoảng giá</h3>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="price-range"
                      className="custom-radio"
                      checked={selectedPricePreset === 'all'}
                      onChange={() => handlePricePresetChange('all')}
                    />
                    <span>Tất cả</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="price-range"
                      className="custom-radio"
                      checked={selectedPricePreset === '0-50'}
                      onChange={() => handlePricePresetChange('0-50')}
                    />
                    <span>0 - 50k</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="price-range"
                      className="custom-radio"
                      checked={selectedPricePreset === '50-100'}
                      onChange={() => handlePricePresetChange('50-100')}
                    />
                    <span>50k - 100k</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="price-range"
                      className="custom-radio"
                      checked={selectedPricePreset === '100-200'}
                      onChange={() => handlePricePresetChange('100-200')}
                    />
                    <span>100k - 200k</span>
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="price-range"
                      className="custom-radio"
                      checked={selectedPricePreset === '200+'}
                      onChange={() => handlePricePresetChange('200+')}
                    />
                    <span>Trên 200k</span>
                  </label>
                </div>

                <article className="price-promo-card">
                  <h4>Ưu đãi hôm nay</h4>
                  <p>Giảm 20% cho chủ thẻ FPT Bank khi thanh toán hóa đơn từ 2tr.</p>
                  <button type="button" onClick={() => navigate('/promotion')}>Xem chi tiết</button>
                </article>
                <button
                  type="button"
                  className="price-reset-link"
                  onClick={() => {
                    setSelectedPricePreset('all');
                    handlePriceChange(null, null);
                  }}
                >
                  Đặt lại lọc giá
                </button>
              </section>

            </div>
          </aside>

          <main className="menu-main-content">
            <div className="menu-toolbar">
              <div className="menu-search-wrapper">
                <Search size={17} className="menu-search-icon" />
                <input
                  type="text"
                  className="menu-search-input"
                  placeholder="Tìm kiếm món ăn..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="menu-toolbar-right">
                <p className="menu-result-text">Tổng {sortedItems.length} món</p>
                <div className="menu-sort">
                  <label htmlFor="menu-sort-select">Sắp xếp</label>
                  <select
                    id="menu-sort-select"
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
              <p className="status-msg">Đang chuẩn bị món ăn...</p>
            ) : error ? (
              <p className="status-msg error">{error}</p>
            ) : (
              <>
                {featuredItems.length > 0 && (
                  <section className="chef-featured-section">
                    <div className="section-head-row">
                      <h3 className="section-title">Món Đặc Sắc Của Đầu Bếp</h3>
                      <div className="section-line" />
                    </div>

                    <div className="chef-featured-grid">
                      {featuredItems.map((item, idx) => (
                        <article
                          key={`featured-${item.id}`}
                          className={`chef-feature-card${item.isAvailable === false ? ' menu-food-sold-out' : ''}`}
                        >
                          <div className="chef-image-wrap">
                            <img
                              src={item.image || FIXED_PRODUCT_IMAGE}
                              alt={item.name}
                              onError={(e) => {
                                e.target.src = FIXED_PRODUCT_IMAGE;
                              }}
                            />
                            {item.isAvailable === false && (
                              <span className="menu-oos-badge">Hết hàng</span>
                            )}
                          </div>
                          <div className="chef-card-body">
                            <div className="chef-card-top">
                              <div>
                                <span className="chef-chip">{idx === 0 ? 'Signature' : "Chef's Choice"}</span>
                                <h4>{item.name}</h4>
                              </div>
                              <span className="chef-price">{item.price.toLocaleString()}đ</span>
                            </div>
                            <p className="chef-desc">{item.categoryName} được yêu thích bởi thực khách trong tuần này.</p>
                            <button
                              type="button"
                              className="chef-cart-btn"
                              disabled={item.isAvailable === false}
                              onClick={() => addToCart(item)}
                            >
                              {item.isAvailable === false ? 'Tạm ngưng bán' : 'Thêm vào giỏ'} <ShoppingCart size={16} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                <section className="main-menu-section">
                  <div className="section-head-row">
                    <h3 className="section-title">Thực Đơn Chính</h3>
                  </div>

                  <div className="menu-page-grid">
                    {displayedItems.map((item) => (
                      <article
                        key={item.id}
                        className={`menu-item-card${item.isAvailable === false ? ' menu-food-sold-out' : ''}`}
                      >
                        <div className="menu-item-image-wrap">
                          <img
                            className="menu-item-image"
                            src={item.image || FIXED_PRODUCT_IMAGE}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = FIXED_PRODUCT_IMAGE;
                            }}
                          />
                          <span className="menu-item-badge">{item.categoryName}</span>
                          {item.isAvailable === false && (
                            <span className="menu-oos-badge menu-oos-badge--corner">Hết hàng</span>
                          )}
                        </div>

                        <h4 className="menu-item-name">{item.name}</h4>

                        <div className="menu-item-footer">
                          <div className="menu-item-prices">
                            {item.oldPrice && <span className="old-price">{item.oldPrice.toLocaleString()}đ</span>}
                            <span className="new-price">{item.price.toLocaleString()}đ</span>
                          </div>
                          <button
                            type="button"
                            className="menu-cart-btn"
                            disabled={item.isAvailable === false}
                            onClick={() => addToCart(item)}
                            aria-label={item.isAvailable === false ? 'Món tạm hết' : 'Thêm vào giỏ'}
                          >
                            <ShoppingCart size={18} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                {totalPages > 1 && (
                  <div className="pagination-wrapper">
                    <div className="pagination-info">Hiển thị {displayedItems.length} / {sortedItems.length} món</div>
                    <div className="pagination-btns">
                      <button className="p-btn" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        <ChevronLeft size={16} />
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i} className={`p-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => handlePageChange(i + 1)}>
                          {i + 1}
                        </button>
                      ))}
                      <button className="p-btn" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
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
        <div className="menu-toast" role="status">
          <img
            src={toast.image || FIXED_PRODUCT_IMAGE}
            alt={toast.name}
            className="menu-toast-img"
            onError={(e) => {
              e.target.src = FIXED_PRODUCT_IMAGE;
            }}
          />
          <div className="menu-toast-body">
            <span className="menu-toast-title">Đã thêm vào giỏ hàng ✅</span>
            <span className="menu-toast-name">{toast.name}</span>
          </div>
          <button className="menu-toast-close" onClick={() => setToast(null)}>×</button>
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

export default MenuPage;