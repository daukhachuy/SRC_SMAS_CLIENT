import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import '../styles/FoodListModal.css';

const FoodListModal = ({
  isOpen,
  onClose,
  onBack,
  menuItems,
  selectedDishes,
  onAddDish,
  onRemoveDish
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'Khai vị', label: 'Khai vị' },
    { id: 'Món chính', label: 'Món chính' },
    { id: 'Tráng miệng', label: 'Tráng miệng' },
    { id: 'Đồ uống', label: 'Đồ uống' }
  ];

  const filteredItems = useMemo(() => {
    let items = menuItems.filter(item => item.type === 'Menu');
    
    if (activeTab !== 'all') {
      items = items.filter(item => item.categoryLabel === activeTab);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(term));
    }
    
    return items;
  }, [menuItems, activeTab, searchTerm]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const isSelected = (dishId) => {
    return selectedDishes.some(d => (d.foodId || d.id) === dishId);
  };

  const handleToggleDish = (item) => {
    if (isSelected(item.foodId || item.id)) {
      onRemoveDish(item.foodId || item.id);
    } else {
      onAddDish({
        ...item,
        id: item.foodId || item.id,
        quantity: 1,
        subtotal: item.price
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="food-list-modal-overlay" onClick={onClose}>
      <div className="food-list-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="food-list-modal-header">
          <div className="food-list-header-top">
            <h3>DANH SÁCH MÓN ĂN</h3>
            <button className="food-list-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          
          {/* Search */}
          <div className="food-list-search">
            <Search size={18} className="food-list-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="food-list-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`food-list-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body - Grid */}
        <div className="food-list-modal-body">
          {filteredItems.length === 0 ? (
            <div className="food-list-empty">
              <p>Không có món ăn nào được tìm thấy</p>
            </div>
          ) : (
            <div className="food-list-grid">
              {filteredItems.map(item => {
                const itemId = item.foodId || item.id;
                const selected = isSelected(itemId);
                
                return (
                  <div
                    key={itemId}
                    className={`food-list-card ${selected ? 'selected' : ''}`}
                    onClick={() => handleToggleDish(item)}
                  >
                    <div className="food-list-card-image">
                      <div className="food-list-card-placeholder">
                        {item.name.charAt(0)}
                      </div>
                      {selected && (
                        <div className="food-list-card-check">
                          <Check size={20} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="food-list-card-content">
                      <span className={`food-list-card-tag tag-${item.categoryLabel === 'Khai vị' ? 'orange' : item.categoryLabel === 'Món chính' ? 'blue' : item.categoryLabel === 'Tráng miệng' ? 'green' : 'purple'}`}>
                        {item.categoryLabel}
                      </span>
                      <h4 className="food-list-card-name">{item.name}</h4>
                      <div className="food-list-card-footer">
                        <span className="food-list-card-price">{formatCurrency(item.price)}</span>
                        <button className={`food-list-card-btn ${selected ? 'selected' : ''}`}>
                          {selected ? (
                            <Check size={16} strokeWidth={2.5} />
                          ) : (
                            <Plus size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="food-list-modal-footer">
          <button className="food-list-back-btn" onClick={onBack}>
            ← Quay lại
          </button>
          <div className="food-list-selected-info">
            <span>Đã chọn:</span>
            <strong>{selectedDishes.filter(d => d.type === 'Menu').length} món</strong>
          </div>
          <button className="food-list-confirm-btn" onClick={onClose}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodListModal;
