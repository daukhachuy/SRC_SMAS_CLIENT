import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Services.css';
import { ChevronLeft, ChevronRight, CalendarClock, CalendarDays, Clock, User, Phone, Mail, UtensilsCrossed, FileText, ChevronDown, List, Check, ShieldCheck, Headphones, Utensils, Bell, Star, Sparkles, AlertTriangle, CircleCheck } from 'lucide-react';
import { getProfile } from '../api/userApi';
import { createReservation } from '../api/homeApi';
import { eventBookingAPI, serviceAPI, EVENT_TYPES_LIST } from '../api/managerApi';
import { eventsAPI } from '../api/eventsApi';
import { getComboLists, getFoodByFilter, getAllFoods } from '../api/foodApi';
import { getAllCategories } from '../api/categoryApi';
import { mapFoodDtoToMenuOption, reconcileMenuItemsWithApiCategories } from '../utils/menuFoodFromApi';
import { isAuthenticated } from '../api/authApi';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AddDishModal from '../components/AddDishModal';
import FoodListModal from '../components/FoodListModal';
import ComboListModal from '../components/ComboListModal';
import { ORDER_VAT_RATE } from '../constants/orderPricing';

/** Tháng lịch hiển thị T2–CN: trả về mảng (null ô trống | Date). month: 0–11 */
function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const dow = first.getDay();
  const startPad = dow === 0 ? 6 : dow - 1;
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= last.getDate(); d += 1) {
    cells.push(new Date(year, month, d));
  }
  return cells;
}


const MENU_OPTIONS_FALLBACK = [
  { type: 'Menu', id: -9001, foodId: -9001, name: 'Súp bào ngư vây cá', price: 500000, categoryLabel: 'Khai vị' },
  { type: 'Menu', id: -9002, foodId: -9002, name: 'Cá điều hồng hấp', price: 150000, categoryLabel: 'Món chính' },
  { type: 'Menu', id: -9003, foodId: -9003, name: 'Tôm sú hấp', price: 180000, categoryLabel: 'Món chính' },
  { type: 'Menu', id: -9004, foodId: -9004, name: 'Mực nướng', price: 200000, categoryLabel: 'Món chính' },
  { type: 'Menu', id: -9005, foodId: -9005, name: 'Chè tổ yến hạt sen', price: 300000, categoryLabel: 'Tráng miệng' }
];
const COMBO_OPTIONS_FALLBACK = [
  { type: 'Combo', id: -9101, comboId: -9101, name: 'Combo FPT', price: 150000, categoryLabel: 'Món chính' },
  { type: 'Combo', id: -9102, comboId: -9102, name: 'Combo VIP', price: 250000, categoryLabel: 'Món chính' },
  { type: 'Combo', id: -9103, comboId: -9103, name: 'Combo Family', price: 350000, categoryLabel: 'Món chính' }
];

