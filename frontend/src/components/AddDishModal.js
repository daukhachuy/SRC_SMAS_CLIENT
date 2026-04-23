import React from 'react';
import { X, UtensilsCrossed, Gift, Minus, Plus, Trash2 } from 'lucide-react';
import '../styles/AddDishModal.css';

const AddDishModal = ({
  isOpen,
  onClose,
  onOpenFoodList,
  onOpenComboList,
  selectedDishes,
  onUpdateQuantity,
  onRemoveDish,
  notes,
  onNotesChange,
  totalPrice,
  onConfirm
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="add-dish-modal-overlay" onClick={onClose}>
      <div className="add-dish-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="add-dish-modal-header">
          <h3>THÊM MÓN</h3>
          <button type="button" className="add-dish-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="add-dish-modal-body">
          {/* 2 Buttons lớn */}
          <div className="add-dish-choices">
            <button
              type="button"
              className="add-dish-choice-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenFoodList();
              }}
            >
              <div className="add-dish-choice-icon">
                <UtensilsCrossed size={32} />
              </div>
              <span className="add-dish-choice-text">Chọn món từ thực đơn</span>
            </button>

            <button
              type="button"
              className="add-dish-choice-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenComboList();
              }}
            >
              <div className="add-dish-choice-icon">
                <Gift size={32} />
              </div>
              <span className="add-dish-choice-text">Chọn Combo</span>
            </button>
          </div>

          {/* Ghi chú */}
          <div className="add-dish-notes-section">
            <label className="add-dish-label">GHI CHÚ THÊM</label>
            <textarea
              className="add-dish-notes-input"
              placeholder="Ví dụ: Không hành, ít cay..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
            />
          </div>

          {/* Danh sách đã chọn */}
          <div className="add-dish-selected-section">
            <div className="add-dish-selected-header">
              <h4>DANH SÁCH ĐÃ CHỌN</h4>
              <span className="add-dish-selected-count">{selectedDishes.length} Món</span>
            </div>

            <div className="add-dish-list">
              {selectedDishes.length === 0 ? (
                <div className="add-dish-empty">Chưa có món nào được chọn</div>
              ) : (
                selectedDishes.map((dish) => (
                  <div key={dish.id} className="add-dish-item">
                    <div className="add-dish-item-info">
                      <span className={`add-dish-item-tag tag-${dish.type === 'Combo' ? 'combo' : 'menu'}`}>
                        {dish.type === 'Combo' ? 'Combo' : dish.categoryLabel || 'Món'}
                      </span>
                      <span className="add-dish-item-name">{dish.name}</span>
                      <span className="add-dish-item-price">{formatCurrency(dish.price)}</span>
                    </div>
                    <div className="add-dish-item-actions">
                      <div className="add-dish-qty-control">
                        <button
                          className="add-dish-qty-btn"
                          onClick={() => onUpdateQuantity(dish.id, Math.max(1, dish.quantity - 1), dish.type)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="add-dish-qty-value">{String(dish.quantity).padStart(2, '0')}</span>
                        <button
                          className="add-dish-qty-btn"
                          onClick={() => onUpdateQuantity(dish.id, dish.quantity + 1, dish.type)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        className="add-dish-remove-btn"
                        onClick={() => onRemoveDish(dish.id, dish.type)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="add-dish-modal-footer">
          <div className="add-dish-total">
            <span>Tổng cộng tạm tính:</span>
            <strong>{formatCurrency(totalPrice)}</strong>
          </div>
          <button type="button" className="add-dish-confirm-btn" onClick={onConfirm}>
            XÁC NHẬN ĐƠN HÀNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDishModal;
