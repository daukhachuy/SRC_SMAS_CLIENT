import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { getFoodByFilter } from '../api/foodApi';
import { mapFoodDtoToMenuOption, reconcileMenuItemsWithApiCategories } from '../utils/menuFoodFromApi';
import { categoryLabelsLooselyMatch } from '../utils/viCategoryMatch';
import '../styles/FoodListModal.css';

function filterMenuItemsByClientTab(itemList, tab) {
  if (!tab) return itemList;
  const cid = tab.categoryId;
  const labNorm = (tab.label || '').trim().toLowerCase();
  return itemList.filter((i) => {
    const iCid = i.categoryId;
    if (
      cid != null &&
      Number.isFinite(Number(cid)) &&
      iCid != null &&
      Number.isFinite(Number(iCid)) &&
      Number(iCid) === Number(cid)
    ) {
      return true;
    }
    const ilab = String(i.categoryLabel || '').trim();
    if (ilab.toLowerCase() === labNorm) return true;
    return categoryLabelsLooselyMatch(ilab, tab.label);
  });
}

function FoodListCardImage({ name, imageUrl, selected }) {
  const [useFallback, setUseFallback] = useState(!imageUrl);
  return (
    <div className="food-list-card-image">
      {!useFallback && imageUrl ? (
        <img
          className="food-list-card-img"
          src={imageUrl}
          alt=""
          onError={() => setUseFallback(true)}
        />
      ) : null}
      {useFallback ? (
        <div className="food-list-card-placeholder">
          {(name || '?').charAt(0)}
        </div>
      ) : null}
      {selected ? (
        <div className="food-list-card-check">
          <Check size={20} strokeWidth={3} />
        </div>
      ) : null}
    </div>
  );
}

/** Màu tag theo từ khóa (tương tự MenuPage). */

function tagVariantForCategoryLabel(label) {
  const s = String(label || '').toLowerCase();
  if (s.includes('khai')) return 'orange';
  if (s.includes('chính')) return 'blue';
  if (s.includes('tráng') || s.includes('miệng')) return 'green';
  if (s.includes('uống') || s.includes('nước') || s.includes('đồ uống') || s.includes('cafe') || s.includes('cà phê') || s.includes('bia')) return 'purple';
  return 'blue';
}