const Services = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Reset selectedTime khi đổi ngày
  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate]);

  // Lấy 7 ngày tiếp theo từ hôm nay (không hiển thị ngày quá khứ)
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const [serviceCarouselIndex, setServiceCarouselIndex] = useState(0);
  const [addOnCarouselIndex, setAddOnCarouselIndex] = useState(0);
  const [bookingTab, setBookingTab] = useState('booking'); // 'booking' or 'event'
  const [eventStep, setEventStep] = useState(1); // 1: Info, 2: Services, 3: Menu
  const [eventForm, setEventForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    numTables: '1',
    note: ''
  });
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    numGuests: '1',
    location: 'Trong nhà (Máy lạnh)',
    note: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingErrorField, setBookingErrorField] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(''); // tên hiển thị
  const [selectedEventId, setSelectedEventId] = useState(0); // id gửi API (backend cần eventId)
  const [selectedEventSession, setSelectedEventSession] = useState(''); // buổi: morning | evening
  const [selectedEventTime, setSelectedEventTime] = useState(''); // giờ tổ chức HH:mm
  const [eventStepError, setEventStepError] = useState(''); // lỗi validation step 1
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicePricingModal, setServicePricingModal] = useState({
    open: false,
    service: null,
    selectedHours: 1,
  });
  const [menuDishes, setMenuDishes] = useState([]);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [showAllServicesModal, setShowAllServicesModal] = useState(false);
  const [newDishForm, setNewDishForm] = useState({
    type: 'Menu',
    name: '',
    menuQuantity: 1,
    comboQuantity: 1,
    notes: '',
    price: 0,
    categoryLabel: 'Món chính'
  });
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);
  const [hasConfirmedTerms, setHasConfirmedTerms] = useState(false);
  const eventSubmitRef = useRef(false); // chống double-submit (React StrictMode)
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');

  const clampNumberInput = (value, min, max) => {
    if (value === '') return '';
    const numeric = Number.parseInt(value, 10);
    if (!Number.isFinite(numeric)) return String(min);
    if (numeric < min) return String(min);
    if (numeric > max) return String(max);
    return String(numeric);
  };

  const bookingAlertRef = useRef(null);
  const bookingTimeGridRef = useRef(null);
  const bookingFullNameRef = useRef(null);
  const bookingPhoneRef = useRef(null);
  const bookingGuestsRef = useRef(null);
  const eventTypeChipsRef = useRef(null);
  const eventTimeGridRef = useRef(null);
  const eventTablesRef = useRef(null);
  const eventFullNameRef = useRef(null);
  const eventPhoneRef = useRef(null);
  const eventStepErrorAlertRef = useRef(null);
  const eventErrorAlertRef = useRef(null);

  // ===== STATE CHO 3 MODAL THÊM MÓN =====
  const [showAddDishModal, setShowAddDishModal] = useState(false);  // Modal A: THÊM MÓN
  const [showFoodListModal, setShowFoodListModal] = useState(false);  // Modal B: DANH SÁCH MÓN ĂN
  const [showComboListModal, setShowComboListModal] = useState(false); // Modal C: DANH SÁCH GÓI COMBO
  const [addDishNotes, setAddDishNotes] = useState(''); // Ghi chú trong modal THÊM MÓN

  // API-loaded menu & combo options
  const [apiMenuOptions, setApiMenuOptions] = useState([]);
  const [apiComboOptions, setApiComboOptions] = useState([]);
  const [menuCategoriesFromApi, setMenuCategoriesFromApi] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // API-loaded event services (Bước 2: Sự kiện & Dịch vụ)
  const [eventServicesFromApi, setEventServicesFromApi] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // GET /api/events — carousel "ĐẦY ĐỦ CÁC SỰ KIỆN" (title, description, image)
  const [showcaseEventsFromApi, setShowcaseEventsFromApi] = useState([]);
  const [isLoadingShowcaseEvents, setIsLoadingShowcaseEvents] = useState(false);

  useEffect(() => {
    // Services page is now public - anyone can view
  }, []);

  // Danh mục thực đơn (cùng API với trang /menu) — tab lọc modal đồng bộ với category lists + categoryId
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAllCategories();
        let categoryData = [];
        if (Array.isArray(res)) categoryData = res;
        else if (Array.isArray(res?.$values)) categoryData = res.$values;
        else if (Array.isArray(res?.data)) categoryData = res.data;
        else if (Array.isArray(res?.data?.$values)) categoryData = res.data.$values;
        if (!cancelled) setMenuCategoriesFromApi(categoryData);
      } catch {
        if (!cancelled) setMenuCategoriesFromApi([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load menu items (food) and combos from API
  useEffect(() => {
    const loadMenuData = async () => {
      setIsLoadingMenu(true);
      try {
        const [comboRes, foodRes] = await Promise.allSettled([
          getComboLists(),
          getFoodByFilter({})
        ]);

        const comboList = comboRes.status === 'fulfilled' ? (Array.isArray(comboRes.value) ? comboRes.value : comboRes.value?.$values || []) : [];
        let foodList = foodRes.status === 'fulfilled' ? foodRes.value : [];
        if (!Array.isArray(foodList)) foodList = [];
        if (foodList.length === 0) {
          try {
            foodList = await getAllFoods();
            if (!Array.isArray(foodList)) foodList = [];
          } catch (e) {
            console.warn('[Services] getAllFoods fallback:', e?.message || e);
          }
        }

        const mappedCombos = comboList.map(c => ({
          type: 'Combo',
          id: c.comboId ?? c.id ?? 0,
          comboId: c.comboId ?? c.id ?? 0,
          name: c.comboName || c.name || '',
          price: c.comboPrice || c.price || 0,
          categoryLabel: 'Món chính'
        }));

        const mappedFoods = foodList.map((f) => mapFoodDtoToMenuOption(f));

        setApiComboOptions(mappedCombos);
        setApiMenuOptions(mappedFoods);
      } catch (err) {
        console.warn('[Services] Failed to load menu/combo from API:', err);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    loadMenuData();
  }, []);

  useEffect(() => {
    setAddOnCarouselIndex((i) => {
      const max = Math.max(0, eventServicesFromApi.length - 3);
      return Math.min(i, max);
    });
  }, [eventServicesFromApi.length]);

  useEffect(() => {
    setServiceCarouselIndex((i) => {
      const max = Math.max(0, showcaseEventsFromApi.length - 4);
      return Math.min(i, max);
    });
  }, [showcaseEventsFromApi.length]);

  useEffect(() => {
    const loadShowcaseEvents = async () => {
      setIsLoadingShowcaseEvents(true);
      try {
        const list = await eventsAPI.getEvents();
        const apiUrl = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';
        const imageBase = apiUrl.replace(/\/api\/?$/, '') || window.location.origin;
        const mapped = (Array.isArray(list) ? list : [])
          .filter((e) => e.isActive !== false)
          .map((e) => {
            const rawId = e.eventId ?? e.EventId ?? e.id ?? e.Id;
            const numId = Number(rawId);
            return {
            id: Number.isFinite(numId) && numId > 0 ? numId : rawId,
            title: e.title || '',
            description: e.description || '',
            isActive: e.isActive,
            image: e.image
              ? (e.image.startsWith('http') ? e.image : imageBase + (e.image.startsWith('/') ? e.image : `/${e.image}`))
              : 'https://images.unsplash.com/photo-1519671482677-76ce3692eb04?auto=format&fit=crop&q=80&w=400',
          };
          });
        setShowcaseEventsFromApi(mapped);
      } catch (err) {
        console.warn('[Services] Failed to load events for showcase:', err);
        setShowcaseEventsFromApi([]);
      } finally {
        setIsLoadingShowcaseEvents(false);
      }
    };
    loadShowcaseEvents();
  }, []);

  // Load danh sách dịch vụ từ GET /api/services (Bước 2: Sự kiện & Dịch vụ)
  useEffect(() => {
    const loadServices = async () => {
      setIsLoadingServices(true);
      try {
        const res = await serviceAPI.getServices();
        const body = res?.data ?? {};
        const list = Array.isArray(body.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];
        const apiUrl = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';
        const imageBase = apiUrl.replace(/\/api\/?$/, '') || window.location.origin;
        const mapped = list
          .filter((s) => s.isAvailable !== false)
          .map((s) => ({
            id: s.serviceId ?? s.id,
            title: s.title || '',
            name: s.title || '',
            price: s.servicePrice ?? 0,
            description: s.description || '',
            unit: s.unit || '',
            image: s.image
              ? (s.image.startsWith('http') ? s.image : imageBase + (s.image.startsWith('/') ? s.image : `/${s.image}`))
              : 'https://images.unsplash.com/photo-1519671482677-76ce3692eb04?auto=format&fit=crop&q=80&w=200',
          }));
        setEventServicesFromApi(mapped);
      } catch (err) {
        console.warn('[Services] Failed to load services from API:', err);
        setEventServicesFromApi([]);
      } finally {
        setIsLoadingServices(false);
      }
    };
    loadServices();
  }, []);

  // Lấy dữ liệu profile người dùng khi component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated()) {
        return;
      }

      try {
        console.log('📡 Đang gọi getProfile API...');
        const profile = await getProfile();
        console.log('✅ Profile API response:', profile);
        
        // Điền dữ liệu từ API vào form
        if (profile) {
          const userData = {
            fullName: profile.fullname || '',
            phone: profile.phone || '',
            email: profile.email || ''
          };
          
          console.log('📝 userData để fill form:', userData);
          
          // Cập nhật eventForm
          setEventForm(prev => ({
            ...prev,
            ...userData
          }));
          
          // Cập nhật bookingForm
          setBookingForm(prev => ({
            ...prev,
            ...userData
          }));
        } else {
          console.log('⚠️ Profile response empty');
        }
      } catch (error) {
        console.error('❌ Lỗi khi lấy profile:', error);
        console.log('ℹ️ User chưa đăng nhập hoặc API error - để trống form');
      }
    };
    
    // Gọi API ngay khi component mount
    fetchUserProfile();
  }, []);

  // ===== HELPER FUNCTIONS FOR BOOKING =====
  
  // Lấy 14 ngày tiếp theo từ hôm nay

  // Kiểm tra ngày có thể chọn được không (không được chọn ngày trong quá khứ)
  const isDateSelectable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // Lấy các giờ có sẵn (Nhà hàng mở 09:00 - 22:00, nhận booking đến 21:00)
  // - Từ giờ hiện tại + 1 tiếng
  // - Trước 21:00 (kết thúc phục vụ 22:00 = 1 tiếng chuẩn bị đóng)
  const getAvailableTimes = (selectedDateParam) => {
    const now = new Date();
    const times = [];
    const openingHour = 9;
    
    // Kiểm tra nếu ngày được chọn là hôm nay
    const isToday = selectedDateParam.toDateString() === now.toDateString();
    
    // Bắt đầu từ 09:00
    let startHour = 9;
    let startMinute = 0;
    
    if (isToday) {
      // Nếu là hôm nay, bắt đầu từ giờ hiện tại + 1 tiếng
      let minEarliestTime = new Date(now);
      minEarliestTime.setHours(minEarliestTime.getHours() + 1, 0, 0);
      startHour = minEarliestTime.getHours();
      startMinute = minEarliestTime.getMinutes();

      // Không cho đặt trước giờ mở cửa.
      if (startHour < openingHour) {
        startHour = openingHour;
        startMinute = 0;
      }
    }
    
    // Kết thúc trước 21:00 (Nhà hàng nhận booking đến 21:00)
    const endHour = 21;
    const endMinute = 0;
    
    // Generate thời gian mỗi 30 phút
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip nếu là thời gian đầu ngày và chưa đến startMinute
        if (hour === startHour && minute < startMinute) {
          continue;
        }
        
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        times.push(timeStr);
      }
    }
    
    return times;
  };

  // Kiểm tra giờ có thể chọn được không
  const isTimeSelectable = (time, selectedDateParam) => {
    const now = new Date();
    const isToday = selectedDateParam.toDateString() === now.toDateString();
    const [hours, minutes] = time.split(':').map(Number);

    // Không cho chọn giờ ngoài khung mở cửa.
    if (hours < 9 || (hours > 21 || (hours === 21 && minutes > 0))) {
      return false;
    }
    
    if (!isToday) {
      return true; // Có thể chọn bất kỳ giờ nào ngoài hôm nay
    }
    
    // Hôm nay: chỉ có thể chọn giờ từ hiện tại + 1 tiếng
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0);
    
    let minAllowedTime = new Date(now);
    minAllowedTime.setHours(minAllowedTime.getHours() + 1, 0, 0);
    
    return timeDate >= minAllowedTime;
  };

  const formatReservationDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const scrollToTarget = (targetRef, shouldFocus = false) => {
    const el = targetRef?.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (shouldFocus && typeof el.focus === 'function') {
      window.setTimeout(() => {
        el.focus({ preventScroll: true });
      }, 180);
    }
  };

  const validateBookingForm = () => {
    if (!bookingForm.fullName.trim()) {
      return { field: 'fullName', message: 'Vui lòng nhập họ và tên.' };
    }

    if (!bookingForm.phone.trim()) {
      return { field: 'phone', message: 'Vui lòng nhập số điện thoại.' };
    }

    if (!selectedTime) {
      return { field: 'time', message: 'Vui lòng chọn giờ đặt bàn.' };
    }

    const guests = Number(bookingForm.numGuests);
    if (!guests || guests < 1 || guests > 29) {
      return { field: 'numGuests', message: 'Số lượng khách hợp lệ từ 1 đến 29.' };
    }

    return null;
  };

  const handleBookingSubmit = async () => {
    setBookingError('');
    setBookingSuccess('');
    setBookingErrorField('');

    const validationError = validateBookingForm();
    if (validationError) {
      setBookingError(validationError.message);
      setBookingErrorField(validationError.field);
      return;
    }

    const requestPayload = {
      reservationDate: formatReservationDate(selectedDate),
      reservationTime: `${selectedTime}:00`,
      numberOfGuests: Number(bookingForm.numGuests),
      specialRequests: `Khu vuc: ${bookingForm.location}. Ghi chu: ${bookingForm.note || 'Khong co'}`
    };

    try {
      setIsBookingSubmitting(true);
      await createReservation(requestPayload);
      setBookingSuccess('Đặt bàn thành công. Nhà hàng sẽ liên hệ xác nhận sớm nhất.');
      setBookingForm((prev) => ({
        ...prev,
        numGuests: '1',
        note: ''
      }));
      setSelectedTime('');
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        setBookingError('Bạn cần đăng nhập để đặt bàn. Vui lòng đăng nhập và thử lại.');
      } else {
        const message = error?.response?.data?.message || error?.message || 'Không thể tạo đặt bàn. Vui lòng thử lại.';
        setBookingError(message);
      }
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  useEffect(() => {
    if (!bookingError) return;
    const fieldToRef = {
      fullName: bookingFullNameRef,
      phone: bookingPhoneRef,
      time: bookingTimeGridRef,
      numGuests: bookingGuestsRef,
    };
    const targetRef = fieldToRef[bookingErrorField] || bookingAlertRef;
    const shouldFocus = targetRef !== bookingTimeGridRef;
    scrollToTarget(targetRef, shouldFocus);
  }, [bookingError, bookingErrorField]);

  useEffect(() => {
    if (eventStep !== 1 || !eventStepError) return;
    const lower = String(eventStepError).toLowerCase();
    if (eventStepError === 'eventId') {
      scrollToTarget(eventTypeChipsRef);
      return;
    }
    if (eventStepError === 'time') {
      scrollToTarget(eventTimeGridRef);
      return;
    }
    if (eventStepError === 'fullName') {
      scrollToTarget(eventFullNameRef, true);
      return;
    }
    if (eventStepError === 'phone') {
      scrollToTarget(eventPhoneRef, true);
      return;
    }
    if (lower.includes('số lượng bàn')) {
      scrollToTarget(eventTablesRef, true);
      return;
    }
    scrollToTarget(eventStepErrorAlertRef);
  }, [eventStep, eventStepError]);

  useEffect(() => {
    if (eventStep === 4 && eventError) {
      scrollToTarget(eventErrorAlertRef);
    }
  }, [eventError, eventStep]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('step') === '4') {
      setBookingTab('event');
      setEventStep(4);
    }
  }, [location.search]);

  useEffect(() => {
    if (eventStep !== 4) setHasConfirmedTerms(false);
  }, [eventStep]);

  const menuOptions = useMemo(() => {
    const raw = [
      ...apiMenuOptions,
      ...apiComboOptions,
      ...(apiMenuOptions.length === 0 ? MENU_OPTIONS_FALLBACK : []),
      ...(apiComboOptions.length === 0 ? COMBO_OPTIONS_FALLBACK : [])
    ];
    return reconcileMenuItemsWithApiCategories(raw, menuCategoriesFromApi);
  }, [apiMenuOptions, apiComboOptions, menuCategoriesFromApi]);



  // ===== XỬ LÝ 3 MODAL THÊM MÓN =====
  
  // Tính tổng tiền từ danh sách món đã chọn
  const addDishTotalPrice = menuDishes.reduce((sum, dish) => sum + dish.subtotal, 0);

  // Mở Modal A (THÊM MÓN)
  const handleOpenAddDishModal = () => {
    setShowAddDishModal(true);
  };

  // Mở Modal B (DANH SÁCH MÓN ĂN) từ Modal A
  const handleOpenFoodList = () => {
    setShowAddDishModal(false);
    setTimeout(() => setShowFoodListModal(true), 100);
  };

  // Mở Modal C (DANH SÁCH GÓI COMBO) từ Modal A
  const handleOpenComboList = () => {
    setShowAddDishModal(false);
    setTimeout(() => setShowComboListModal(true), 100);
  };

  // Quay lại Modal A từ Modal B hoặc Modal C
  const handleBackToAddDish = () => {
    setShowFoodListModal(false);
    setShowComboListModal(false);
    setShowAddDishModal(true);
  };

  // Đóng tất cả Modal
  const handleCloseAllModals = () => {
    setShowAddDishModal(false);
    setShowFoodListModal(false);
    setShowComboListModal(false);
    setAddDishNotes('');
  };

  // Thêm món vào danh sách (từ Modal B hoặc Modal C)
  const handleAddDishFromModal = (newDish) => {
    // Kiểm tra xem món đã tồn tại chưa
    const existingIndex = menuDishes.findIndex(d => (d.foodId || d.id) === (newDish.foodId || newDish.id));
    
    if (existingIndex >= 0) {
      // Tăng số lượng nếu đã tồn tại
      const updated = [...menuDishes];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1,
        subtotal: (updated[existingIndex].quantity + 1) * updated[existingIndex].price
      };
      setMenuDishes(updated);
    } else {
      // Thêm món mới
      setMenuDishes([...menuDishes, newDish]);
    }
  };

  // Xóa món khỏi danh sách (từ Modal B hoặc Modal C)
  const handleRemoveDishFromModal = (dishId) => {
    setMenuDishes(menuDishes.filter(d => (d.foodId || d.id) !== dishId));
  };

  // Cập nhật số lượng món (từ Modal A)
  const handleUpdateDishQuantity = (dishId, newQuantity) => {
    const updated = menuDishes.map(d => {
      if ((d.foodId || d.id) === dishId) {
        return {
          ...d,
          quantity: newQuantity,
          subtotal: newQuantity * d.price
        };
      }
      return d;
    });
    setMenuDishes(updated);
  };

  // Xóa món (từ Modal A)
  const handleRemoveDish = (dishId) => {
    setMenuDishes(menuDishes.filter(d => (d.foodId || d.id) !== dishId));
  };

  // Xác nhận đơn hàng từ Modal A
  const handleConfirmDishOrder = () => {
    handleCloseAllModals();
    // TODO: Xử lý logic xác nhận đơn hàng ở đây nếu cần
  };

  // Event Types - từ GET /api/events, chỉ lấy isActive === true
  const eventTypes = showcaseEventsFromApi
    .filter((e) => e.isActive !== false)
    .map((e) => {
      const rawId = e.id ?? e.eventId ?? e.EventId;
      const numId = Number(rawId);
      const id = Number.isFinite(numId) && numId > 0 ? numId : 0;
      return {
      id,
      name: String(e.title || '').trim().toLowerCase() === 'hội nghị - hội thảo'
        ? 'Tiệc kỷ niệm'
        : (e.title || ''),
    };
    })
    .filter((e) => e.id > 0);

  const eventSessionOptions = [
    { id: 'morning', label: 'Sáng', icon: '🌅' },
    { id: 'evening', label: 'Tối', icon: '🌙' },
  ];

  const eventSessionTimeMap = {
    morning: ['08:00', '09:00', '10:00', '11:00'],
    evening: ['17:00', '18:00', '19:00', '20:00'],
  };

  const eventTimeSlots = eventSessionTimeMap[selectedEventSession] || [];

  // Dịch vụ sự kiện: ưu tiên từ API GET /api/services, không có thì dùng fallback
  // Cả API lẫn fallback đều lọc isAvailable !== false
  const fallbackEventServices = [
    { id: 1, name: 'MC Tố Châu', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', description: 'MC tổ chức có chuyên môn cao, dẫn dắt sự kiện chuyên nghiệp', price: 100000, unit: 'Giờ', isAvailable: true },
    { id: 2, name: 'MC Minh Hạ', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', description: 'MC nổi tiếng với phong cách dẫn dắt hài hước và cuốn hút', price: 100000, unit: 'Giờ', isAvailable: true },
    { id: 3, name: 'Backdrop Tiêu Chuẩn', image: 'https://images.unsplash.com/photo-1519671482677-76ce3692eb04?auto=format&fit=crop&q=80&w=200', description: 'Backdrop trang trí cơ bản với các mẫu tiêu chuẩn', price: 2000000, unit: 'Buổi', isAvailable: true },
    { id: 4, name: 'Backdrop VIP', image: 'https://images.unsplash.com/photo-1537904904737-13fc2b3560a1?auto=format&fit=crop&q=80&w=200', description: 'Backdrop cao cấp với thiết kế riêng, trang trí sang trọng', price: 5000000, unit: 'Buổi', isAvailable: true },
    { id: 5, name: 'Âm thanh & Âm nhạc', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=200', description: 'Hệ thống âm thanh chuyên nghiệp, DJ live để làm nóng không khí', price: 3000000, unit: 'Buổi', isAvailable: true },
    { id: 6, name: 'Chụp Ảnh & Video', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=200', description: 'Chụp ảnh và quay phim chuyên nghiệp suốt sự kiện', price: 2500000, unit: 'Giờ', isAvailable: true },
    { id: 7, name: 'Lighting LED', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=200', description: 'Hệ thống đèn LED hiện đại tạo không khí sôi động', price: 2000000, unit: 'Buổi', isAvailable: true },
    { id: 8, name: 'Hoa trang trí', image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&q=80&w=200', description: 'Hoa tươi và trang trí hoa cao cấp cho sự kiện', price: 1500000, unit: 'Buổi', isAvailable: true },
  ];

  // Ghép: API đã lọc isAvailable ở load time, fallback cũng đã có isAvailable = true
  // Dùng .filter ở đây để đảm bảo an toàn nếu sau này backend trả thêm
  const eventServices = (eventServicesFromApi.length > 0 ? eventServicesFromApi : fallbackEventServices)
    .filter((s) => s.isAvailable !== false);

  const getServiceSelection = (serviceId) =>
    selectedServices.find((item) => Number(item?.serviceId) === Number(serviceId)) || null;

  const isServiceSelected = (serviceId) => Boolean(getServiceSelection(serviceId));

  const normalizeServiceUnit = (unitValue) => {
    const normalized = String(unitValue || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return normalized.includes('gio') ? 'hourly' : 'session';
  };

  const getServiceUnitMeta = (service) => {
    const mode = normalizeServiceUnit(service?.unit);
    return mode === 'hourly'
      ? { mode: 'hourly', label: 'Theo giờ', unitLabel: '/ giờ' }
      : { mode: 'session', label: 'Theo buổi', unitLabel: '/ buổi' };
  };

  const isHourlyService = (service) => getServiceUnitMeta(service).mode === 'hourly';

  const buildServiceSelection = (service, selectedHours = 1) => {
    const unitMeta = getServiceUnitMeta(service);
    const basePrice = Number(service?.price) || 0;
    const hours = unitMeta.mode === 'hourly' ? Math.max(1, Number(selectedHours) || 1) : 1;
    const quantity = unitMeta.mode === 'hourly' ? hours : 1;
    const totalPrice = basePrice * quantity;
    const hoursText = unitMeta.mode === 'hourly' ? ` - ${hours} giờ` : '';
    return {
      serviceId: service.id,
      serviceName: service.name || service.title || 'Dịch vụ',
      pricingMode: unitMeta.mode,
      pricingModeLabel: unitMeta.label,
      pricingUnitLabel: unitMeta.unitLabel,
      baseUnitPrice: basePrice,
      hours,
      quantity,
      unitPrice: totalPrice,
      note: `${unitMeta.label}${unitMeta.unitLabel}${hoursText} - ${totalPrice} VND`,
    };
  };

  const upsertServiceSelection = (selection) => {
    if (!selection?.serviceId) return;
    setSelectedServices((prev) => {
      const next = prev.filter((item) => Number(item?.serviceId) !== Number(selection.serviceId));
      return [...next, selection];
    });
  };

  const removeServiceSelection = (serviceId) => {
    setSelectedServices((prev) => prev.filter((item) => Number(item?.serviceId) !== Number(serviceId)));
  };

  const openServicePricingPicker = (service) => {
    const currentSelection = getServiceSelection(service?.id);
    const defaultHours = Math.max(1, Number(currentSelection?.hours) || 1);
    setServicePricingModal({
      open: true,
      service,
      selectedHours: defaultHours,
    });
  };

  const closeServicePricingPicker = () => {
    setServicePricingModal({
      open: false,
      service: null,
      selectedHours: 1,
    });
  };

  const handleConfirmServiceSelection = () => {
    const service = servicePricingModal.service;
    if (!service?.id) return closeServicePricingPicker();
    upsertServiceSelection(buildServiceSelection(service, servicePricingModal.selectedHours));
    closeServicePricingPicker();
  };

  const handleServiceCardClick = (service) => {
    if (!service?.id) return;
    if (isServiceSelected(service.id)) {
      removeServiceSelection(service.id);
      return;
    }
    if (isHourlyService(service)) {
      openServicePricingPicker(service);
      return;
    }
    upsertServiceSelection(buildServiceSelection(service, 1));
  };

  // Validate Step 1 trước khi chuyển bước
  const handleNextStep = () => {
    setEventStepError('');

    // 1) Chọn loại sự kiện
    const nextStepEventId = Number(selectedEventId);
    if (!Number.isFinite(nextStepEventId) || nextStepEventId < 1) {
      setEventStepError('eventId');
      return;
    }
    // 2) Chọn giờ
    if (!selectedEventTime) {
      setEventStepError('time');
      return;
    }
    // 3) Số bàn
    const tables = parseInt(eventForm.numTables, 10);
    if (!tables || tables < 1) {
      setEventStepError('Vui lòng nhập số lượng bàn (≥1).');
      return;
    }
    if (tables > 30) {
      setEventStepError('Số lượng bàn tối đa là 30.');
      return;
    }
    // 4) Họ tên
    if (!eventForm.fullName || !eventForm.fullName.trim()) {
      setEventStepError('fullName');
      return;
    }
    // 5) SĐT
    if (!eventForm.phone || !eventForm.phone.trim()) {
      setEventStepError('phone');
      return;
    }

    setEventStepError('');
    setEventStep(2);
  };

  // Calculate total service cost
  const calculateServiceTotal = () => {
    return selectedServices.reduce((total, item) => {
      return total + (Number(item?.unitPrice) || 0);
    }, 0);
  };

  const handleEventSubmit = async () => {
    console.log('[handleEventSubmit] Called. isEventSubmitting:', isEventSubmitting);

    if (!isAuthenticated()) {
      console.log('[handleEventSubmit] NOT authenticated → show auth required');
      setShowAuthRequired(true);
      return;
    }

    console.log('[handleEventSubmit] Authenticated ✅');

    if (!selectedDate) {
      setEventError('Vui lòng chọn ngày tổ chức sự kiện.');
      return;
    }

    const eventIdNum = Number(selectedEventId);
    if (!Number.isFinite(eventIdNum) || eventIdNum < 1) {
      setEventError('Vui lòng chọn loại sự kiện.');
      setEventStep(1);
      return;
    }

    const numTables = parseInt(eventForm.numTables, 10);
    if (!numTables || numTables < 1) {
      setEventError('Số lượng bàn phải lớn hơn 0.');
      return;
    }
    if (numTables > 30) {
      setEventError('Số lượng bàn tối đa là 30.');
      return;
    }

    setIsEventSubmitting(true);
    setEventError('');
    setEventSuccess('');

    // Guard chống double-submit (React StrictMode gọi 2 lần)
    if (eventSubmitRef.current) {
      setIsEventSubmitting(false);
      return;
    }
    eventSubmitRef.current = true;

    try {
      // reservationTime: format "time" = HH:mm:ss
      const timeStr = selectedEventTime || '00:00';
      const reservationTime = timeStr.includes(':') && timeStr.split(':').length === 2
        ? `${timeStr}:00`
        : timeStr;

      const foodItems = menuDishes
        .map(dish => ({
          foodId: dish.foodId ?? dish.id ?? 0,
          quantity: Number(dish.quantity) || 1,
          note: dish.notes || ''
        }))
        .filter(f => f.foodId > 0);

      const menuPerTable = menuDishes.reduce((sum, dish) => sum + (Number(dish.subtotal) || 0), 0);
      const menuFee = menuPerTable * numTables;
      const servicesFee = selectedServices.reduce((t, item) => t + (Number(item?.unitPrice) || 0), 0);
      // Tổng lưu CSDL = sau VAT (tạm tính × 1.1). Một số BE chỉ đọc `payment.*` / `EstimatedBudget` / `GrandTotal`.
      const amountBase = menuFee + servicesFee;
      const totalToPersist = Math.round(amountBase * (1 + ORDER_VAT_RATE));

      const moneyTotals = {
        totalAmount: totalToPersist,
        TotalAmount: totalToPersist,
        total: totalToPersist,
        Total: totalToPersist,
        grandTotal: totalToPersist,
        GrandTotal: totalToPersist,
        estimatedBudget: totalToPersist,
        EstimatedBudget: totalToPersist,
        estimatedRevenue: totalToPersist,
        EstimatedRevenue: totalToPersist,
      };

      const payload = {
        numberOfGuests: numTables,
        reservationDate: formatReservationDate(selectedDate),
        reservationTime,
        note: eventForm.note || '',
        area: 'Trong nhà (Máy lạnh)',
        eventId: eventIdNum,
        services: selectedServices.map((item) => ({
          serviceId: item.serviceId,
          quantity: Number(item.quantity) || 1,
          note: item.note || ''
        })),
        foods: foodItems,
        ...moneyTotals,
        payment: { ...moneyTotals },
        Payment: { ...moneyTotals },
      };

      console.log('[Event] book-event/create — tạm tính:', amountBase, '| sau VAT (mọi alias):', totalToPersist);
      const response = await eventBookingAPI.create(payload);
      console.log('[Event] Success:', response?.data);
      setEventSuccess(
        'Yêu cầu của bạn đã được ghi nhận. Đội ngũ nhà hàng sẽ liên hệ trong thời gian sớm nhất để xác nhận chi tiết, thực đơn và thanh toán (nếu có).'
      );
      setEventStep(5);
    } catch (err) {
      console.error('[Event] Submit error:', err);
      const status = err?.response?.status;
      if (status === 401) {
        setEventError('Vui lòng đăng nhập để tiếp tục.');
        setShowAuthRequired(true);
      } else if (status === 403) {
        setEventError('Bạn không có quyền thực hiện thao tác này.');
      } else {
        setEventError(err?.response?.data?.message || err?.message || 'Đặt sự kiện thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsEventSubmitting(false);
      eventSubmitRef.current = false;
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const tablesInput = Number.parseInt(eventForm.numTables, 10);
  const tableCount = Number.isFinite(tablesInput) && tablesInput > 0 ? tablesInput : 0;
  const menuPerTableAmount = menuDishes.reduce((sum, dish) => sum + (Number(dish.subtotal) || 0), 0);
  const menuFeeAmount = menuPerTableAmount * tableCount;
  const servicesFeeAmount = calculateServiceTotal();
  const eventSubtotalBeforeVat = menuFeeAmount + servicesFeeAmount;
  const eventGrandTotal = Math.round(eventSubtotalBeforeVat * (1 + ORDER_VAT_RATE));
  const eventVatAmount = eventGrandTotal - eventSubtotalBeforeVat;

  // FAQ Data
  const faqItems = [
    {
      id: 1,
      question: 'Nhà hàng có nhận đặt tiệc tại nhà không?',
      answer: 'Có. Chúng tôi cung cấp dịch vụ catering trọn gói tại nhà, bao gồm thực đơn, nhân sự phục vụ và set up theo yêu cầu.'
    },
    {
      id: 2,
      question: 'Tôi cần đặt bàn/sự kiện trước bao lâu?',
      answer: 'Bạn nên đặt trước từ 1-3 ngày với bàn lẻ và 5-7 ngày với sự kiện để nhà hàng chuẩn bị tốt nhất.'
    },
    {
      id: 3,
      question: 'Nhà hàng có hỗ trợ trang trí sự kiện không?',
      answer: 'Có. Chúng tôi hỗ trợ trang trí theo concept sinh nhật, tiệc công ty, hội nghị và các yêu cầu cá nhân hóa khác.'
    },
    {
      id: 4,
      question: 'Có thể thay đổi thực đơn theo ngân sách không?',
      answer: 'Hoàn toàn được. Đội ngũ tư vấn sẽ đề xuất thực đơn phù hợp theo số lượng khách và mức ngân sách của bạn.'
    },
    {
      id: 5,
      question: 'Chính sách đặt cọc cho sự kiện như thế nào?',
      answer: 'Với các đơn sự kiện, nhà hàng áp dụng đặt cọc theo hợp đồng. Tỷ lệ và thời hạn thanh toán sẽ hiển thị rõ khi xác nhận.'
    },
    {
      id: 6,
      question: 'Tôi có thể hủy hoặc dời lịch đặt sự kiện không?',
      answer: 'Có. Bạn có thể liên hệ sớm với nhà hàng để được hỗ trợ dời lịch hoặc hủy theo chính sách trong hợp đồng.'
    }
  ];

  // Online delivery options
  const deliveryOptions = [
    { id: 1, title: 'Giao nhanh', subtitle: '30 phút', image: '/images/ShipFast.png' },
    { id: 2, title: 'Tươi ngon', subtitle: 'đảm bảo', image: '/images/Food.png' },
    { id: 3, title: 'Thanh toán', subtitle: 'tiện lợi', image: '/images/Pay.png' }
  ];

  return (
    <div className="services-page-wrapper">
      <Header />

      <section className="services-hero-banner">
        <div className="hero-content">
          <span className="hero-tag">DỊCH VỤ ĐẲNG CẤP</span>
          <h1>TINH HOA ẨM THỰC - PHỤC VỤ ĐẲNG CẤP</h1>
          <p className="hero-desc">Nơi hội tụ những bữa tiệc đáng nhớ</p>
        </div>
      </section>

      <div className="services-main-content">
        
        {/* SECTION 1: ĐẶT BÀN & ĐẶT SỰ KIỆN */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẶT BÀN TRẢI NGHIỆM TẠI CHỖ</h2>
          
          {/* TABS */}
          <div className="booking-tabs">
            <button 
              className={`tab-button ${bookingTab === 'booking' ? 'active' : ''}`}
              onClick={() => setBookingTab('booking')}
            >
              Đặt Bàn
            </button>
            <button 
              className={`tab-button ${bookingTab === 'event' ? 'active' : ''}`}
              onClick={() => setBookingTab('event')}
            >
              Đặt Sự Kiện
            </button>
          </div>

          {/* BOOKING FORM */}
          {bookingTab === 'booking' && (
            <div className="glass-card booking-container">
              <div className="booking-left">
                <div className="calendar-ui">
                  <div className="calendar-month">
                    <span style={{ textTransform: 'capitalize' }}>
                      Tháng {String(selectedDate.getMonth() + 1).padStart(2, '0')} {selectedDate.getFullYear()}
                    </span>
                  </div>
                  <div className="calendar-numbers">
                    {getNext7Days().map((date, idx) => {
                      const day = date.getDate();
                      const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                      const dayOfWeek = date.getDay();
                      const weekday = weekdayLabels[dayOfWeek];
                      const today = new Date();
                      const isToday = date.toDateString() === today.toDateString();
                      const isSelectable = isDateSelectable(date);
                      const isSelected = date.toDateString() === selectedDate.toDateString();
                      return (
                        <span
                          key={idx}
                          onClick={() => isSelectable && setSelectedDate(date)}
                          className={`calendar-day-block ${isToday ? 'today' : ''} ${isSelected ? 'day-active' : ''} ${!isSelectable ? 'day-disabled' : ''} ${isSelectable ? 'day-selectable' : ''}`}
                          style={{
                            cursor: isSelectable ? 'pointer' : 'not-allowed',
                            opacity: isSelectable ? 1 : 0.35,
                          }}
                        >
                          <div className="calendar-weekday">{weekday}</div>
                          <div className="calendar-day-number">{day}</div>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="time-grid" ref={bookingTimeGridRef}>
                  {getAvailableTimes(selectedDate).map((time) => {
                    const isSelectable = isTimeSelectable(time, selectedDate);
                    const isSelected = time === selectedTime;
                    
                    return (
                      <button 
                        key={time} 
                        className={`time-slot-btn ${isSelected ? 'active' : ''} ${!isSelectable ? 'disabled' : ''}`}
                        onClick={() => isSelectable && setSelectedTime(time)}
                        disabled={!isSelectable}
                        style={{
                          opacity: isSelectable ? 1 : 0.4,
                          cursor: isSelectable ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="vertical-divider"></div>
              <div className="booking-right">
                <div className="input-group-row">
                  <label>Họ và tên:</label>
                  <input 
                    type="text" 
                    placeholder="" 
                    value={bookingForm.fullName}
                    ref={bookingFullNameRef}
                    className={bookingErrorField === 'fullName' ? 'input-invalid' : ''}
                    onChange={(e) => setBookingForm({...bookingForm, fullName: e.target.value})}
                  />
                </div>
                <div className="input-group-row">
                  <label>Số điện thoại:</label>
                  <input 
                    type="text" 
                    placeholder="" 
                    value={bookingForm.phone}
                    ref={bookingPhoneRef}
                    className={bookingErrorField === 'phone' ? 'input-invalid' : ''}
                    onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                  />
                </div>
                <div className="input-group-row">
                  <label>Email :</label>
                  <input 
                    type="text" 
                    placeholder="" 
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                  />
                </div>
                <div className="input-group-row">
                  <label>Số lượng khách:</label>
                  <input 
                    type="number" 
                    value={bookingForm.numGuests}
                    ref={bookingGuestsRef}
                    className={bookingErrorField === 'numGuests' ? 'input-invalid' : ''}
                    onChange={(e) => setBookingForm({...bookingForm, numGuests: e.target.value})}
                    placeholder="" 
                  />
                </div>
                <div className="input-group-row">
                  <label>Khu vực:</label>
                  <select
                    value={bookingForm.location}
                    onChange={(e) => setBookingForm({...bookingForm, location: e.target.value})}
                  >
                    <option>Trong nhà (Máy lạnh)</option>
                    <option>Ngoài trời (Sân vườn)</option>
                  </select>
                </div>
                <div className="input-group-row">
                  <label>Ghi chú:</label>
                  <textarea 
                    placeholder="Yêu cầu đặc biệt, ghi chú sự kiên..."
                    value={bookingForm.note}
                    onChange={(e) => setBookingForm({...bookingForm, note: e.target.value})}
                  ></textarea>
                </div>
                {bookingError && (
                  <div className="form-alert form-alert-error" role="alert" aria-live="assertive" ref={bookingAlertRef}>
                    <AlertTriangle size={18} />
                    <span>{bookingError}</span>
                  </div>
                )}
                {bookingSuccess && (
                  <div className="form-alert form-alert-success" role="status" aria-live="polite">
                    <CircleCheck size={18} />
                    <span>{bookingSuccess}</span>
                  </div>
                )}
                <button
                  className="primary-gold-btn"
                  onClick={handleBookingSubmit}
                  disabled={isBookingSubmitting}
                >
                  {isBookingSubmitting ? 'ĐANG GỬI...' : 'ĐẶT BÀN NGAY'}
                </button>
              </div>
            </div>
          )}

          {/* EVENT FORM - Theo thiết kế ảnh */}
          {bookingTab === 'event' && (
            <div className="event-booking-wrap">
              {/* Header bar: icon + title | user */}
              <div className="event-new-header">
                <div className="event-header-left">
                  <div className="event-header-icon">
                    <CalendarClock size={22} strokeWidth={2.2} />
                  </div>
                  <h3 className="event-header-title">Đặt Lịch Sự Kiện</h3>
                </div>
                <div className="event-header-user">
                  <User size={20} />
                </div>
              </div>

              {/* Progress: Bước N + thanh % + nhãn bước (có Thanh toán ở cột trên) */}
              <div className="event-progress-block">
                <div className="event-progress-top">
                  <span className="event-step-caption">
                    {eventStep === 5 ? (
                      <>Hoàn tất — Cảm ơn bạn đã tin tưởng</>
                    ) : (
                      <>Bước {eventStep}: {
                        eventStep === 1 ? 'Chọn Sự Kiện & Thông Tin' :
                        eventStep === 2 ? 'Dịch Vụ Đi Kèm' :
                        eventStep === 3 ? 'Lên Thực Đơn' :
                        'Xác Nhận Đặt Sự Kiện'
                      }</>
                    )}
                  </span>
                  <span className="event-percent">
                    {eventStep >= 5 ? 100 : Math.round((eventStep / 4) * 100)}% Hoàn thành
                  </span>
                </div>
                <div className="event-progress-bar-bg">
                  <div
                    className="event-progress-bar-fill"
                    style={{ width: `${eventStep >= 5 ? 100 : (eventStep / 4) * 100}%` }}
                  />
                </div>
                <div className="event-step-labels">
                  <span className={eventStep >= 1 ? 'active' : ''}>Chọn Sự Kiện</span>
                  <span className={eventStep >= 2 ? 'active' : ''}>Dịch Vụ</span>
                  <span className={eventStep >= 3 ? 'active' : ''}>Thực Đơn</span>
                  <span className={eventStep >= 4 ? 'active' : ''}>Xác Nhận</span>
                </div>
              </div>

              {/* STEP 1: Chọn sự kiện + Ngày giờ + Thông tin khách hàng */}
              {eventStep === 1 && (
                <div className="event-form-step">
                  <div className="event-form-card event-form-card-new">
                    <div className="event-step1-grid">

                      {/* ── CỘT TRÁI: Event + Date/Time + Số bàn ── */}
                      <div className="event-step1-left">
                        <h4 className="event-step1-col-title">
                          <CalendarClock size={18} className="icon-orange" />
                          Thông Tin Sự Kiện
                        </h4>

                        {/* Loại sự kiện */}
                        <div className="event-field-block">
                          <label className="event-field-label">
                            <Star size={14} className="icon-orange" />
                            Loại sự kiện <span className="required-asterisk">*</span>
                          </label>
                          {isLoadingShowcaseEvents ? (
                            <p className="event-field-loading">Đang tải loại sự kiện...</p>
                          ) : eventTypes.length === 0 ? (
                            <p className="event-field-empty">Hiện chưa có loại sự kiện nào.</p>
                          ) : (
                            <div className={`event-type-chips ${eventStepError === 'eventId' ? 'field-invalid' : ''}`} ref={eventTypeChipsRef}>
                              {eventTypes.map((ev) => (
                                <button
                                  key={ev.id}
                                  type="button"
                                  className={`event-type-chip ${selectedEventId === ev.id ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedEventId(ev.id);
                                    setSelectedEvent(ev.name);
                                    setEventStepError('');
                                  }}
                                >
                                  {ev.name}
                                </button>
                              ))}
                            </div>
                          )}
                          {eventStepError === 'eventId' && (
                            <p className="event-field-error">Vui lòng chọn loại sự kiện.</p>
                          )}
                        </div>

                        {/* Ngày tổ chức */}
                        <div className="event-field-block">
                          <label className="event-field-label">
                            <CalendarDays size={14} className="icon-orange" />
                            Ngày tổ chức
                          </label>
                          <div className="calendar-ui event-inline-calendar">
                            <div className="calendar-month">
                              <span style={{ textTransform: 'capitalize' }}>
                                Tháng {String(selectedDate.getMonth() + 1).padStart(2, '0')} {selectedDate.getFullYear()}
                              </span>
                            </div>
                            <div className="calendar-weekdays">
                              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                            </div>
                            <div className="calendar-numbers">
                              {getMonthDays(selectedDate.getFullYear(), selectedDate.getMonth()).map((date, idx) => {
                                if (!date) return <span key={`empty-${idx}`} style={{ display: 'block' }} />;
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const cell = new Date(date);
                                cell.setHours(0, 0, 0, 0);
                                const isToday = date.toDateString() === new Date().toDateString();
                                const isPast = cell < today;
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`day-btn ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isPast ? 'day-past' : ''}`}
                                    onClick={() => !isPast && setSelectedDate(date)}
                                    disabled={isPast}
                                    style={{ cursor: isPast ? 'not-allowed' : 'pointer' }}
                                  >
                                    {date.getDate()}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Giờ tổ chức */}
                        <div className="event-field-block">
                          <label className="event-field-label">
                            <Clock size={14} className="icon-orange" />
                            Giờ tổ chức <span className="required-asterisk">*</span>
                          </label>
                          <div className="event-session-grid">
                            {eventSessionOptions.map((session) => (
                              <button
                                key={session.id}
                                type="button"
                                className={`event-session-btn ${selectedEventSession === session.id ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedEventSession(session.id);
                                  setSelectedEventTime('');
                                  setEventStepError('');
                                }}
                              >
                                <span className="event-session-icon">{session.icon}</span>
                                <span>{session.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className={`time-slots-grid ${eventStepError === 'time' ? 'field-invalid' : ''}`} ref={eventTimeGridRef}>
                            {eventSessionOptions.length > 0 && eventTimeSlots.length === 0 ? (
                              <p className="event-time-helper">Chọn buổi trước để hiển thị giờ phù hợp.</p>
                            ) : null}
                            {eventTimeSlots.map((time) => {
                              const isSelected = selectedEventTime === time;
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  className={`time-slot-btn ${isSelected ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedEventTime(time);
                                    setEventStepError('');
                                  }}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                          {eventStepError === 'time' && (
                            <p className="event-field-error">Vui lòng chọn giờ tổ chức.</p>
                          )}
                        </div>

                        {/* Số bàn */}
                        <div className="event-step1-row-2">
                          <div className="event-field-block">
                            <label className="event-field-label">
                              <UtensilsCrossed size={14} className="icon-orange" />
                              Số bàn <span className="required-asterisk">*</span>
                            </label>
                            <input
                              type="number"
                              className={`event-step1-input ${String(eventStepError).toLowerCase().includes('số lượng bàn') ? 'input-invalid' : ''}`}
                              value={eventForm.numTables}
                              min="1"
                              max="30"
                              ref={eventTablesRef}
                              onChange={(e) => {
                                setEventForm({ ...eventForm, numTables: clampNumberInput(e.target.value, 1, 30) });
                                setEventStepError('');
                              }}
                              placeholder="1 - 30"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── CỘT PHẢI: Thông tin liên hệ ── */}
                      <div className="event-step1-right">
                        <h4 className="event-step1-col-title">
                          <User size={18} className="icon-orange" />
                          Thông Tin Liên Hệ
                        </h4>

                        <div className="event-field-block">
                          <label className="event-field-label">
                            <User size={14} className="icon-orange" />
                            Họ và tên <span className="required-asterisk">*</span>
                          </label>
                          <input
                            type="text"
                            className={`event-step1-input ${eventStepError === 'fullName' ? 'input-invalid' : ''}`}
                            value={eventForm.fullName}
                            ref={eventFullNameRef}
                            onChange={(e) => {
                              setEventForm({ ...eventForm, fullName: e.target.value });
                              setEventStepError('');
                            }}
                            placeholder="Nguyễn Văn A"
                          />
                          {eventStepError === 'fullName' && (
                            <p className="event-field-error">Vui lòng nhập họ và tên.</p>
                          )}
                        </div>

                        <div className="event-field-block">
                          <label className="event-field-label">
                            <Phone size={14} className="icon-orange" />
                            Số điện thoại <span className="required-asterisk">*</span>
                          </label>
                          <input
                            type="text"
                            className={`event-step1-input ${eventStepError === 'phone' ? 'input-invalid' : ''}`}
                            value={eventForm.phone}
                            maxLength={11}
                            ref={eventPhoneRef}
                            onChange={(e) => {
                              setEventForm({ ...eventForm, phone: e.target.value.replace(/\D/g, '') });
                              setEventStepError('');
                            }}
                            placeholder="090x xxx xxx"
                          />
                          {eventStepError === 'phone' && (
                            <p className="event-field-error">Vui lòng nhập số điện thoại.</p>
                          )}
                        </div>

                        <div className="event-field-block">
                          <label className="event-field-label">
                            <Mail size={14} className="icon-orange" />
                            Email
                          </label>
                          <input
                            type="email"
                            className="event-step1-input"
                            value={eventForm.email}
                            onChange={(e) => setEventForm({ ...eventForm, email: e.target.value })}
                            placeholder="example@gmail.com"
                          />
                        </div>

                                                <div className="event-field-block">
                          <label className="event-field-label">
                            <FileText size={14} className="icon-orange" />
                            Ghi chú thêm
                          </label>
                          <textarea
                            className="event-step1-textarea"
                            rows={3}
                            value={eventForm.note}
                            onChange={(e) => setEventForm({ ...eventForm, note: e.target.value })}
                            placeholder="Yêu cầu đặc biệt, trang trí, chương trình..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Lỗi tổng hợp */}
                    {eventStepError && !['eventId', 'time', 'fullName', 'phone', 'tables'].includes(eventStepError) && (
                      <div className="form-alert form-alert-error event-form-error-summary" role="alert" aria-live="assertive" ref={eventStepErrorAlertRef}>
                        <AlertTriangle size={18} />
                        <span>{eventStepError}</span>
                      </div>
                    )}

                    <div className="event-form-card-actions">
                      <button type="button" className="event-btn-secondary" onClick={() => setBookingTab('booking')}>← Đặt Bàn</button>
                      <button type="button" className="event-btn-primary" onClick={handleNextStep}>Tiếp Tục →</button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Sự kiện & Dịch vụ */}
              {eventStep === 2 && (
                <div className="event-form-step">
                  <div className="event-step2-form-card">
                    <div className="event-step2-field">
                      <label className="event-label-asterisk">Chọn loại sự kiện của bạn</label>
                      <select
                        className="event-select-event"
                        value={selectedEventId}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setSelectedEventId(id);
                          const ev = eventTypes.find(x => x.id === id);
                          setSelectedEvent(ev ? ev.name : '');
                        }}
                      >
                        <option value={0}>Chọn loại sự kiện</option>
                        {eventTypes.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="event-step2-services">
                      <div className="event-step2-services-head">
                        <label className="event-label-asterisk">Dịch vụ đi kèm phổ biến</label>
                        <button type="button" className="event-view-all" onClick={() => setShowAllServicesModal(true)}>Xem tất cả</button>
                      </div>
                      <div className="event-service-cards-grid">
                        {isLoadingServices ? (
                          <p className="event-services-loading">Đang tải dịch vụ...</p>
                        ) : (
                        eventServices.slice(0, 6).map(service => (
                          <div
                            key={service.id}
                            className={`event-service-card-v2 ${isServiceSelected(service.id) ? 'selected' : ''}`}
                            onClick={() => handleServiceCardClick(service)}
                          >
                            <div className="event-service-card-v2-img">
                              <img src={service.image} alt={service.name} />
                              {isServiceSelected(service.id) && (
                                <div className="event-service-card-v2-check"><Check size={18} strokeWidth={3} /></div>
                              )}
                            </div>
                            <h5 className="event-service-card-v2-title">{service.name}</h5>
                            <p className="event-service-card-v2-price">
                              {formatCurrency(getServiceSelection(service.id)?.unitPrice ?? service.price).replace('₫', '')} đ
                            </p>
                            {getServiceSelection(service.id)?.pricingModeLabel ? (
                              <p className="event-service-card-v2-option">
                                {getServiceSelection(service.id)?.pricingModeLabel}
                                {getServiceSelection(service.id)?.pricingUnitLabel || ''}
                                {getServiceSelection(service.id)?.pricingMode === 'hourly'
                                  ? ` x${getServiceSelection(service.id)?.hours || 1} giờ`
                                  : ''}
                              </p>
                            ) : null}
                            <p className="event-service-card-v2-desc">{service.description}</p>
                          </div>
                        ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="event-step2-actions">
                    <button type="button" className="event-btn-back" onClick={() => setEventStep(1)}>← Quay lại</button>
                    <button type="button" className="event-btn-primary event-btn-continue" onClick={() => setEventStep(3)}>Tiếp Tục → Lên Thực Đơn</button>
                  </div>
                </div>
              )}

              {/* STEP 3: Lên thực đơn */}
              {eventStep === 3 && (
                <div className="event-form-step">
                  <div className="event-menu-detail-card">
                    <h4 className="event-menu-detail-title">Chi tiết thực đơn đã chọn cho từng bàn</h4>
                    <p className="event-menu-detail-desc">Vui lòng kiểm tra kỹ danh sách món ăn và số lượng trước khi tiếp tục đặt lịch.</p>
                    <div className="event-menu-table-wrap">
                      <table className="event-menu-table">
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Loại</th>
                            <th>Tên món</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Ghi chú</th>
                            <th>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menuDishes.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                {isLoadingMenu ? 'Đang tải thực đơn...' : 'Chưa có món nào. Vui lòng nhấn "Chỉnh sửa thực đơn" để thêm món.'}
                              </td>
                            </tr>
                          ) : menuDishes.map((dish, idx) => (
                            <tr key={dish.id}>
                              <td>{String(idx + 1).padStart(2, '0')}</td>
                              <td><span className={`event-menu-tag tag-${(dish.categoryLabel || dish.type) === 'Khai vị' ? 'orange' : (dish.categoryLabel || dish.type) === 'Món chính' ? 'blue' : 'green'}`}>{dish.categoryLabel || dish.type}</span></td>
                              <td>{dish.name}</td>
                              <td>{dish.quantity}</td>
                              <td>{formatCurrency(dish.price)}</td>
                              <td className="event-menu-notes">{dish.notes || '—'}</td>
                              <td className="event-menu-subtotal"><strong>{formatCurrency(dish.subtotal)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(() => {
                      const subtotal = menuDishes.reduce((s, d) => s + d.subtotal, 0);
                      return (
                        <div className="event-menu-summary">
                          <div className="event-menu-summary-row"><span>Tạm tính:</span><span>{formatCurrency(subtotal)}</span></div>
                          <div className="event-menu-summary-row event-menu-summary-total"><span>TỔNG CỘNG:</span><span>{formatCurrency(subtotal)}</span></div>
                          <div className="event-menu-summary-actions">
                            <button type="button" className="event-btn-edit-menu" onClick={handleOpenAddDishModal}><Utensils size={18} /> Chỉnh sửa thực đơn</button>
                            <button type="button" className="event-btn-book-now" onClick={() => setEventStep(4)}><Check size={18} /> ĐẶT LỊCH NGAY</button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="event-guarantee-cards">
                    <div className="event-guarantee-card">
                      <div className="event-guarantee-icon"><Utensils size={24} /></div>
                      <h5>Chất lượng cao</h5>
                      <p>Nguyên liệu tươi sạch được tuyển chọn mỗi ngày.</p>
                    </div>
                    <div className="event-guarantee-card">
                      <div className="event-guarantee-icon"><Headphones size={24} /></div>
                      <h5>Hỗ trợ 24/7</h5>
                      <p>Đội ngũ tư vấn sẵn sàng giải đáp mọi thắc mắc.</p>
                    </div>
                    <div className="event-guarantee-card">
                      <div className="event-guarantee-icon"><ShieldCheck size={24} /></div>
                      <h5>Đảm bảo an toàn</h5>
                      <p>Chứng nhận an toàn thực phẩm tiêu chuẩn quốc tế</p>
                    </div>
                  </div>

                  <button type="button" className="event-btn-back event-btn-back-step3" onClick={() => setEventStep(2)}>← Quay lại</button>
                </div>
              )}

              {/* STEP 4: Xác nhận — chỉ tóm tắt chi phí */}
              {eventStep === 4 && (
                <div className="event-form-step event-payment-step">
                  <div className="event-payment-outer-card">
                    <div className="event-payment-columns">
                      <div className="event-payment-card event-payment-summary">
                        <h4 className="event-payment-card-title"><List size={18} className="icon-orange" /> Phí món ăn</h4>
                        <div className="event-payment-line">
                          <span>Thực đơn 1 bàn</span>
                          <span>{formatCurrency(menuPerTableAmount)}</span>
                        </div>
                        <div className="event-payment-line">
                          <span>Số bàn đã đặt</span>
                          <span>{tableCount}</span>
                        </div>
                        <div className="event-payment-total-row">
                          <span>Thành tiền món ăn</span>
                          <span className="event-payment-total-amount">{formatCurrency(menuFeeAmount)}</span>
                        </div>
                      </div>

                      <div className="event-payment-card event-payment-methods">
                        <h4 className="event-payment-card-title"><List size={18} className="icon-orange" /> Phí các dịch vụ</h4>
                        <div className="event-payment-line">
                          <span>Số dịch vụ đã chọn</span>
                          <span>{selectedServices.length}</span>
                        </div>
                        <div className="event-payment-total-row">
                          <span>Thành tiền dịch vụ</span>
                          <span className="event-payment-total-amount">{formatCurrency(servicesFeeAmount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="event-payment-grand-summary">
                      <div className="event-payment-grand-total-row event-payment-grand-subline">
                        <span>Tạm tính</span>
                        <span>{formatCurrency(eventSubtotalBeforeVat)}</span>
                      </div>
                      <div className="event-payment-grand-total-row event-payment-grand-subline">
                        <span>VAT (10%)</span>
                        <span>{formatCurrency(eventVatAmount)}</span>
                      </div>
                      <div className="event-payment-grand-total-row event-payment-grand-final">
                        <span>Tổng cộng</span>
                        <span className="event-payment-total-amount">{formatCurrency(eventGrandTotal)}</span>
                      </div>
                    </div>

                    <p className="event-payment-terms">
                      Vui lòng đọc và xác nhận <a href="/services/terms" target="_blank" rel="noreferrer">Điều khoản dịch vụ</a>{' '}
                      trước khi đặt sự kiện.
                    </p>
                    <label className={`event-terms-checkbox ${hasConfirmedTerms ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={hasConfirmedTerms}
                        onChange={(e) => setHasConfirmedTerms(e.target.checked)}
                      />
                      <span>Tôi đã đọc và đồng ý với Điều khoản dịch vụ</span>
                    </label>
                    {!hasConfirmedTerms && (
                      <p className="event-payment-terms-hint">
                        Cần tick vào ô xác nhận để tiếp tục.
                      </p>
                    )}
                    <button
                      type="button"
                      className="event-btn-confirm-payment"
                      onClick={handleEventSubmit}
                      disabled={isEventSubmitting || !hasConfirmedTerms}
                    >
                      {isEventSubmitting ? 'ĐANG XỬ LÝ...' : 'Xác nhận đặt sự kiện'}
                    </button>
                    {eventError && (
                      <div className="form-alert form-alert-error" role="alert" aria-live="assertive" style={{ marginTop: 8 }} ref={eventErrorAlertRef}>
                        <AlertTriangle size={18} />
                        <span>{eventError}</span>
                      </div>
                    )}
                    <button type="button" className="event-btn-back event-btn-back-payment-link" onClick={() => setEventStep(3)}>← Quay lại</button>
                  </div>
                </div>
              )}

              {/* STEP 5: Thông báo thành công */}
              {eventStep === 5 && (
                <div className="event-form-step event-success-step">
                  <div className="event-success-card event-success-card-premium">
                    <div className="event-success-glow" aria-hidden />
                    <div className="event-success-badge">
                      <Sparkles size={20} strokeWidth={2.2} />
                      <span>Thành công</span>
                    </div>
                    <div className="event-success-icon event-success-icon-animated">
                      <Check size={44} strokeWidth={2.8} />
                    </div>
                    <h2>Đặt sự kiện thành công</h2>
                    <p className="event-success-lead">
                      {eventSuccess || 'Cảm ơn bạn đã đặt sự kiện. Nhân viên của chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận chi tiết.'}
                    </p>
                    <div className="event-success-hint">
                      <ShieldCheck size={18} />
                      <span>Thông tin đã được lưu an toàn. Bạn có thể xem trạng thái trong mục Đơn hàng / Sự kiện.</span>
                    </div>
                    <div className="event-success-actions">
                      <button type="button" className="event-btn-primary" onClick={() => { setEventStep(1); setEventSuccess(''); }}>Đặt sự kiện mới</button>
                      <div className="event-success-actions-row">
                        <button type="button" className="event-btn-secondary" onClick={() => navigate('/my-orders')}>Xem đơn của tôi</button>
                        <button type="button" className="event-btn-secondary event-success-btn-ghost" onClick={() => navigate('/')}>Về trang chủ</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Thêm Món */}
              {isEditingMenu && (
                <div className="event-add-dish-modal-overlay" onClick={() => setIsEditingMenu(false)}>
                  <div className="event-add-dish-modal" onClick={e => e.stopPropagation()}>
                    <div className="event-add-dish-modal-header">
                      <h4><Utensils size={22} className="icon-orange" /> Thêm Món {isLoadingMenu && '(Đang tải...)'}</h4>
                      <button type="button" className="event-modal-close" onClick={() => setIsEditingMenu(false)} aria-label="Đóng">×</button>
                    </div>
                    <div className="event-add-dish-body">
                      <div className="event-add-dish-section">
                        <label>THỰC ĐƠN THEO NGÀY</label>
                        <div className="event-add-dish-row">
                          <select
                            value={newDishForm.type === 'Menu' ? newDishForm.name : ''}
                            onChange={(e) => {
                              const opt = menuOptions.find(o => o.type === 'Menu' && o.name === e.target.value);
                              if (opt) setNewDishForm({ ...newDishForm, type: 'Menu', name: opt.name, price: opt.price, categoryLabel: opt.categoryLabel });
                            }}
                          >
                            <option value="">Chọn Thực Đơn</option>
                            {menuOptions.filter(o => o.type === 'Menu').map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
                          </select>
                          <div className="event-qty-selector">
                            <button type="button" onClick={() => setNewDishForm({ ...newDishForm, menuQuantity: Math.max(1, newDishForm.menuQuantity - 1) })}>−</button>
                            <span>{newDishForm.menuQuantity}</span>
                            <button type="button" onClick={() => setNewDishForm({ ...newDishForm, menuQuantity: newDishForm.menuQuantity + 1 })}>+</button>
                          </div>
                        </div>
                      </div>
                      <div className="event-add-dish-section">
                        <label>GÓI COMBO</label>
                        <div className="event-add-dish-row">
                          <select
                            value={newDishForm.type === 'Combo' ? newDishForm.name : ''}
                            onChange={(e) => {
                              const opt = menuOptions.find(o => o.type === 'Combo' && o.name === e.target.value);
                              if (opt) setNewDishForm({ ...newDishForm, type: 'Combo', name: opt.name, price: opt.price, categoryLabel: opt.categoryLabel });
                            }}
                          >
                            <option value="">Chọn Gói Combo</option>
                            {menuOptions.filter(o => o.type === 'Combo').map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
                          </select>
                          <div className="event-qty-selector">
                            <button type="button" onClick={() => setNewDishForm({ ...newDishForm, comboQuantity: Math.max(1, newDishForm.comboQuantity - 1) })}>−</button>
                            <span>{newDishForm.comboQuantity}</span>
                            <button type="button" onClick={() => setNewDishForm({ ...newDishForm, comboQuantity: newDishForm.comboQuantity + 1 })}>+</button>
                          </div>
                        </div>
                      </div>
                      <div className="event-add-dish-section">
                        <label>GHI CHÚ THÊM</label>
                        <input type="text" value={newDishForm.notes} onChange={(e) => setNewDishForm({ ...newDishForm, notes: e.target.value })} placeholder="Ví dụ: Không hành, ít cay..." />
                      </div>
                      <button
                        type="button"
                        className="event-btn-add-dish"
                        onClick={() => {
                          if (!newDishForm.name) return;
                          const opt = menuOptions.find(o => o.name === newDishForm.name);
                          const price = opt ? opt.price : newDishForm.price;
                          const categoryLabel = opt ? opt.categoryLabel : (newDishForm.categoryLabel || 'Món chính');
                          const foodId = opt?.foodId ?? opt?.id ?? opt?.comboId ?? 0;
                          const selectedQuantity = newDishForm.type === 'Combo'
                            ? Math.max(1, Number(newDishForm.comboQuantity) || 1)
                            : Math.max(1, Number(newDishForm.menuQuantity) || 1);
                          const newDish = {
                            id: foodId || (menuDishes.length ? Math.max(...menuDishes.map(d => d.id)) + 1 : 1),
                            foodId: foodId || (opt ? 0 : (menuDishes.length ? Math.max(...menuDishes.map(d => d.id)) + 1 : 1)),
                            type: newDishForm.type,
                            name: newDishForm.name,
                            quantity: selectedQuantity,
                            price,
                            notes: newDishForm.notes,
                            subtotal: selectedQuantity * price,
                            categoryLabel
                          };
                          setMenuDishes([...menuDishes, newDish]);
                          setNewDishForm({ type: 'Menu', name: '', menuQuantity: 1, comboQuantity: 1, notes: '', price: 0, categoryLabel: 'Món chính' });
                        }}
                      >
                        Thêm vào danh sách
                      </button>
                      <div className="event-add-dish-selected">
                        <h4><List size={18} className="icon-orange" /> Danh sách đã chọn</h4>
                        <span className="event-add-dish-count">{menuDishes.length} Món</span>
                        <div className="event-add-dish-list">
                          {menuDishes.map(d => (
                            <div key={d.id} className="event-add-dish-item">
                              <div className="event-add-dish-item-info">
                                <strong>{d.name}</strong>
                                <span>Số lượng: {String(d.quantity).padStart(2, '0')}</span>
                              </div>
                              <button type="button" className="event-add-dish-remove" onClick={() => setMenuDishes(menuDishes.filter(x => x.id !== d.id))}>🗑</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="event-add-dish-footer">
                      <span>Tổng cộng tạm tính:</span>
                      <strong>{formatCurrency(menuDishes.reduce((s, d) => s + d.subtotal, 0))}</strong>
                    </div>
                    <button
                      type="button"
                      className="event-btn-complete-menu"
                      onClick={() => setIsEditingMenu(false)}
                    >
                      <Check size={18} /> Hoàn Thành Thực Đơn
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Xem tất cả dịch vụ */}
              {showAllServicesModal && (
                <div className="event-all-services-modal-overlay" onClick={() => setShowAllServicesModal(false)}>
                  <div className="event-all-services-modal" onClick={e => e.stopPropagation()}>
                    <div className="event-all-services-modal-header">
                      <h4>Dịch vụ đi kèm phổ biến</h4>
                      <button type="button" className="event-modal-close" onClick={() => setShowAllServicesModal(false)} aria-label="Đóng">×</button>
                    </div>
                    <div className="event-all-services-modal-body">
                      <div className="event-service-cards-grid event-all-services-grid">
                        {eventServices.map(service => (
                          <div
                            key={service.id}
                            className={`event-service-card-v2 ${isServiceSelected(service.id) ? 'selected' : ''}`}
                            onClick={() => handleServiceCardClick(service)}
                          >
                            <div className="event-service-card-v2-img">
                              <img src={service.image} alt={service.name} />
                              {isServiceSelected(service.id) && (
                                <div className="event-service-card-v2-check"><Check size={18} strokeWidth={3} /></div>
                              )}
                            </div>
                            <h5 className="event-service-card-v2-title">{service.name}</h5>
                            <p className="event-service-card-v2-price">
                              {formatCurrency(getServiceSelection(service.id)?.unitPrice ?? service.price).replace('₫', '')} đ
                            </p>
                            {getServiceSelection(service.id)?.pricingModeLabel ? (
                              <p className="event-service-card-v2-option">
                                {getServiceSelection(service.id)?.pricingModeLabel}
                                {getServiceSelection(service.id)?.pricingUnitLabel || ''}
                                {getServiceSelection(service.id)?.pricingMode === 'hourly'
                                  ? ` x${getServiceSelection(service.id)?.hours || 1} giờ`
                                  : ''}
                              </p>
                            ) : null}
                            <p className="event-service-card-v2-desc">{service.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="event-all-services-modal-footer">
                      <span>Đã chọn {selectedServices.length} dịch vụ</span>
                      <button type="button" className="event-btn-primary" onClick={() => setShowAllServicesModal(false)}>Đóng</button>
                    </div>
                  </div>
                </div>
              )}

              {servicePricingModal.open && servicePricingModal.service && (
                <div className="event-all-services-modal-overlay" onClick={closeServicePricingPicker}>
                  <div className="event-service-pricing-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="event-all-services-modal-header">
                      <h4>Thiết lập dịch vụ {servicePricingModal.service.name}</h4>
                      <button type="button" className="event-modal-close" onClick={closeServicePricingPicker} aria-label="Đóng">×</button>
                    </div>
                    <div className="event-all-services-modal-body">
                      <div className="event-service-pricing-options">
                        <div className="event-service-pricing-option active">
                          <div>
                            <div className="event-service-pricing-option-title">
                              {getServiceUnitMeta(servicePricingModal.service).label}
                              {getServiceUnitMeta(servicePricingModal.service).unitLabel}
                            </div>
                            <div className="event-service-pricing-option-note">
                              Đơn giá từ backend: {formatCurrency(servicePricingModal.service.price).replace('₫', '')} đ
                            </div>
                            {isHourlyService(servicePricingModal.service) ? (
                              <div className="event-service-pricing-hours-wrap">
                                <span className="event-service-pricing-hours-label">Số giờ:</span>
                                <div className="event-service-pricing-hours-control">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setServicePricingModal((prev) => ({
                                        ...prev,
                                        selectedHours: Math.max(1, (Number(prev.selectedHours) || 1) - 1),
                                      }))
                                    }
                                  >
                                    -
                                  </button>
                                  <span>{Math.max(1, Number(servicePricingModal.selectedHours) || 1)}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setServicePricingModal((prev) => ({
                                        ...prev,
                                        selectedHours: Math.min(24, (Number(prev.selectedHours) || 1) + 1),
                                      }))
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div className="event-service-pricing-option-price">
                            {formatCurrency(
                              isHourlyService(servicePricingModal.service)
                                ? (Number(servicePricingModal.service.price) || 0) * Math.max(1, Number(servicePricingModal.selectedHours) || 1)
                                : Number(servicePricingModal.service.price) || 0
                            ).replace('₫', '')} đ
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="event-all-services-modal-footer">
                      <span>
                        {isHourlyService(servicePricingModal.service)
                          ? 'Dịch vụ tính theo giờ: tổng tiền = đơn giá x số giờ.'
                          : 'Dịch vụ tính theo buổi: lấy đúng giá backend.'}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isServiceSelected(servicePricingModal.service.id) ? (
                          <button
                            type="button"
                            className="event-btn-back"
                            onClick={() => {
                              removeServiceSelection(servicePricingModal.service.id);
                              closeServicePricingPicker();
                            }}
                          >
                            Bỏ chọn
                          </button>
                        ) : null}
                        <button type="button" className="event-btn-primary" onClick={handleConfirmServiceSelection}>
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 2: FAQ */}
        <section className="service-card-section">
          <h2 className="service-title-gold">NHỮNG CÂU HỎI PHỔ BIẾN NHẤT</h2>
          <div className="faq-grid">
            {faqItems.map((item, idx) => (
              <div key={item.id} className="faq-item">
                <div className="faq-icon">?</div>
                <p className="faq-question">{item.question}</p>
                <p className="faq-answer">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: EVENTS CAROUSEL — GET /api/events (title, description, image) */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẦY ĐỦ CÁC SỰ KIỆN</h2>
          {isLoadingShowcaseEvents ? (
            <p className="services-addon-loading">Đang tải sự kiện...</p>
          ) : showcaseEventsFromApi.length === 0 ? (
            <p className="services-addon-empty">Hiện chưa có sự kiện để hiển thị.</p>
          ) : (
            <div className="carousel-container">
              <button
                type="button"
                className="carousel-nav prev"
                onClick={() => setServiceCarouselIndex(Math.max(0, serviceCarouselIndex - 1))}
                disabled={serviceCarouselIndex <= 0}
              >
                <ChevronLeft size={24} />
              </button>
              <div className="carousel-content">
                {showcaseEventsFromApi.slice(serviceCarouselIndex, serviceCarouselIndex + 4).map((item) => (
                  <div key={item.id} className="carousel-item">
                    <img src={item.image} alt={item.title} />
                    <h4>{item.title}</h4>
                    <p className="carousel-item-desc">{item.description}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="carousel-nav next"
                onClick={() =>
                  setServiceCarouselIndex(
                    Math.min(Math.max(0, showcaseEventsFromApi.length - 4), serviceCarouselIndex + 1)
                  )
                }
                disabled={serviceCarouselIndex >= Math.max(0, showcaseEventsFromApi.length - 4)}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </section>

        {/* SECTION 4: ADD-ON SERVICES — GET /api/services (title, description, image) */}
        <section className="service-card-section">
          <h2 className="service-title-gold">DỊCH VỤ KÈM THEO</h2>
          {isLoadingServices ? (
            <p className="services-addon-loading">Đang tải dịch vụ...</p>
          ) : eventServicesFromApi.length === 0 ? (
            <p className="services-addon-empty">Hiện chưa có dịch vụ kèm theo.</p>
          ) : (
            <div className="addon-carousel-container">
              <button
                type="button"
                className="addon-carousel-nav prev"
                onClick={() => setAddOnCarouselIndex(Math.max(0, addOnCarouselIndex - 1))}
                disabled={addOnCarouselIndex <= 0}
              >
                <ChevronLeft size={32} />
              </button>
              <div className="addon-carousel-content">
                {eventServicesFromApi.slice(addOnCarouselIndex, addOnCarouselIndex + 3).map((item) => (
                  <div key={item.id} className="addon-item-card">
                    <div className="addon-item-image">
                      <img src={item.image} alt={item.title || item.name || ''} />
                    </div>
                    <div className="addon-item-info">
                      <h4 className="addon-item-name">{item.title || item.name}</h4>
                      <p className="addon-item-description">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="addon-carousel-nav next"
                onClick={() =>
                  setAddOnCarouselIndex(Math.min(Math.max(0, eventServicesFromApi.length - 3), addOnCarouselIndex + 1))
                }
                disabled={addOnCarouselIndex >= Math.max(0, eventServicesFromApi.length - 3)}
              >
                <ChevronRight size={32} />
              </button>
            </div>
          )}
        </section>

        {/* SECTION 5: ONLINE DELIVERY */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẶT HÀNG TRỰC TUYẾN</h2>
          <div className="delivery-container">
            {deliveryOptions.map(option => (
              <div key={option.id} className="delivery-item">
                <div className="delivery-icon">
                  <img src={option.image} alt={option.title} />
                </div>
                <h4>{option.title}</h4>
                <p>{option.subtitle}</p>
              </div>
            ))}
          </div>
          <button className="primary-gold-btn large-btn">ĐẶT HÀNG NGAY</button>
        </section>
      </div>

      <AuthRequiredModal
        isOpen={showAuthRequired}
        onClose={() => setShowAuthRequired(false)}
      />

      {/* ===== 3 MODAL THÊM MÓN ===== */}

      {/* Modal A: THÊM MÓN */}
      <AddDishModal
        isOpen={showAddDishModal}
        onClose={handleCloseAllModals}
        onOpenFoodList={handleOpenFoodList}
        onOpenComboList={handleOpenComboList}
        selectedDishes={menuDishes}
        onUpdateQuantity={handleUpdateDishQuantity}
        onRemoveDish={handleRemoveDish}
        notes={addDishNotes}
        onNotesChange={setAddDishNotes}
        totalPrice={addDishTotalPrice}
        onConfirm={handleConfirmDishOrder}
      />

      {/* Modal B: DANH SÁCH MÓN ĂN */}
      <FoodListModal
        isOpen={showFoodListModal}
        onClose={() => setShowFoodListModal(false)}
        onBack={handleBackToAddDish}
        menuItems={menuOptions}
        menuCategories={menuCategoriesFromApi}
        selectedDishes={menuDishes}
        onAddDish={handleAddDishFromModal}
        onRemoveDish={handleRemoveDishFromModal}
      />

      {/* Modal C: DANH SÁCH GÓI COMBO */}
      <ComboListModal
        isOpen={showComboListModal}
        onClose={() => setShowComboListModal(false)}
        onBack={handleBackToAddDish}
        comboItems={apiComboOptions}
        selectedDishes={menuDishes}
        onAddDish={handleAddDishFromModal}
        onRemoveDish={handleRemoveDishFromModal}
      />

      <Footer />
    </div>
  );
};

export default Services;