// src/pages/MenuPage.js
import React, { useState } from 'react';
import { FaSearch, FaFilter, FaShoppingCart, FaStar } from 'react-icons/fa';
import '../styles/MenuPage.css';

const categories = [
  { id: 1, name: 'Khai vị', slug: 'appetizer' },
  { id: 2, name: 'Món chính', slug: 'main-course' },
  { id: 3, name: 'Đồ uống', slug: 'beverages' },
  { id: 4, name: 'Tráng miệng', slug: 'desserts' },
  { id: 5, name: 'Combo', slug: 'combo' } // thêm Combo
];

const menuItems = [
  {
    id: 1,
    name: 'Gỏi hải sản',
    description: 'Tôm, mực, bạch tuộc tươi ngon',
    price: 150000,
    categoryId: 1,
    image: '/images/menu/seafood-salad.jpg',
    isAvailable: true,
    isFeatured: true,
    rating: 4.5
  },
  {
    id: 101,
    name: 'Combo Hải Sản Thịnh Soạn',
    description: 'Gồm Gỏi hải sản, Món chính, Nước uống',
    price: 450000,
    categoryId: 5, // Combo
    image: '/images/menu/seafood-combo.jpg',
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    components: ['Gỏi hải sản', 'Cá hồi nướng', 'Trà đào'] // thành phần combo
  },
  // Thêm các món khác...
];

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const filteredItems = menuItems.filter(
    item =>
      item.categoryId === activeCategory &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (item) => {
    setCartItems([...cartItems, { ...item, quantity: 1 }]);
  };

  return (
    <div className="menu-page">
      <div className="menu-header">
        <h1>Thực đơn</h1>
        <p>Khám phá các món ăn đặc sắc của chúng tôi</p>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-container">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <FaFilter /> Lọc
        </button>
      </div>

      {/* Menu Items */}
      <div className="menu-items">
        {filteredItems.length === 0 && (
          <div className="no-items">Không có món nào</div>
        )}
        {filteredItems.map(item => (
          <div key={item.id} className="menu-item">
            <div className="item-image">
              <img src={item.image} alt={item.name} />
              {item.isFeatured && <span className="featured-badge">Nổi bật</span>}
              {item.categoryId === 5 && <span className="combo-badge">Combo</span>}
            </div>
            <div className="item-details">
              <div className="item-header">
                <h3>{item.name}</h3>
                <span className="price">{item.price.toLocaleString()} VNĐ</span>
              </div>
              <p className="description">{item.description}</p>

              {/* Components nếu là combo */}
              {item.components && (
                <ul className="combo-components">
                  {item.components.map((comp, index) => (
                    <li key={index}>• {comp}</li>
                  ))}
                </ul>
              )}

              <div className="item-footer">
                <div className="rating">
                  <FaStar className="star" /> {item.rating}
                </div>
                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(item)}
                >
                  <FaShoppingCart /> Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;
