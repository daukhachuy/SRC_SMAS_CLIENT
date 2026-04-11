import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import '../styles/ComboListModal.css';

const ComboListModal = ({
  isOpen,
  onClose,
  onBack,
  comboItems,
  selectedDishes,
  onAddDish,
  onRemoveDish
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return comboItems;
    const term = searchTerm.toLowerCase();
    return comboItems.filter(item => item.name.toLowerCase().includes(term));
  }, [comboItems, searchTerm]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const isSelected = (comboId) => {
    return selectedDishes.some(d => d.comboId === comboId || d.id === comboId);
  };

  const handleToggleCombo = (item) => {
    const itemId = item.comboId || item.id;
    if (isSelected(itemId)) {
      onRemoveDish(itemId);
    } else {
      onAddDish({
        ...item,
        id: itemId,
        quantity: 1,
        subtotal: item.price
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="combo-list-modal-overlay" onClick={onClose}>
      <div className="combo-list-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="combo-list-modal-header">
          <div className="combo-list-header-top">
            <h3>DANH SÁCH GÓI COMBO</h3>
            <button className="combo-list-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          
          {/* Search */}
          <div className="combo-list-search">
            <Search size={18} className="combo-list-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm gói combo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Body - List */}
        <div className="combo-list-modal-body">
          {filteredItems.length === 0 ? (
            <div className="combo-list-empty">
              <p>Không có gói combo nào được tìm thấy</p>
            </div>
          ) : (
            <div className="combo-list-items">
              {filteredItems.map(item => {
                const itemId = item.comboId || item.id;
                const selected = isSelected(itemId);
                
                return (
                  <div
                    key={itemId}
                    className={`combo-list-item ${selected ? 'selected' : ''}`}
                    onClick={() => handleToggleCombo(item)}
                  >
                    <div className="combo-list-item-image">
                      <div className="combo-list-item-placeholder">
                        <span>C</span>
                      </div>
                    </div>
                    <div className="combo-list-item-content">
                      <span className="combo-list-item-badge">COMBO</span>
                      <h4 className="combo-list-item-name">{item.name}</h4>
                      <p className="combo-list-item-desc">Gói combo đặc biệt với nhiều món ăn hấp dẫn</p>
                      <div className="combo-list-item-footer">
                        <span className="combo-list-item-price">{formatCurrency(item.price)}</span>
                        <div className={`combo-list-item-btn ${selected ? 'selected' : ''}`}>
                          {selected ? (
                            <>
                              <Check size={16} strokeWidth={2.5} />
                              <span>Đã chọn</span>
                            </>
                          ) : (
                            <>
                              <Plus size={16} />
                              <span>Chọn</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="combo-list-modal-footer">
          <button className="combo-list-back-btn" onClick={onBack}>
            ← Quay lại
          </button>
          <div className="combo-list-selected-info">
            <span>Đã chọn:</span>
            <strong>{selectedDishes.filter(d => d.type === 'Combo').length} combo</strong>
          </div>
          <button className="combo-list-confirm-btn" onClick={onClose}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboListModal;
