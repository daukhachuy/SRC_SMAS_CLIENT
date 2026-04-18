import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { getBuffetDetail, getBuffetLists, getComboLists, resolveFoodImageUrl } from '../api/foodApi';
import { getAllCategories } from '../api/categoryApi';
import {
  addItemToOrder,
  addItemsToOrder,
  createGuestOrder,
  getCurrentOrderSession,
  getFoodsBufferByOrderCode,
  getOrderByCode,
  getOrderItemsByCode,
  getOrderSessionMenu,
} from '../api/orderApi';
import '../styles/MenuPage.css';

const MENU_TABS = ['Food', 'Combo', 'Buffet'];

const CATEGORY_ALL_KEY = 'all';

const stripVietnamese = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizeCategoryKey = (value) => {
  const s = stripVietnamese(value);
  if (s.includes('khai') || s.includes('starter') || s.includes('appetizer')) return 'appetizer';
  if (s.includes('mon chinh') || s.includes('main')) return 'main';
  if (s.includes('do uong') || s.includes('drink') || s.includes('beverage')) return 'drink';
  if (s.includes('trang mieng') || s.includes('dessert') || s.includes('sweet')) return 'dessert';
  return 'main';
};

const inferCategoryKeyFromName = (name) => {
  const s = stripVietnamese(name);
  const appetizerHints = ['salad', 'nem', 'cha gio', 'goi', 'sup', 'soup', 'khoai tay chien'];
  const drinkHints = ['nuoc', 'tra', 'cafe', 'ca phe', 'sinh to', 'beer', 'bia', 'juice', 'cocktail'];
  const dessertHints = ['kem', 'banh', 'che', 'pudding', 'fondant', 'tiramisu', 'flan', 'dessert'];

  if (appetizerHints.some((kw) => s.includes(kw))) return 'appetizer';
  if (drinkHints.some((kw) => s.includes(kw))) return 'drink';
  if (dessertHints.some((kw) => s.includes(kw))) return 'dessert';
  return 'main';
};

const categoryLabelByKey = {
  appetizer: 'Khai vị',
  main: 'Món chính',
  drink: 'Đồ uống',
  dessert: 'Tráng miệng',
};

const normalizeArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.$values)) return payload.$values;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.$values)) return payload.data.$values;
  if (Array.isArray(payload?.foods)) return payload.foods;
  if (Array.isArray(payload?.combos)) return payload.combos;
  if (Array.isArray(payload?.buffets)) return payload.buffets;
  if (Array.isArray(payload?.menuItems)) return payload.menuItems;
  if (Array.isArray(payload?.data?.foods)) return payload.data.foods;
  if (Array.isArray(payload?.data?.combos)) return payload.data.combos;
  if (Array.isArray(payload?.data?.buffets)) return payload.data.buffets;
  if (Array.isArray(payload?.data?.menuItems)) return payload.data.menuItems;
  return [];
};

const extractRowsByMenuType = (payload, menuType) => {
  const direct = normalizeArrayPayload(payload);
  if (direct.length > 0) return direct;

  const data = payload?.data || payload || {};
  const normalizedType = String(menuType || '').toLowerCase();

  const bucketsByType = normalizedType === 'combo'
    ? [
      data?.combos,
      data?.combo,
      data?.comboMenus,
      data?.comboItems,
      data?.data?.combos,
      data?.data?.combo,
    ]
    : (normalizedType === 'buffet'
      ? [
        data?.buffets,
        data?.buffet,
        data?.buffetMenus,
        data?.buffetItems,
        data?.data?.buffets,
        data?.data?.buffet,
      ]
      : [
        data?.foods,
        data?.foodsMenu,
        data?.foodItems,
        data?.food,
        data?.menuFoods,
        data?.data?.foods,
        data?.data?.food,
      ]);

  for (const bucket of bucketsByType) {
    const rows = normalizeArrayPayload(bucket);
    if (rows.length > 0) return rows;
  }

  // Last resort: flatten all array-like fields from object payload.
  const objectCandidates = [data, data?.data].filter(Boolean);
  for (const obj of objectCandidates) {
    for (const value of Object.values(obj)) {
      const rows = normalizeArrayPayload(value);
      if (rows.length > 0) return rows;
    }
  }

  return [];
};

const extractBuffetIncludes = (item) => {
  const buckets = [
    item?.foods,
    item?.menuBuffets,
    item?.foodItems,
    item?.items,
    item?.menuItems,
    item?.details,
  ];

  for (const bucket of buckets) {
    const rows = normalizeArrayPayload(bucket);
    if (rows.length > 0) {
      return rows
        .map((x) => x?.foodName || x?.name || x?.itemName || x?.menuName || '')
        .map((x) => String(x || '').trim())
        .filter(Boolean);
    }
  }

  const textCandidates = [
    item?.menuDescription,
    item?.includeMenu,
    item?.includes,
  ];

  for (const text of textCandidates) {
    const raw = String(text || '').trim();
    if (!raw) continue;
    const lines = raw
      .split(/\r?\n|•|\-|;/)
      .map((x) => String(x || '').trim())
      .filter(Boolean);
    if (lines.length > 1) return lines;
  }

  return [];
};

const mapMenuItem = (item, idx, forcedType) => {
  const forced = String(forcedType || '').trim();
  const rawType = forced || String(item.type || item.itemType || '').toLowerCase();
  const itemType = String(rawType).toLowerCase().includes('combo')
    ? 'Combo'
    : (String(rawType).toLowerCase().includes('buffet') ? 'Buffet' : 'Food');
  const rawId =
    itemType === 'Combo'
      ? (item.comboId || item.id)
      : (itemType === 'Buffet' ? (item.buffetId || item.id) : (item.foodId || item.id));
  const id = rawId || idx + 1;
  const foodName = item.foodName || item.comboName || item.buffetName || item.name || `Món ${id}`;
  const rawPrice = Number(item.price ?? item.unitPrice ?? item.amount ?? 0);
  const firstCategory = Array.isArray(item?.categories) ? item.categories[0] : null;
  const categoryRaw = String(
    item.categoryName ||
    item.foodCategoryName ||
    firstCategory?.name ||
    item.category?.name ||
    item.category ||
    ''
  ).trim();
  const categoryId = Number(
    item.categoryId ??
    item.foodCategoryId ??
    item.idCategory ??
    firstCategory?.categoryId ??
    firstCategory?.id ??
    item.category?.categoryId ??
    item.category?.id ??
    0
  );
  const categoryKey = categoryRaw
    ? normalizeCategoryKey(categoryRaw)
    : inferCategoryKeyFromName(foodName);
  const categoryFilterKey = Number.isFinite(categoryId) && categoryId > 0
    ? `id:${categoryId}`
    : `key:${categoryKey}`;

  return {
    id,
    cartKey: `${itemType}-${id}`,
    itemType,
    foodId: itemType === 'Food' ? Number(id) : 0,
    comboId: itemType === 'Combo' ? Number(id) : 0,
    buffetId: itemType === 'Buffet' ? Number(id) : 0,
    name: foodName,
    price: Number.isFinite(rawPrice) ? rawPrice : 0,
    img: resolveFoodImageUrl(item.image || item.imageUrl || item.thumbnail),
    desc: item.description || item.note || 'Món ăn đặc sắc của nhà hàng.',
    buffetPriceAdult: Number(item.priceOfAdult ?? item.mainPrice ?? item.priceAdult ?? item.adultPrice ?? item.adultAmount ?? item.price ?? 0),
    buffetPriceChild: Number(item.priceOfChildren ?? item.childrenPrice ?? item.priceChild ?? item.childPrice ?? item.childAmount ?? 0),
    buffetIncludes: itemType === 'Buffet' ? extractBuffetIncludes(item) : [],
    buffetFoods: [],
    categoryId: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 0,
    category: categoryRaw || categoryLabelByKey[categoryKey] || 'Món chính',
    categoryKey,
    categoryFilterKey,
    tag: item.isBestSeller || item.isChefChoice ? `CHEF'S CHOICE` : '',
  };
};

