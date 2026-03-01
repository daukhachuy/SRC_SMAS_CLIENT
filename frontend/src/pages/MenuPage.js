import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MenuPage.css';
import { ShoppingCart, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getAllCategories } from '../api/categoryApi';

const FloatingChat = () => (
  <div className="fixed-chat">
    <MessageSquare size={28} color="white" />
    <span className="online-status"></span>
  </div>
);

const MenuPage = () => {
  const navigate = useNavigate();
  const BASE_URL = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net";

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  // =========================
  // FETCH CATEGORIES
  // =========================
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getAllCategories();
        console.log("🔥 RAW CATEGORY RESPONSE:", res);

        let categoryData = [];

        // Trường hợp API trả thẳng array
        if (Array.isArray(res)) {
          categoryData = res;
        }
        // .NET trả { $values: [...] }
        else if (Array.isArray(res?.$values)) {
          categoryData = res.$values;
        }
        // Trả { data: [...] }
        else if (Array.isArray(res?.data)) {
          categoryData = res.data;
        }
        // Trả { data: { $values: [...] } }
        else if (Array.isArray(res?.data?.$values)) {
          categoryData = res.data.$values;
        }

        console.log("✅ FINAL CATEGORIES:", categoryData);

        setCategories(categoryData);
      } catch (err) {
        console.error("❌ Lỗi fetch categories:", err);
        setCategories([]);
      }
    };

    fetchCats();
  }, []);

  // =========================
  // FETCH FOOD
  // =========================
  useEffect(() => {
    const loadFilteredFoods = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        selectedCategoryIds.forEach(id => params.append('CategoryIds', id));
        if (priceRange.min !== null) params.append('MinPrice', priceRange.min);
        if (priceRange.max !== null) params.append('MaxPrice', priceRange.max);

        const response = await axios.get(
          `${BASE_URL}/api/food/filter?${params.toString()}`
        );

        console.log("🍔 FOOD RESPONSE:", response.data);

        const foodArray = Array.isArray(response.data)
          ? response.data
          : response.data?.$values || [];

        const mapped = foodArray.map(item => ({
          id: item.foodId,
          name: item.name,
          price: item.price,
          oldPrice: item.promotionalPrice,
          image: item.image?.startsWith('http')
            ? item.image
            : `${BASE_URL}${item.image}`,
          categoryName: item.categories?.[0]?.name || "Món ăn"
        }));

        setMenuItems(mapped);
        setCurrentPage(1);
      } catch (err) {
        console.error("❌ Lỗi load food:", err);
        setError("Không thể tải dữ liệu món ăn.");
      } finally {
        setLoading(false);
      }
    };

    loadFilteredFoods();
  }, [selectedCategoryIds, priceRange]);

  const handleCategoryChange = (id) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handlePriceChange = (min, max) => {
    setPriceRange({ min, max });
  };

  const filteredBySearch = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBySearch.length / itemsPerPage);
  const displayedItems = filteredBySearch.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  console.log("📦 Categories state:", categories);

  return (
    <div className="app">
      <Header />

      <div className="menu-page-container">
        <div className="menu-nav-tabs">
          <button className="nav-tab active">MENU</button>
          <button className="nav-tab" onClick={() => navigate('/combo')}>COMBO</button>
          <button className="nav-tab" onClick={() => navigate('/buffet')}>BUFFET</button>
        </div>

        <div className="menu-content">
          <aside className="sidebar">
            <div className="filter-section-main">
              <h3 className="filter-title">Lọc sản phẩm</h3>

              <div className="filter-group">
                <h4>DANH MỤC MÓN ĂN</h4>

                <ul className="filter-list">
                  <li>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.length === 0}
                        onChange={() => setSelectedCategoryIds([])}
                      />
                      Tất cả
                    </label>
                  </li>

                  {categories.map(cat => (
                    <li key={cat.categoryId}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(cat.categoryId)}
                          onChange={() => handleCategoryChange(cat.categoryId)}
                        />
                        {cat.name}
                      </label>
                    </li>
                  ))}

                  {categories.length === 0 && (
                    <p className="loading-small">Không có danh mục</p>
                  )}
                </ul>
              </div>

              <div className="filter-group">
                <h4>THEO GIÁ (VNĐ)</h4>
                <ul className="filter-list">
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(null, null)} defaultChecked /> Tất cả</label></li>
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(0, 50000)} /> 0 - 50k</label></li>
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(50000, 100000)} /> 50k - 100k</label></li>
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(100000, 200000)} /> 100k - 200k</label></li>
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(200000, null)} /> Trên 200k</label></li>
                </ul>
              </div>
            </div>
          </aside>

          <main className="main-content">
            {loading ? (
              <p className="status-msg">Đang chuẩn bị món ăn...</p>
            ) : error ? (
              <p className="status-msg error">{error}</p>
            ) : (
              <div className="menu-grid">
                {displayedItems.map(item => (
                  <div key={item.id} className="menu-item">
                    <div className="item-image-container">
                      <img
                        className="item-image"
                        src={item.image}
                        alt={item.name}
                        onError={(e) =>
                          e.target.src = "https://picsum.photos/300/200"
                        }
                      />
                    </div>

                    <span className="item-category">{item.categoryName}</span>
                    <h3 className="item-name">{item.name}</h3>

                    <div className="price-info">
                      <div>
                        {item.oldPrice && (
                          <span className="old-price">
                            {item.oldPrice.toLocaleString()}đ
                          </span>
                        )}
                        <span className="new-price">
                          {item.price.toLocaleString()}đ
                        </span>
                      </div>
                      <ShoppingCart size={20} className="cart-icon" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
      <FloatingChat />
    </div>
  );
};

export default MenuPage;