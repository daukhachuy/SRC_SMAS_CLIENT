import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, User, ShoppingCart } from 'lucide-react';
import { getFoodByFilter, resolveFoodImageUrl } from '../api/foodApi';
import { createPaymentLink } from '../api/paymentService';
import '../styles/MenuPage.css';

const CATEGORY_CHIPS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'appetizer', label: 'Khai vị' },
  { key: 'main', label: 'Món chính' },
  { key: 'drink', label: 'Đồ uống' },
  { key: 'dessert', label: 'Tráng miệng' },
];

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


// Trang đặt món theo QR cho khách (Guest QR Order) - style đồng bộ hệ thống
const GuesQRorder = () => {
  const [searchParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [foodsError, setFoodsError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);

  const formatCurrency = (value) =>
    `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  useEffect(() => {
    const loadFoods = async () => {
      setLoadingFoods(true);
      setFoodsError('');
      try {
        const rows = await getFoodByFilter(new URLSearchParams());
        const mapped = (Array.isArray(rows) ? rows : []).map((item, idx) => {
          const id = item.foodId || item.id || idx + 1;
          const foodName = item.foodName || item.name || `Món ${id}`;
          const rawPrice = Number(item.price ?? item.unitPrice ?? item.amount ?? 0);
          const categoryRaw = String(item.categoryName || item.foodCategoryName || item.category || '').trim();
          const categoryKey = categoryRaw
            ? normalizeCategoryKey(categoryRaw)
            : inferCategoryKeyFromName(foodName);
          const category = categoryRaw || categoryLabelByKey[categoryKey] || 'Món chính';
          return {
            id,
            name: foodName,
            price: Number.isFinite(rawPrice) ? rawPrice : 0,
            img: resolveFoodImageUrl(item.image || item.imageUrl || item.thumbnail),
            desc: item.description || item.note || 'Món ăn đặc sắc của nhà hàng.',
            category,
            categoryKey,
            tag: item.isBestSeller || item.isChefChoice ? `CHEF'S CHOICE` : '',
          };
        });
        setFoods(mapped);
      } catch (err) {
        setFoodsError(err?.response?.data?.message || err?.message || 'Không tải được danh sách món ăn');
        setFoods([]);
      } finally {
        setLoadingFoods(false);
      }
    };

    loadFoods();
  }, []);

  const filteredFoods = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return foods.filter((food) => {
      const byCategory = activeCategory === 'all' || food.categoryKey === activeCategory;
      const bySearch =
        !keyword ||
        food.name.toLowerCase().includes(keyword) ||
        food.desc.toLowerCase().includes(keyword);
      return byCategory && bySearch;
    });
  }, [foods, activeCategory, searchText]);

  const addToCart = (food) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === food.id);
      if (found) {
        return prev.map((item) =>
          item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const updateQty = (foodId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === foodId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  const tableCode = searchParams.get('tableCode') || localStorage.getItem('tableCode') || '04';
  const tableLabel = String(tableCode).toUpperCase().startsWith('BÀN')
    ? String(tableCode)
    : `Bàn ${tableCode}`;

  const handlePayment = async () => {
    const orderId = Number(searchParams.get('orderId') || sessionStorage.getItem('pendingOrderId') || 0);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      alert('Chưa có orderId để thanh toán. Vui lòng tạo đơn trước.');
      return;
    }

    try {
      setIsRedirectingPayment(true);
      const res = await createPaymentLink({
        orderId,
        returnUrl: `${window.location.origin}/payment-result?success=true&orderId=${orderId}`,
        cancelUrl: `${window.location.origin}/payment-result?success=false&orderId=${orderId}`,
      });
      const checkoutUrl = res?.data?.checkoutUrl;
      if (res?.data?.success && checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      alert(res?.data?.message || 'Không tạo được link thanh toán');
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi kết nối API thanh toán');
    } finally {
      setIsRedirectingPayment(false);
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
          Lumiere Bistro
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button style={{ border: 'none', background: 'transparent', color: '#ff7a21', fontWeight: 800, cursor: 'pointer', borderBottom: '2px solid #ff7a21', paddingBottom: 2 }}>
            Food
          </button>
          <button style={{ border: 'none', background: 'transparent', color: '#4b5563', fontWeight: 700, cursor: 'pointer' }}>
            Combo
          </button>
          <button style={{ border: 'none', background: 'transparent', color: '#4b5563', fontWeight: 700, cursor: 'pointer' }}>
            Buffet
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: '#f3f4f6', fontWeight: 800 }}>
            <ShoppingCart size={14} /> {tableLabel}
          </div>
          <Bell size={18} color="#374151" />
          <User size={18} color="#374151" />
        </div>
      </div>

      <div className="menu-page-container" style={{display: 'flex', gap: 32, paddingTop: 24}}>
        {/* Cột trái: Danh sách món ăn */}
        <div style={{flex: 2}}>
          <h1 className="menu-title" style={{fontSize: 36, fontWeight: 800, marginBottom: 8}}>Món lẻ (Food)</h1>
          <p className="menu-desc" style={{color: '#6d7680', marginBottom: 24}}>Khám phá tinh hoa ẩm thực Pháp giữa lòng Sài Gòn</p>
          <div className="menu-tabs-row" style={{marginBottom: 24}}>
            {CATEGORY_CHIPS.map((cat) => (
              <button
                key={cat.key}
                className={`menu-tab-btn ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
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
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24}}>
            {filteredFoods.map((food) => (
              <div key={food.id} className="menu-card" style={{background: '#fff', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', padding: 16, position: 'relative'}}>
                {food.tag && <div style={{position: 'absolute', top: 12, left: 12, background: '#FF7A21', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px', zIndex: 2}}>{food.tag}</div>}
                <img src={food.img} alt={food.name} style={{width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 12}} />
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                  <span style={{fontWeight: 700, fontSize: 16}}>{food.name}</span>
                  <span style={{color: '#FF7A21', fontWeight: 700}}>{formatCurrency(food.price)}</span>
                </div>
                <div style={{color: '#666', fontSize: 13, marginBottom: 12}}>{food.desc}</div>
                <button
                  onClick={() => addToCart(food)}
                  style={{width: '100%', background: '#FF7A21', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8}}
                >
                  + Thêm vào giỏ
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Cột phải: Sidebar giỏ hàng */}
        <div style={{flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: 24, minWidth: 340, maxWidth: 380, height: 'fit-content'}}>
          <div style={{fontWeight: 800, fontSize: 20, marginBottom: 8}}>Đơn hàng của bạn</div>
          <div style={{color: '#888', fontSize: 13, marginBottom: 18}}>{tableLabel} • Lumiere Bistro</div>
          <div style={{marginBottom: 18}}>
            {cart.length === 0 && <p style={{ color: '#94a3b8' }}>Chưa có món trong giỏ</p>}
            {cart.map((item) => (
              <div key={item.id} style={{display: 'flex', alignItems: 'center', marginBottom: 12}}>
                <img src={item.img} alt={item.name} style={{width: 48, height: 48, borderRadius: 8, marginRight: 12}} />
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 700, fontSize: 15}}>{item.name}</div>
                  <div style={{color: '#FF7A21', fontWeight: 700, fontSize: 13}}>{formatCurrency(item.price)}</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                  <button onClick={() => updateQty(item.id, -1)} style={{width: 24, height: 24, borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 16, cursor: 'pointer'}}>-</button>
                  <span style={{fontWeight: 700, fontSize: 15}}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{width: 24, height: 24, borderRadius: 6, border: '1px solid #eee', background: '#fff', color: '#FF7A21', fontWeight: 700, fontSize: 16, cursor: 'pointer'}}>+</button>
                </div>
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
          <div style={{display: 'flex', gap: 10}}>
            <button style={{flex: 1, background: '#fff', color: '#FF7A21', border: '2px solid #FF7A21', borderRadius: 10, padding: '14px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}>
              <span style={{fontSize: 20}}>🛎️</span> GỌI NHÂN VIÊN
            </button>
            <button
              onClick={handlePayment}
              disabled={isRedirectingPayment}
              style={{flex: 1, background: '#FF7A21', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isRedirectingPayment ? 0.8 : 1}}
            >
              <span style={{fontSize: 20}}>🧾</span> {isRedirectingPayment ? 'ĐANG CHUYỂN...' : 'THANH TOÁN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuesQRorder;