const getBuffetPriceLines = (item) => {
  const adult = Number(item?.buffetPriceAdult ?? 0);
  const child = Number(item?.buffetPriceChild ?? 0);
  const lines = [];

  if (Number.isFinite(adult) && adult > 0) {
    lines.push(`Suất Người Lớn: ${adult.toLocaleString('vi-VN')} đ`);
  }
  if (Number.isFinite(child) && child > 0) {
    lines.push(`Suất Trẻ Em: ${child.toLocaleString('vi-VN')} đ`);
  }

  return lines;
};

const normalizeTableToken = (raw) => {
  const base = String(raw || '').trim();
  if (!base) return '';
  // Defensive normalize: tránh trường hợp token bị dính prefix hoặc khoảng trắng khi copy URL.
  return base.replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
};

const enrichBuffetIncludesWithDetail = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const enriched = await Promise.all(
    items.map(async (item) => {
      if (item?.itemType !== 'Buffet') return item;
      if (Array.isArray(item?.buffetIncludes) && item.buffetIncludes.length > 0) return item;

      const buffetId = Number(item?.buffetId || item?.id || 0);
      if (!Number.isFinite(buffetId) || buffetId <= 0) return item;

      try {
        const detail = await getBuffetDetail(buffetId);
        const detailRows = normalizeArrayPayload(detail?.foods || detail?.data?.foods || detail);
        const detailFoods = detailRows
          .map((x, idx) => {
            const foodId = Number(x?.foodId || x?.id || 0);
            const foodName = x?.foodName || x?.name || x?.itemName || `Món ${idx + 1}`;
            return {
              foodId,
              name: String(foodName || '').trim(),
            };
          })
          .filter((x) => Number.isFinite(x.foodId) && x.foodId > 0 && x.name);
        const includeNames = detailRows
          .map((x) => x?.foodName || x?.name || x?.itemName || '')
          .map((x) => String(x || '').trim())
          .filter(Boolean);

        if (includeNames.length === 0 && detailFoods.length === 0) return item;
        return {
          ...item,
          buffetIncludes: includeNames.length > 0 ? includeNames : item.buffetIncludes,
          buffetFoods: detailFoods,
        };
      } catch {
        return item;
      }
    })
  );

  return enriched;
};

const extractCurrentOrderItems = (payload) => {
  const data = payload?.data || payload || {};
  const candidates = [
    data?.orderItems,
    data?.items,
    data?.orderDetails,
    data?.details,
    data?.currentOrderItems,
    data?.order?.orderItems,
    data?.order?.items,
    data?.order?.orderDetails,
    data?.order?.details,
    data?.data?.orderItems,
    data?.data?.items,
    data?.data?.orderDetails,
    data?.data?.details,
  ];

  for (const candidate of candidates) {
    const arr = normalizeArrayPayload(candidate);
    if (arr.length > 0) return arr;
  }

  return [];
};

const mapCurrentOrderItem = (item, idx = 0) => {
  const normalizeDishStatus = (value) => {
    const status = String(value || '').trim().toLowerCase();
    if (
      status.includes('cho xu ly') ||
      status.includes('chờ xử lý') ||
      status.includes('pending') ||
      status.includes('confirm')
    ) return 'pending';
    if (status.includes('preparing') || status.includes('cooking')) return 'preparing';
    if (status.includes('dang lam') || status.includes('đang làm') || status.includes('che bien') || status.includes('chế biến')) return 'preparing';
    if (status.includes('ready') || status.includes('completed')) return 'ready';
    if (status.includes('san sang') || status.includes('sẵn sàng')) return 'ready';
    if (status.includes('served') || status.includes('delivered')) return 'served';
    if (status.includes('da phuc vu') || status.includes('đã phục vụ')) return 'served';
    if (status.includes('cancel')) return 'cancelled';
    if (status.includes('da huy') || status.includes('đã hủy')) return 'cancelled';
    return 'pending';
  };

  const rawType = String(item.type || item.itemType || item.menuType || '').toLowerCase();
  const hasComboId = Number(item.comboId || item.idCombo || 0) > 0;
  const hasBuffetId = Number(item.buffetId || item.bufferId || item.idBuffer || 0) > 0;
  const itemType = rawType.includes('combo')
    ? 'Combo'
    : (rawType.includes('buffet') ? 'Buffet' : (hasBuffetId ? 'Buffet' : (hasComboId ? 'Combo' : 'Food')));
  const resolvedId =
    itemType === 'Combo'
      ? (item.comboId || item.idCombo || item.id || item.itemId || item.menuItemId)
      : (itemType === 'Buffet'
        ? (item.buffetId || item.bufferId || item.idBuffer || item.id || item.itemId || item.menuItemId)
        : (item.foodId || item.id || item.menuItemId || item.itemId));
  const id = resolvedId || `line-${idx + 1}`;
  const quantity = Number(item.quantity || item.qty || 1);
  const price = Number(item.price ?? item.unitPrice ?? item.amount ?? 0);

  return {
    id,
    cartKey: `${itemType}-${id}`,
    itemType,
    foodId: Number(item.foodId || (itemType === 'Food' ? resolvedId : 0) || 0),
    comboId: Number(item.comboId || item.idCombo || (itemType === 'Combo' ? resolvedId : 0) || 0),
    buffetId: Number(item.buffetId || item.bufferId || item.idBuffer || (itemType === 'Buffet' ? resolvedId : 0) || 0),
    name: item.foodName || item.name || item.itemName || 'Món ăn',
    price: Number.isFinite(price) ? price : 0,
    childrenPrice: Number(item.childrenPrice || item.priceOfChildren || item.childPrice || 0),
    quantityBufferChildent: Number(item.quantityBufferChildent || item.quantityBuffetChildren || item.quantityChild || 0),
    img: resolveFoodImageUrl(item.image || item.imageUrl || item.thumbnail),
    desc: item.description || item.note || '',
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    dishStatus: normalizeDishStatus(
      item.dishStatus ||
      item.status ||
      item.itemStatus ||
      item.orderItemStatus
    ),
  };
};