const FoodListModal = ({
  isOpen,
  onClose,
  onBack,
  menuItems,
  menuCategories = [],
  selectedDishes,
  onAddDish,
  onRemoveDish
}) => {
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const safeSelected = Array.isArray(selectedDishes) ? selectedDishes : [];

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverTabItems, setServerTabItems] = useState(null);
  const [serverTabLoading, setServerTabLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('all');
    setSearchTerm('');
    setServerTabItems(null);
    setServerTabLoading(false);
  }, [isOpen]);

  const tabs = useMemo(() => {
    const base = [{ id: 'all', label: 'Tất cả', categoryId: null }];
    const fromApi = (menuCategories || [])
      .filter((c) => c && c.categoryId != null && c.isAvailable !== false)
      .map((c, idx) => ({
        id: `cat-${c.categoryId}-${idx}`,
        label: String(c.name || '').trim() || `Danh mục ${c.categoryId}`,
        categoryId: Number(c.categoryId)
      }))
      .filter((t) => Number.isFinite(t.categoryId));
    if (fromApi.length > 0) return [...base, ...fromApi];
    const labels = [
      ...new Set(
        safeMenuItems
          .filter((i) => i && i.type === 'Menu')
          .map((i) => String(i.categoryLabel || '').trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b, 'vi'));
    return [
      ...base,
      ...labels.map((label, idx) => ({
        id: `lbl-${idx}`,
        label,
        categoryId: null
      }))
    ];
  }, [menuCategories, safeMenuItems]);

  const activeTabMeta = useMemo(() => tabs.find((t) => t.id === activeTab), [tabs, activeTab]);
  const useServerCategoryFilter =
    activeTabMeta != null &&
    activeTab !== 'all' &&
    activeTabMeta.categoryId != null &&
    Number.isFinite(activeTabMeta.categoryId);

  useEffect(() => {
    if (!isOpen) {
      setServerTabItems(null);
      setServerTabLoading(false);
      return;
    }
    if (!useServerCategoryFilter || !activeTabMeta) {
      setServerTabItems(null);
      setServerTabLoading(false);
      return;
    }

    let cancelled = false;
    setServerTabLoading(true);
    setServerTabItems(null);
    const cid = activeTabMeta.categoryId;

    (async () => {
      try {
        const params = new URLSearchParams();
        params.append('CategoryIds', String(cid));
        const foodList = await getFoodByFilter(params);
        const arr = Array.isArray(foodList) ? foodList : [];
        let mapped = arr.map((f) => mapFoodDtoToMenuOption(f));
        mapped = reconcileMenuItemsWithApiCategories(mapped, menuCategories);
        if (!cancelled) setServerTabItems(mapped);
      } catch {
        if (!cancelled) setServerTabItems(null);
      } finally {
        if (!cancelled) setServerTabLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, useServerCategoryFilter, activeTabMeta?.categoryId, menuCategories]);

  const filteredItems = useMemo(() => {
    let items = [];

    if (activeTab === 'all') {
      items = safeMenuItems.filter((item) => item && item.type === 'Menu');
    } else {
      const tab = tabs.find((t) => t.id === activeTab);
      if (!tab) {
        items = [];
      } else if (tab.categoryId != null && Number.isFinite(tab.categoryId)) {
        if (serverTabItems !== null) {
          items = serverTabItems.filter((i) => i && i.type === 'Menu');
        } else if (!serverTabLoading) {
          const base = safeMenuItems.filter((item) => item && item.type === 'Menu');
          items = filterMenuItemsByClientTab(base, tab);
        } else {
          items = [];
        }
      } else {
        const base = safeMenuItems.filter((item) => item && item.type === 'Menu');
        items = filterMenuItemsByClientTab(base, tab);
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter((item) => String(item.name ?? '').toLowerCase().includes(term));
    }

    return items;
  }, [safeMenuItems, activeTab, searchTerm, tabs, serverTabItems, serverTabLoading]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const isSelected = (dishId) => {
    return safeSelected.some((d) => String(d?.type || '').toLowerCase() === 'menu' && (d.foodId || d.id) === dishId);
  };

  const handleToggleDish = (item) => {
    if (isSelected(item.foodId || item.id)) {
      onRemoveDish(item.foodId || item.id, 'Menu');
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
      <div className="food-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="food-list-modal-header">
          <div className="food-list-header-top">
            <h3>DANH SÁCH MÓN ĂN</h3>
            <button type="button" className="food-list-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="food-list-search">
            <Search size={18} className="food-list-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="food-list-tabs">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={`food-list-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="food-list-modal-body">
          {useServerCategoryFilter && serverTabLoading ? (
            <div className="food-list-empty">
              <p>Đang tải món theo danh mục...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="food-list-empty">
              <p>Không có món ăn nào được tìm thấy</p>
            </div>
          ) : (
            <div className="food-list-grid">
              {filteredItems.map((item) => {
                const itemId = item.foodId || item.id;
                const selected = isSelected(itemId);
                const tagClass = tagVariantForCategoryLabel(item.categoryLabel);

                return (
                  <div
                    key={itemId}
                    className={`food-list-card ${selected ? 'selected' : ''}`}
                    onClick={() => handleToggleDish(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleDish(item);
                      }
                    }}
                  >
                    <FoodListCardImage
                      name={item.name}
                      imageUrl={item.image}
                      selected={selected}
                    />
                    <div className="food-list-card-content">
                      <span className={`food-list-card-tag tag-${tagClass}`}>
                        {item.categoryLabel}
                      </span>
                      <h4 className="food-list-card-name">{item.name}</h4>
                      <div className="food-list-card-footer">
                        <span className="food-list-card-price">{formatCurrency(item.price)}</span>
                        <button type="button" className={`food-list-card-btn ${selected ? 'selected' : ''}`}>
                          {selected ? (
                            <Check size={16} strokeWidth={2} />
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

        <div className="food-list-modal-footer">
          <button type="button" className="food-list-back-btn" onClick={onBack}>
            ← Quay lại
          </button>
          <div className="food-list-selected-info">
            <span>Đã chọn:</span>
            <strong>{safeSelected.filter((d) => String(d?.type || '').toLowerCase() === 'menu').length} món</strong>
          </div>
          <button type="button" className="food-list-confirm-btn" onClick={onClose}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodListModal;