// Trang đặt món theo QR cho khách (Guest QR Order) - style đồng bộ hệ thống
const GuesQRorder = () => {
  const [searchParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [foodsError, setFoodsError] = useState('');
  const [activeMenuType, setActiveMenuType] = useState('Food');
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ALL_KEY);
  const [foodCategories, setFoodCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [buffetDraftQty, setBuffetDraftQty] = useState({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lockedBuffetId, setLockedBuffetId] = useState(0);
  const [orderBuffetFoods, setOrderBuffetFoods] = useState([]);
  const [showOrderBuffetFoods, setShowOrderBuffetFoods] = useState(false);
  const [showOrderedItemsModal, setShowOrderedItemsModal] = useState(false);
  const [orderedItemsLoading, setOrderedItemsLoading] = useState(false);
  const [orderedItemsError, setOrderedItemsError] = useState('');
  const [orderedItems, setOrderedItems] = useState([]);
  const [currentOrderCode, setCurrentOrderCode] = useState('');

  const tableCode = searchParams.get('tableCode') || localStorage.getItem('tableCode') || '04';
  const tableName = searchParams.get('tableName') || localStorage.getItem('tableName') || '';
  const tableToken = normalizeTableToken(searchParams.get('tableToken') || localStorage.getItem('tableAccessToken') || '');
  const tableLabel = tableName
    ? String(tableName)
    : (String(tableCode).toUpperCase().startsWith('BÀN')
      ? String(tableCode)
      : `Bàn ${tableCode}`);

  const formatCurrency = (value) =>
    `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getAllCategories();
        const rows = Array.isArray(res)
          ? res
          : (Array.isArray(res?.$values)
            ? res.$values
            : (Array.isArray(res?.data)
              ? res.data
              : (Array.isArray(res?.data?.$values) ? res.data.$values : [])));
        const mapped = rows
          .map((x) => ({
            id: Number(x?.categoryId ?? x?.id ?? 0),
            name: String(x?.name || x?.categoryName || '').trim(),
          }))
          .filter((x) => Number.isFinite(x.id) && x.id > 0 && x.name);
        setFoodCategories(mapped);
      } catch {
        setFoodCategories([]);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadFoods = async () => {
      setLoadingFoods(true);
      setFoodsError('');
      try {
        // Đảm bảo request session dùng đúng token bàn ngay từ lần load đầu.
        if (tableToken) {
          localStorage.setItem('tableAccessToken', tableToken);
        }

        const typeCandidates = [
          activeMenuType,
          String(activeMenuType || '').toLowerCase(),
          String(activeMenuType || '').toUpperCase(),
          undefined,
        ];

        let rows = [];
        for (const typeValue of typeCandidates) {
          const menuPayload = await getOrderSessionMenu({
            type: typeValue,
            keyword: searchText.trim() || undefined,
          });
          rows = extractRowsByMenuType(menuPayload, activeMenuType);
          if (rows.length === 0) {
            console.debug('[GuestQR] Empty menu payload for type:', typeValue, menuPayload);
          }
          if (rows.length > 0) break;
        }

        let mapped = rows.map((item, idx) => mapMenuItem(item, idx, activeMenuType)).filter((item) => {
          if (activeMenuType === 'Food') return item.itemType === 'Food';
          if (activeMenuType === 'Combo') return item.itemType === 'Combo';
          if (activeMenuType === 'Buffet') return item.itemType === 'Buffet';
          return true;
        });

        if (mapped.length === 0 && activeMenuType === 'Combo') {
          const comboPayload = await getComboLists();
          const comboRows = Array.isArray(comboPayload)
            ? comboPayload
            : comboPayload?.$values || comboPayload?.data?.$values || comboPayload?.data || [];
          mapped = (Array.isArray(comboRows) ? comboRows : [])
            .filter((c) => c?.isAvailable !== false)
            .map((item, idx) => mapMenuItem(item, idx, 'Combo'));
        }

        if (mapped.length === 0 && activeMenuType === 'Buffet') {
          const buffetPayload = await getBuffetLists();
          const buffetRows = Array.isArray(buffetPayload)
            ? buffetPayload
            : buffetPayload?.$values || buffetPayload?.data?.$values || buffetPayload?.data || buffetPayload?.items || [];
          mapped = (Array.isArray(buffetRows) ? buffetRows : [])
            .filter((b) => b?.isAvailable !== false)
            .map((item, idx) => mapMenuItem(item, idx, 'Buffet'));
        }

        if (activeMenuType === 'Food' && mapped.length > 0 && foodCategories.length > 0) {
          const categoryIdByName = new Map(
            foodCategories.map((cat) => [stripVietnamese(cat.name), cat.id])
          );
          mapped = mapped.map((food) => {
            if (food.itemType !== 'Food') return food;
            if (Number(food.categoryId || 0) > 0) return food;
            const matchedCategoryId = categoryIdByName.get(stripVietnamese(food.category));
            if (!matchedCategoryId) return food;
            return {
              ...food,
              categoryId: matchedCategoryId,
              categoryFilterKey: `id:${matchedCategoryId}`,
            };
          });
        }

        if (activeMenuType === 'Buffet' && mapped.length > 0) {
          mapped = await enrichBuffetIncludesWithDetail(mapped);
        }

        setFoods(mapped);
      } catch (err) {
        const apiMessage = String(err?.response?.data?.message || err?.message || '').trim();
        if (apiMessage.toLowerCase().includes('token bàn không hợp lệ')) {
          localStorage.removeItem('tableAccessToken');
          setFoodsError('Token bàn không hợp lệ hoặc đã hết hạn. Vui lòng quét lại QR mới từ nhân viên.');
        } else {
          setFoodsError(apiMessage || 'Không tải được danh sách món ăn');
        }
        setFoods([]);
      } finally {
        setLoadingFoods(false);
      }
    };

    const timer = window.setTimeout(() => {
      loadFoods();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeMenuType, searchText, tableToken, foodCategories]);

  useEffect(() => {
    const loadCurrentOrder = async () => {
      try {
        const { current, orderCode: activeOrderCode, mapped, rawRows } = await resolveOrderedItemsFromSession();
        const rows = rawRows;
        setCurrentOrderCode(String(activeOrderCode || ''));
        setOrderedItems(mapped);

        const buffetIdFromItems = Array.from(
          new Set(
            rows
              .map((x) => Number(x?.buffetId || x?.bufferId || x?.idBuffer || 0))
              .filter((id) => id > 0)
          )
        )[0] || 0;

        const { orderCode: currentOrderCode } = extractOrderMeta(current);
        const candidateOrderCodes = Array.from(
          new Set(
            [
              currentOrderCode,
              searchParams.get('orderCode'),
              sessionStorage.getItem('pendingOrderCode'),
            ]
              .map((x) => String(x || '').trim())
              .filter(Boolean)
          )
        );

        if (buffetIdFromItems > 0) {
          setLockedBuffetId(buffetIdFromItems);
        }

        if (candidateOrderCodes.length > 0) {
          let loadedOrderBuffetFoods = [];
          let loadedBuffetId = buffetIdFromItems;

          for (const code of candidateOrderCodes) {
            try {
              const buffetRowsPayload = await getFoodsBufferByOrderCode(code);
              const buffetRows = Array.isArray(buffetRowsPayload)
                ? buffetRowsPayload
                : buffetRowsPayload?.$values || buffetRowsPayload?.data?.$values || buffetRowsPayload?.data || buffetRowsPayload?.items || [];
              const safeRows = Array.isArray(buffetRows) ? buffetRows : [];
              if (safeRows.length === 0) continue;

              const ids = Array.from(
                new Set(
                  safeRows
                    .map((x) => Number(x?.buffetId || x?.bufferId || x?.idBuffer || 0))
                    .filter((id) => id > 0)
                )
              );

              if (ids.length > 0 && loadedBuffetId <= 0) {
                loadedBuffetId = ids[0];
              }

              loadedOrderBuffetFoods = safeRows.map((item, idx) => ({
                foodId: Number(item?.foodId || item?.id || 0),
                name: String(item?.foodName || item?.name || item?.itemName || `Món ${idx + 1}`).trim(),
              })).filter((x) => Number.isFinite(x.foodId) && x.foodId > 0 && x.name);

              if (loadedOrderBuffetFoods.length > 0) {
                break;
              }
            } catch {
              // thử mã order khác
            }
          }

          if (loadedOrderBuffetFoods.length > 0) {
            setOrderBuffetFoods(loadedOrderBuffetFoods);
            setShowOrderBuffetFoods(true);
          } else {
            setOrderBuffetFoods([]);
            setShowOrderBuffetFoods(false);
          }

          if (loadedBuffetId > 0) {
            setLockedBuffetId(loadedBuffetId);
          }
        }
      } catch (err) {
        // Session hiện tại có thể chưa có order, giữ cart local rỗng là hợp lệ.
        const apiMessage = String(err?.response?.data?.message || err?.message || '').trim();
        if (apiMessage.toLowerCase().includes('token bàn không hợp lệ')) {
          localStorage.removeItem('tableAccessToken');
        }
        setOrderBuffetFoods([]);
        setShowOrderBuffetFoods(false);
        setOrderedItems([]);
        setCurrentOrderCode('');
        console.debug('Không lấy được đơn hiện tại theo session:', err?.response?.data || err?.message);
      }
    };

    loadCurrentOrder();
  }, [tableToken, searchParams]);

  const foodCategoryChips = useMemo(() => {
    const foodsOnly = foods.filter((item) => item.itemType === 'Food');
    const byId = new Map(foodCategories.map((cat) => [cat.id, cat.name]));
    const chips = [{ key: CATEGORY_ALL_KEY, label: 'Tất cả' }];
    const seen = new Set([CATEGORY_ALL_KEY]);

    // Đồng bộ thứ tự danh mục như trang thực đơn customer.
    foodCategories.forEach((cat) => {
      const key = `id:${cat.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      chips.push({ key, label: cat.name });
    });

    // Fallback: món chưa có categoryId vẫn có thể hiển thị nhóm suy đoán.
    foodsOnly.forEach((food) => {
      if (Number(food.categoryId || 0) > 0) return;
      const fallbackKey = String(food.categoryFilterKey || `key:${food.categoryKey || 'main'}`);
      if (seen.has(fallbackKey)) return;
      seen.add(fallbackKey);
      chips.push({ key: fallbackKey, label: food.category || categoryLabelByKey[food.categoryKey] || 'Món chính' });
    });

    return chips;
  }, [foods, foodCategories]);

  const filteredFoods = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return foods.filter((food) => {
      const byCategory = activeMenuType !== 'Food' || activeCategory === CATEGORY_ALL_KEY || String(food.categoryFilterKey || '') === activeCategory;
      const bySearch =
        !keyword ||
        food.name.toLowerCase().includes(keyword) ||
        food.desc.toLowerCase().includes(keyword);
      return byCategory && bySearch;
    });
  }, [foods, activeCategory, activeMenuType, searchText]);

  const selectedBuffetId = useMemo(() => {
    const picked = cart.find((item) => item.itemType === 'Buffet');
    return Number(picked?.buffetId || 0) || Number(lockedBuffetId || 0);
  }, [cart, lockedBuffetId]);

  const selectedBuffetMenu = useMemo(() => {
    if (!selectedBuffetId) return null;
    return foods.find((x) => Number(x?.buffetId || 0) === selectedBuffetId) || null;
  }, [foods, selectedBuffetId]);

  const selectedBuffetFoodsForView = useMemo(() => {
    if (Array.isArray(orderBuffetFoods) && orderBuffetFoods.length > 0) {
      return orderBuffetFoods;
    }
    return Array.isArray(selectedBuffetMenu?.buffetFoods) ? selectedBuffetMenu.buffetFoods : [];
  }, [orderBuffetFoods, selectedBuffetMenu]);

  const addToCart = (food) => {
    setCart((prev) => {
      if (food.itemType === 'Buffet') {
        if (Number(lockedBuffetId || 0) > 0 && Number(food.buffetId || 0) !== Number(lockedBuffetId || 0)) {
          alert('Đơn này đã khóa theo một loại buffet khác. Bạn chỉ có thể thêm đúng loại buffet đó.');
          return prev;
        }

        const existingBuffet = prev.find((item) => item.itemType === 'Buffet');
        if (existingBuffet && existingBuffet.cartKey !== food.cartKey) {
          alert('Đơn này đã có một loại buffet khác. Bạn chỉ có thể thêm cùng loại buffet đó.');
          return prev;
        }

        const draft = buffetDraftQty[food.cartKey] || { adult: 1, child: 0 };
        const adultQty = Math.max(0, Number(draft.adult) || 0);
        const childQty = Math.max(0, Number(draft.child) || 0);
        if (adultQty + childQty <= 0) {
          alert('Vui lòng chọn ít nhất 1 suất (người lớn hoặc trẻ em).');
          return prev;
        }

        const found = prev.find((item) => item.cartKey === food.cartKey);
        if (found) {
          return prev.map((item) =>
            item.cartKey === food.cartKey
              ? {
                ...item,
                quantity: item.quantity + adultQty,
                quantityBufferChildent: Number(item.quantityBufferChildent || 0) + childQty,
              }
              : item
          );
        }

        return [
          ...prev,
          {
            ...food,
            price: Number(food.buffetPriceAdult || food.price || 0),
            childrenPrice: Number(food.buffetPriceChild || 0),
            quantity: adultQty,
            quantityBufferChildent: childQty,
          },
        ];
      }

      const found = prev.find((item) => item.cartKey === food.cartKey);
      if (found) {
        return prev.map((item) =>
          item.cartKey === food.cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...food, quantity: 1 }];
    });

    if (food.itemType === 'Buffet' && Number(food.buffetId || 0) > 0) {
      setLockedBuffetId(Number(food.buffetId));
    }
  };

  const updateBuffetDraftQty = (cartKey, field, delta) => {
    setBuffetDraftQty((prev) => {
      const current = prev[cartKey] || { adult: 1, child: 0 };
      const nextValue = Math.max(0, Number(current[field] || 0) + delta);
      return {
        ...prev,
        [cartKey]: {
          ...current,
          [field]: nextValue,
        },
      };
    });
  };

  const updateQty = (cartKey, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => {
          if (item.itemType === 'Buffet') {
            return Number(item.quantity || 0) > 0 || Number(item.quantityBufferChildent || 0) > 0;
          }
          return Number(item.quantity || 0) > 0;
        })
    );
  };

  const updateBuffetChildQty = (cartKey, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey !== cartKey) return item;
          const next = Math.max(0, Number(item.quantityBufferChildent || 0) + delta);
          return { ...item, quantityBufferChildent: next };
        })
        .filter((item) => {
          if (item.itemType !== 'Buffet') return true;
          return Number(item.quantity || 0) > 0 || Number(item.quantityBufferChildent || 0) > 0;
        })
    );
  };

  const addBuffetFoodToCart = (buffetFood) => {
    const foodId = Number(buffetFood?.foodId || 0);
    if (!Number.isFinite(foodId) || foodId <= 0) return;

    const cartKey = `Food-${foodId}`;
    const name = String(buffetFood?.name || `Món ${foodId}`).trim();

    setCart((prev) => {
      const found = prev.find((item) => item.cartKey === cartKey);
      if (found) {
        return prev.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: Number(item.quantity || 0) + 1 } : item
        );
      }

      return [
        ...prev,
        {
          id: foodId,
          cartKey,
          itemType: 'Food',
          foodId,
          comboId: 0,
          buffetId: 0,
          name,
          price: 0,
          img: resolveFoodImageUrl(''),
          desc: 'Đã gồm trong giá buffet',
          quantity: 1,
        },
      ];
    });
  };

  const toGuestOrderItemPayload = (item) => {
    const base = {
      quantity: Number(item.quantity) || 1,
      note: 'Khách đặt qua QR',
    };

    if (Number(item.comboId) > 0) {
      return { ...base, comboId: Number(item.comboId) };
    }
    if (Number(item.buffetId) > 0) {
      return {
        ...base,
        buffetId: Number(item.buffetId),
        quantityBufferChildent: Math.max(0, Number(item.quantityBufferChildent) || 0),
      };
    }
    return { ...base, foodId: Number(item.foodId || item.id) };
  };

  const extractOrderMeta = (payload) => {
    const data = payload?.data || payload || {};
    const orderIdCandidates = [
      data?.orderId,
      data?.id,
      data?.data?.orderId,
      data?.data?.id,
      data?.order?.orderId,
      data?.order?.id,
    ];
    const orderCodeCandidates = [
      data?.orderCode,
      data?.code,
      data?.data?.orderCode,
      data?.data?.code,
      data?.order?.orderCode,
      data?.order?.code,
    ];

    const orderId = orderIdCandidates.map((v) => Number(v)).find((v) => Number.isFinite(v) && v > 0) || 0;
    const orderCode = orderCodeCandidates.map((v) => String(v || '').trim()).find(Boolean) || '';

    return { orderId, orderCode };
  };

  const toOrderItemEndpointPayload = (item) => {
    const payload = {
      quantity: Math.max(0, Number(item.quantity) || 0),
      note: 'Khách đặt qua QR',
    };

    const foodId = Number(item.foodId) || 0;
    const comboId = Number(item.comboId) || 0;
    const buffetId = Number(item.buffetId) || 0;
    const childQty = Math.max(0, Number(item.quantityBufferChildent) || 0);

    if (foodId > 0) payload.foodId = foodId;
    if (comboId > 0) payload.comboId = comboId;
    if (buffetId > 0) {
      payload.buffetId = buffetId;
      payload.quantityBufferChildent = childQty;
    }

    return payload;
  };

  const addCartItemsToOrderCode = async (orderCode) => {
    const safeOrderCode = String(orderCode || '').trim();
    if (!safeOrderCode) {
      throw new Error('Không tìm thấy mã đơn để thêm món.');
    }
    const validItems = cart
      .filter((x) => (Number(x.quantity) || 0) > 0 || (Number(x.quantityBufferChildent) || 0) > 0)
      .map(toOrderItemEndpointPayload)
      .filter((x) => Number(x.foodId || 0) > 0 || Number(x.comboId || 0) > 0 || Number(x.buffetId || 0) > 0);

    if (validItems.length === 0) {
      throw new Error('Không có món hợp lệ để thêm vào đơn.');
    }

    const hasComboOrBuffet = validItems.some((x) => Number(x.comboId || 0) > 0 || Number(x.buffetId || 0) > 0);

    // Giống luồng waiter: combo/buffet thêm qua endpoint add-{orderCode}-items để tránh lỗi validate foodId.
    if (hasComboOrBuffet) {
      await addItemsToOrder(safeOrderCode, validItems);
      return;
    }

    for (const item of validItems) {
      await addItemToOrder(safeOrderCode, item);
    }
  };

  const normalizeOrderItemRows = (rows) => {
    const direct = normalizeArrayPayload(rows);
    if (!Array.isArray(direct) || direct.length === 0) return [];

    // Trường hợp endpoint trả về list order, mỗi phần tử chứa items/orderItems.
    const hasWrappedOrder = direct.some((x) => Array.isArray(x?.items) || Array.isArray(x?.orderItems));
    if (!hasWrappedOrder) return direct;

    const expanded = [];
    direct.forEach((row) => {
      const nested = [
        ...normalizeArrayPayload(row?.items),
        ...normalizeArrayPayload(row?.orderItems),
        ...normalizeArrayPayload(row?.orderDetails),
        ...normalizeArrayPayload(row?.details),
      ];
      if (nested.length > 0) {
        expanded.push(...nested);
      }
    });
    return expanded.length > 0 ? expanded : direct;
  };

  const resolveOrderedItemsFromSession = async () => {
    if (tableToken) {
      localStorage.setItem('tableAccessToken', tableToken);
    }

    const current = await getCurrentOrderSession(tableToken);
    const meta = extractOrderMeta(current);
    let rows = normalizeOrderItemRows(extractCurrentOrderItems(current));

    if (rows.length === 0 && meta.orderCode) {
      try {
        const detail = await getOrderByCode(meta.orderCode, tableToken);
        const detailRows = normalizeOrderItemRows(extractCurrentOrderItems(detail));
        if (detailRows.length > 0) {
          rows = detailRows;
        }
      } catch {
        // fallback bên dưới
      }
    }

    if (rows.length === 0 && meta.orderCode) {
      try {
        const itemLines = await getOrderItemsByCode(meta.orderCode, tableToken);
        rows = normalizeOrderItemRows(itemLines);
      } catch {
        // giữ rỗng nếu backend không cho endpoint này với token bàn
      }
    }

    const mapped = rows.map((item, idx) => mapCurrentOrderItem(item, idx));

    return {
      current,
      orderCode: String(meta.orderCode || ''),
      mapped,
      rawRows: rows,
    };
  };

  const getDishStatusMeta = (dishStatus) => {
    const normalized = String(dishStatus || 'pending').toLowerCase();
    if (normalized === 'preparing') {
      return { label: 'Đang chế biến', color: '#b45309', bg: '#ffedd5' };
    }
    if (normalized === 'ready') {
      return { label: 'Sẵn sàng', color: '#166534', bg: '#dcfce7' };
    }
    if (normalized === 'served') {
      return { label: 'Đã phục vụ', color: '#1d4ed8', bg: '#dbeafe' };
    }
    if (normalized === 'cancelled') {
      return { label: 'Đã hủy', color: '#991b1b', bg: '#fee2e2' };
    }
    return { label: 'Chờ xác nhận', color: '#374151', bg: '#e5e7eb' };
  };

  const handleOpenOrderedItems = async () => {
    setShowOrderedItemsModal(true);
    setOrderedItemsLoading(true);
    setOrderedItemsError('');
    try {
      const { mapped, orderCode } = await resolveOrderedItemsFromSession();
      setCurrentOrderCode(String(orderCode || ''));
      setOrderedItems(mapped);
    } catch (err) {
      setOrderedItemsError(
        err?.response?.data?.message ||
        err?.message ||
        'Không tải được danh sách món đã order.'
      );
      setOrderedItems([]);
    } finally {
      setOrderedItemsLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    if (item.itemType === 'Buffet') {
      const adult = Number(item.price || 0) * Number(item.quantity || 0);
      const child = Number(item.childrenPrice || 0) * Number(item.quantityBufferChildent || 0);
      return sum + adult + child;
    }
    return sum + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);
  const total = subtotal;

  const getOrderedItemQuantity = (item) =>
    Number(item?.quantity || 0) + Number(item?.quantityBufferChildent || 0);

  const getOrderedItemLineAmount = (item) => {
    const adultQty = Number(item?.quantity || 0);
    const childQty = Number(item?.quantityBufferChildent || 0);
    const adultPrice = Number(item?.price || 0);
    const childPrice = Number(item?.childrenPrice || 0);
    if (item?.itemType === 'Buffet') {
      return adultQty * adultPrice + childQty * childPrice;
    }
    return getOrderedItemQuantity(item) * adultPrice;
  };

  const orderedItemsSummary = useMemo(() => {
    return orderedItems.reduce(
      (acc, item) => {
        // Tổng số món = số dòng món (không cộng dồn theo quantity).
        acc.totalQty += 1;
        acc.totalAmount += getOrderedItemLineAmount(item);
        return acc;
      },
      { totalQty: 0, totalAmount: 0 }
    );
  }, [orderedItems]);

  useEffect(() => {
    if (tableCode) {
      localStorage.setItem('tableCode', String(tableCode));
    }
    if (tableName) {
      localStorage.setItem('tableName', String(tableName));
    }
    if (tableToken) {
      localStorage.setItem('tableAccessToken', tableToken);
    }
  }, [tableCode, tableName, tableToken]);

  const handlePlaceOrder = async () => {
    const resolveTableId = () => {
      const raw = String(tableCode || '').trim();
      const match = raw.match(/(\d+)/);
      return match ? Number(match[1]) : Number(raw);
    };

    if (cart.length === 0) {
      alert('Vui lòng chọn món trước khi gọi nhân viên.');
      return;
    }

    const tableId = resolveTableId();
    if (!Number.isFinite(tableId) || tableId <= 0) {
      alert('Không xác định được bàn để gọi món.');
      return;
    }

    try {
      setIsPlacingOrder(true);

      let currentOrderCode = String(searchParams.get('orderCode') || sessionStorage.getItem('pendingOrderCode') || '').trim();
      let currentOrderId = Number(searchParams.get('orderId') || sessionStorage.getItem('pendingOrderId') || 0);

      if (!currentOrderCode) {
        try {
          const current = await getCurrentOrderSession();
          const meta = extractOrderMeta(current);
          currentOrderCode = meta.orderCode;
          if (meta.orderId > 0) {
            currentOrderId = meta.orderId;
          }
        } catch {
          // bỏ qua, fallback tạo order mới
        }
      }

      if (currentOrderCode) {
        await addCartItemsToOrderCode(currentOrderCode);
        sessionStorage.setItem('pendingOrderCode', String(currentOrderCode));
        if (Number.isFinite(currentOrderId) && currentOrderId > 0) {
          sessionStorage.setItem('pendingOrderId', String(currentOrderId));
        }
        setCart([]);
        alert('Đã thêm món vào đơn hiện tại thành công. Nhân viên sẽ xác nhận đơn của bạn.');
        return;
      }

      const payload = {
        orderType: 'DineIn',
        tableIds: [tableId],
        numberOfGuests: 1,
        note: `QR order at table ${tableCode}`,
        orderItems: cart.map(toGuestOrderItemPayload),
      };
      const created = await createGuestOrder(payload);
      const { orderId: createdOrderId, orderCode: createdOrderCode } = extractOrderMeta(created);
      if (!Number.isFinite(createdOrderId) || createdOrderId <= 0) {
        throw new Error('Tạo đơn thành công nhưng không lấy được orderId.');
      }
      sessionStorage.setItem('pendingOrderId', String(createdOrderId));
      if (createdOrderCode) {
        sessionStorage.setItem('pendingOrderCode', String(createdOrderCode));
      }
      setCart([]);
      alert('Đã gửi gọi món thành công. Nhân viên sẽ xác nhận đơn của bạn.');
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Không thể gửi gọi món.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="menu-page-shell">
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: '#fff',
          borderBottom: '1px solid #eceff3',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 900, color: '#ff7a21', letterSpacing: 0.2 }}>
          NHÀ HÀNG FPT
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {MENU_TABS.map((tab) => {
            const active = activeMenuType === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveMenuType(tab);
                  setActiveCategory(CATEGORY_ALL_KEY);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: active ? '#ff7a21' : '#4b5563',
                  fontWeight: active ? 800 : 700,
                  cursor: 'pointer',
                  borderBottom: active ? '2px solid #ff7a21' : '2px solid transparent',
                  paddingBottom: 2,
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleOpenOrderedItems}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 999,
              background: '#fff7f1',
              color: '#b45309',
              fontWeight: 900,
              border: '1px solid #ffd2ae',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(255,122,33,0.16)',
            }}
            title={`Đơn hàng của ${tableLabel}`}
          >
            <ShoppingCart size={14} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.2 }}>
              Bạn đang ở
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{tableLabel}</span>
          </button>
        </div>
      </div>

      <div className="menu-page-container" style={{display: 'flex', gap: 32, paddingTop: 24}}>
        {/* Cột trái: Danh sách món ăn */}
        <div style={{flex: 2}}>
          <h1 className="menu-title" style={{fontSize: 36, fontWeight: 800, marginBottom: 8}}>
            {activeMenuType === 'Food' ? 'Món lẻ (Food)' : activeMenuType === 'Combo' ? 'Combo' : 'Buffet'}
          </h1>
          <p className="menu-desc" style={{color: '#6d7680', marginBottom: 24}}>Khám phá tinh hoa ẩm thực Pháp giữa lòng Sài Gòn</p>
          {activeMenuType === 'Food' && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  border: '1px solid #f1e4d7',
                  background: 'linear-gradient(180deg, #fff 0%, #fff9f4 100%)',
                  borderRadius: 14,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14, color: '#374151', marginBottom: 10 }}>
                  Danh Mục Món Ăn
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {foodCategoryChips.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    style={{
                      height: 34,
                      padding: '0 16px',
                      borderRadius: 999,
                      border: activeCategory === cat.key ? 'none' : '1px solid #e5e7eb',
                      background: activeCategory === cat.key ? '#ff8a2a' : '#f5f7fb',
                      color: activeCategory === cat.key ? '#fff' : '#334155',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 0.2,
                      cursor: 'pointer',
                      boxShadow: activeCategory === cat.key ? '0 6px 14px rgba(255,122,33,0.28)' : 'none',
                      transition: 'all 160ms ease',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
                </div>
              </div>
            </div>
          )}
          <div style={{marginBottom: 24, position: 'relative', maxWidth: 320}}>
            <input
              className="menu-search-input"
              placeholder="Tìm kiếm món ăn..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{padding: '10px 36px 10px 16px', borderRadius: 8, border: '1px solid #e6e9ed', fontSize: 14, width: '100%'}}
            />
            <span style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa'}}>🔍</span>
          </div>
          {foodsError && <p style={{ color: '#cf1322', marginBottom: 16 }}>⚠ {foodsError}</p>}
          {loadingFoods && <p style={{ color: '#6d7680', marginBottom: 16 }}>Đang tải món ăn...</p>}
          {!loadingFoods && !foodsError && filteredFoods.length === 0 && (
            <p style={{ color: '#6d7680', marginBottom: 16 }}>Hiện chưa có món trong mục {activeMenuType}.</p>
          )}
          {activeMenuType === 'Buffet' && ((showOrderBuffetFoods && selectedBuffetFoodsForView.length > 0) || (selectedBuffetId > 0 && selectedBuffetMenu)) ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#374151' }}>MÓN TRONG GÓI BUFFET ĐÃ CHỌN</h3>
                <p style={{ margin: '6px 0 0', color: '#6b7280', fontWeight: 700 }}>
                  Gói đã chọn: {selectedBuffetMenu?.name || '--'}
                </p>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))', gap: 16}}>
                {selectedBuffetFoodsForView.map((food) => (
                  <div
                    key={`buffet-food-${food.foodId}`}
                    style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid #ffd7b8', borderRadius: 14, background: '#fff', padding: '14px 16px'}}
                  >
                    <div>
                      <div style={{fontWeight: 800, color: '#1f2937', marginBottom: 4}}>{food.name}</div>
                      <div style={{color: '#6b7280', fontSize: 13}}>Đã gồm trong giá buffet</div>
                    </div>
                    <button
                      onClick={() => addBuffetFoodToCart(food)}
                      style={{width: 34, height: 34, borderRadius: 10, border: '1px solid #ffd2ae', background: '#fff7f1', color: '#FF7A21', fontWeight: 900, fontSize: 20, cursor: 'pointer', lineHeight: 1}}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <div style={{display: 'grid', gridTemplateColumns: activeMenuType === 'Buffet' ? 'repeat(2, minmax(320px, 1fr))' : 'repeat(3, 1fr)', gap: 24}}>
            {filteredFoods.map((food) => {
              const isBuffetCard = activeMenuType === 'Buffet';
              const draftAdult = Number(buffetDraftQty[food.cartKey]?.adult ?? 1);
              const draftChild = Number(buffetDraftQty[food.cartKey]?.child ?? 0);
              return (
              <div key={food.cartKey || `${food.itemType || 'Food'}-${food.id}`} className="menu-card" style={{background: '#fff', borderRadius: 20, boxShadow: '0 10px 28px rgba(15,23,42,0.08)', padding: isBuffetCard ? 18 : 16, position: 'relative', border: isBuffetCard ? '1px solid #ffd7b8' : '1px solid #eef2f7', display: 'flex', flexDirection: 'column', height: '100%'}}>
                {food.tag && <div style={{position: 'absolute', top: 12, left: 12, background: '#FF7A21', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px', zIndex: 2}}>{food.tag}</div>}
                <img src={food.img} alt={food.name} style={{width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 12}} />
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                  <span style={{fontWeight: 700, fontSize: 16}}>{food.name}</span>
                  <span style={{color: '#FF7A21', fontWeight: 700}}>{formatCurrency(food.itemType === 'Buffet' ? (food.buffetPriceAdult || food.price) : food.price)}</span>
                </div>
                {activeMenuType === 'Buffet' ? (
                  <div style={{color: '#333', fontSize: 13, marginBottom: 12}}>
                    <div style={{ marginBottom: 8, fontWeight: 800, color: '#1f2937' }}>Thực đơn bao gồm:</div>
                    {Array.isArray(food.buffetIncludes) && food.buffetIncludes.length > 0 ? (
                      <div style={{ marginBottom: 10, background: '#fff7f1', borderRadius: 12, padding: '10px 12px', border: '1px dashed #ffd7b8' }}>
                        {food.buffetIncludes.map((line) => (
                          <div key={`${food.cartKey}-menu-${line}`} style={{ marginBottom: 4, color: '#374151', lineHeight: 1.35 }}>• {line}</div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginBottom: 10, color: '#666', background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}>{food.desc}</div>
                    )}
                    <div style={{ marginBottom: 6, fontWeight: 800, color: '#1f2937' }}>Bảng Giá Chi Tiết</div>
                    <div style={{ marginBottom: 8, background: '#fff', borderRadius: 12, border: '1px solid #ffe8d4', padding: '10px 12px' }}>
                      <div style={{ marginBottom: 2, color: '#4b5563', fontWeight: 700 }}>Suất Người Lớn</div>
                      <div style={{ marginBottom: 2, color: '#6b7280' }}>Dành cho khách trên 1m3</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ color: '#ff7a21', fontWeight: 900, fontSize: 28 }}>{formatCurrency(food.buffetPriceAdult || food.price || 0)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => updateBuffetDraftQty(food.cartKey, 'adult', -1)}
                            style={{width: 24, height: 24, borderRadius: 8, border: '1px solid #ffd2ae', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 14, cursor: 'pointer'}}
                          >
                            -
                          </button>
                          <span style={{ minWidth: 14, textAlign: 'center', fontWeight: 800 }}>{draftAdult}</span>
                          <button
                            onClick={() => updateBuffetDraftQty(food.cartKey, 'adult', 1)}
                            style={{width: 24, height: 24, borderRadius: 8, border: '1px solid #ffd2ae', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 14, cursor: 'pointer'}}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ffe8d4', padding: '10px 12px' }}>
                      <div style={{ marginBottom: 2, color: '#4b5563', fontWeight: 700 }}>Suất Trẻ Em</div>
                      <div style={{ marginBottom: 2, color: '#6b7280' }}>Khách hàng từ 1m - 1m3</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ color: '#ff7a21', fontWeight: 900, fontSize: 28 }}>{formatCurrency(food.buffetPriceChild || 0)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => updateBuffetDraftQty(food.cartKey, 'child', -1)}
                            style={{width: 24, height: 24, borderRadius: 8, border: '1px solid #ffd2ae', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 14, cursor: 'pointer'}}
                          >
                            -
                          </button>
                          <span style={{ minWidth: 14, textAlign: 'center', fontWeight: 800 }}>{draftChild}</span>
                          <button
                            onClick={() => updateBuffetDraftQty(food.cartKey, 'child', 1)}
                            style={{width: 24, height: 24, borderRadius: 8, border: '1px solid #ffd2ae', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 14, cursor: 'pointer'}}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{color: '#666', fontSize: 13, marginBottom: 12}}>{food.desc}</div>
                )}
                <button
                  disabled={
                    activeMenuType === 'Buffet' &&
                    Number(food.buffetId || 0) > 0 &&
                    selectedBuffetId > 0 &&
                    selectedBuffetId !== Number(food.buffetId || 0)
                  }
                  title={
                    activeMenuType === 'Buffet' &&
                    Number(food.buffetId || 0) > 0 &&
                    selectedBuffetId > 0 &&
                    selectedBuffetId !== Number(food.buffetId || 0)
                      ? 'Đơn đã có loại buffet khác, không thể thêm.'
                      : ''
                  }
                  onClick={() => addToCart(food)}
                  style={{width: '100%', background: '#FF7A21', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 15, letterSpacing: 0.2, cursor: 'pointer', marginTop: 'auto', opacity: (activeMenuType === 'Buffet' && Number(food.buffetId || 0) > 0 && selectedBuffetId > 0 && selectedBuffetId !== Number(food.buffetId || 0)) ? 0.6 : 1}}
                >
                  {activeMenuType === 'Buffet' ? 'THÊM VÀO GIỎ' : '+ Thêm vào giỏ'}
                </button>
              </div>
            )})}
          </div>
          )}
        </div>
        {/* Cột phải: Sidebar giỏ hàng */}
        <div style={{flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: 24, minWidth: 340, maxWidth: 380, height: 'fit-content'}}>
          <div style={{fontWeight: 800, fontSize: 20, marginBottom: 8}}>Đơn hàng của bạn</div>
          <div style={{color: '#888', fontSize: 13, marginBottom: 18}}>{tableLabel} • NHÀ HÀNG FPT</div>
          <div style={{marginBottom: 18}}>
            {cart.length === 0 && <p style={{ color: '#94a3b8' }}>Chưa có món trong giỏ</p>}
            {cart.map((item) => (
              <div key={item.cartKey || item.id} style={{display: 'flex', alignItems: 'center', marginBottom: 12}}>
                <img src={item.img} alt={item.name} style={{width: 48, height: 48, borderRadius: 8, marginRight: 12}} />
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 700, fontSize: 15}}>{item.name}</div>
                  <div style={{color: '#FF7A21', fontWeight: 700, fontSize: 13}}>{formatCurrency(item.price)}</div>
                  {item.itemType === 'Buffet' && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span>Suất Người Lớn (trên 1m3): {formatCurrency(item.price)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => updateQty(item.cartKey || String(item.id), -1)} style={{width: 20, height: 20, borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 14, cursor: 'pointer'}}>-</button>
                          <span style={{ minWidth: 10, textAlign: 'center', fontWeight: 700 }}>{Number(item.quantity || 0)}</span>
                          <button onClick={() => updateQty(item.cartKey || String(item.id), 1)} style={{width: 20, height: 20, borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 14, cursor: 'pointer'}}>+</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                        <span>Suất Trẻ Em (1m - 1m3): {formatCurrency(Number(item.childrenPrice || 0))}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => updateBuffetChildQty(item.cartKey || String(item.id), -1)} style={{width: 20, height: 20, borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 14, cursor: 'pointer'}}>-</button>
                        <span style={{ minWidth: 10, textAlign: 'center', fontWeight: 700 }}>{Number(item.quantityBufferChildent || 0)}</span>
                        <button onClick={() => updateBuffetChildQty(item.cartKey || String(item.id), 1)} style={{width: 20, height: 20, borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 14, cursor: 'pointer'}}>+</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {item.itemType !== 'Buffet' && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    <button onClick={() => updateQty(item.cartKey || String(item.id), -1)} style={{width: 24, height: 24, borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 16, cursor: 'pointer'}}>-</button>
                    <span style={{fontWeight: 700, fontSize: 15}}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.cartKey || String(item.id), 1)} style={{width: 24, height: 24, borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 16, cursor: 'pointer'}}>+</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Tổng kết */}
          <div style={{borderTop: '1px dashed #eee', paddingTop: 16, marginBottom: 12}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#888', marginBottom: 6}}>
              <span>Tạm tính</span>
              <span style={{fontWeight: 700, color: '#222'}}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10}}>
              <span style={{fontWeight: 800, fontSize: 18}}>Tổng cộng</span>
              <span style={{fontWeight: 900, fontSize: 28, color: '#FF7A21'}}>{formatCurrency(total)}</span>
            </div>
          </div>
          {cart.length > 0 ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                style={{
                  width: '100%',
                  background: '#fff',
                  color: '#FF7A21',
                  border: '2px solid #FF7A21',
                  borderRadius: 10,
                  padding: '14px 0',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: isPlacingOrder ? 0.8 : 1,
                }}
              >
                {isPlacingOrder ? "ĐANG GỬI..." : "XÁC NHẬN THÊM MÓN"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {showOrderedItemsModal ? (
        <div
          onClick={() => setShowOrderedItemsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '82vh',
              overflow: 'auto',
              background: '#fff',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#111827' }}>Món đã order</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>
                  {tableLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderedItemsModal(false)}
                style={{ border: 'none', background: '#f3f4f6', borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>

            {orderedItemsLoading ? (
              <p style={{ color: '#6b7280' }}>Đang tải danh sách món...</p>
            ) : null}
            {!orderedItemsLoading && orderedItemsError ? (
              <p style={{ color: '#b91c1c' }}>⚠ {orderedItemsError}</p>
            ) : null}
            {!orderedItemsLoading && !orderedItemsError && orderedItems.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Chưa có món nào được order cho bàn này.</p>
            ) : null}

            {!orderedItemsLoading && !orderedItemsError && orderedItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orderedItems.map((item) => {
                  const st = getDishStatusMeta(item.dishStatus);
                  const lineQty = getOrderedItemQuantity(item);
                  const lineAmount = getOrderedItemLineAmount(item);
                  return (
                    <div
                      key={`ordered-${item.cartKey || item.id}`}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{item.name}</div>
                        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 2 }}>
                          Số lượng: {lineQty}
                        </div>
                        <div style={{ color: '#f97316', fontSize: 13, fontWeight: 800 }}>
                          Thành tiền: {formatCurrency(lineAmount)}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: 12,
                          color: st.color,
                          background: st.bg,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!orderedItemsLoading && !orderedItemsError && orderedItems.length > 0 ? (
              <div
                style={{
                  marginTop: 12,
                  borderTop: '1px dashed #e5e7eb',
                  paddingTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ color: '#374151', fontWeight: 700 }}>
                  Tổng số món: {orderedItemsSummary.totalQty}
                </div>
                <div style={{ color: '#ea580c', fontWeight: 900, fontSize: 18 }}>
                  Tổng tiền: {formatCurrency(orderedItemsSummary.totalAmount)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GuesQRorder;
