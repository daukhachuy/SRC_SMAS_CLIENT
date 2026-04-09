import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Services.css';
import { ChevronLeft, ChevronRight, CalendarClock, CalendarDays, Clock, User, Phone, Mail, Users, UtensilsCrossed, MapPin, FileText, ChevronDown, List, Check, ShieldCheck, Headphones, Utensils, CreditCard, Wallet, Bell, Tag, Star } from 'lucide-react';
import { getProfile } from '../api/userApi';
import { createReservation } from '../api/homeApi';
import { eventBookingAPI, serviceAPI, EVENT_TYPES_LIST } from '../api/managerApi';
import { getComboLists, getFoodByFilter } from '../api/foodApi';
import { isAuthenticated } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import AuthRequiredModal from '../components/AuthRequiredModal';

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

const Services = () => {
  const navigate = useNavigate();
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
    numGuests: '10',
    location: '',
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
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(''); // tên hiển thị
  const [selectedEventId, setSelectedEventId] = useState(0); // id gửi API (backend cần eventId)
  const [selectedEventTime, setSelectedEventTime] = useState(''); // giờ tổ chức HH:mm
  const [eventStepError, setEventStepError] = useState(''); // lỗi validation step 1
  const [selectedServices, setSelectedServices] = useState([]);
  const [menuDishes, setMenuDishes] = useState([]);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('payos');
  const [discountCode, setDiscountCode] = useState('');
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
  const eventSubmitRef = useRef(false); // chống double-submit (React StrictMode)
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');

  // API-loaded menu & combo options
  const [apiMenuOptions, setApiMenuOptions] = useState([]);
  const [apiComboOptions, setApiComboOptions] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // API-loaded event services (Bước 2: Sự kiện & Dịch vụ)
  const [eventServicesFromApi, setEventServicesFromApi] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  useEffect(() => {
    // Services page is now public - anyone can view
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
        const foodList = foodRes.status === 'fulfilled' ? (Array.isArray(foodRes.value) ? foodRes.value : foodRes.value?.$values || []) : [];

        const categoryMap = { 1: 'Khai vị', 2: 'Món chính', 3: 'Tráng miệng', 4: 'Đồ uống' };

        const mappedCombos = comboList.map(c => ({
          type: 'Combo',
          id: c.comboId ?? c.id ?? 0,
          comboId: c.comboId ?? c.id ?? 0,
          name: c.comboName || c.name || '',
          price: c.comboPrice || c.price || 0,
          categoryLabel: 'Món chính'
        }));

        const mappedFoods = foodList.map(f => ({
          type: 'Menu',
          id: f.foodId ?? f.id ?? 0,
          foodId: f.foodId ?? f.id ?? 0,
          name: f.foodName || f.name || '',
          price: f.price || 0,
          categoryLabel: categoryMap[f.categoryId] || 'Món chính'
        }));

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

  // Load danh sách dịch vụ từ GET /api/services (Bước 2: Sự kiện & Dịch vụ)
  useEffect(() => {
    const loadServices = async () => {
      setIsLoadingServices(true);
      try {
        const res = await serviceAPI.getServices();
        const list = Array.isArray(res?.data) ? res.data : res?.data?.$values ?? [];
        const apiUrl = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';
        const imageBase = apiUrl.replace(/\/api\/?$/, '') || window.location.origin;
        const mapped = list
          .filter(s => s.isAvailable !== false)
          .map(s => ({
            id: s.serviceId,
            name: s.title || '',
            price: s.servicePrice ?? 0,
            description: s.description || '',
            unit: s.unit || '',
            image: s.image
              ? (s.image.startsWith('http') ? s.image : imageBase + (s.image.startsWith('/') ? s.image : '/' + s.image))
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

  const validateBookingForm = () => {
    if (!bookingForm.fullName.trim()) {
      return 'Vui lòng nhập họ và tên.';
    }

    if (!bookingForm.phone.trim()) {
      return 'Vui lòng nhập số điện thoại.';
    }

    if (!selectedTime) {
      return 'Vui lòng chọn giờ đặt bàn.';
    }

    const guests = Number(bookingForm.numGuests);
    if (!guests || guests < 1 || guests > 29) {
      return 'Số lượng khách hợp lệ từ 1 đến 29.';
    }

    return '';
  };

  const handleBookingSubmit = async () => {
    setBookingError('');
    setBookingSuccess('');

    const validationError = validateBookingForm();
    if (validationError) {
      setBookingError(validationError);
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

  // Menu và Combo options (merge API data + fallbacks, categoryLabel dùng cho tag màu)
  const menuOptions = [
    ...apiMenuOptions,
    ...apiComboOptions,
    // Fallback items nếu API chưa có
    ...(apiMenuOptions.length === 0 && apiComboOptions.length === 0 ? [
      { type: 'Menu', name: 'Súp bào ngư vây cá', price: 500000, categoryLabel: 'Khai vị' },
      { type: 'Menu', name: 'Cá điều hồng hấp', price: 150000, categoryLabel: 'Món chính' },
      { type: 'Menu', name: 'Tôm sú hấp', price: 180000, categoryLabel: 'Món chính' },
      { type: 'Menu', name: 'Mực nướng', price: 200000, categoryLabel: 'Món chính' },
      { type: 'Menu', name: 'Chè tổ yến hạt sen', price: 300000, categoryLabel: 'Tráng miệng' },
      { type: 'Combo', name: 'Combo FPT', price: 150000, categoryLabel: 'Món chính' },
      { type: 'Combo', name: 'Combo VIP', price: 250000, categoryLabel: 'Món chính' },
      { type: 'Combo', name: 'Combo Family', price: 350000, categoryLabel: 'Món chính' }
    ] : [])
  ];

  // Event Types - từ API /api/events (đồng bộ với backend)
  const eventTypes = EVENT_TYPES_LIST.map(ev => ({ id: ev.id, name: ev.name }));

  // Time slots cho event (không cần đặt trước)
  const eventTimeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  // Dịch vụ sự kiện: ưu tiên từ API GET /api/services, không có thì dùng fallback
  const fallbackEventServices = [
    { id: 1, name: 'MC Tố Châu', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', description: 'MC tổ chức có chuyên môn cao, dẫn dắt sự kiện chuyên nghiệp', price: 100000 },
    { id: 2, name: 'MC Minh Hạ', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', description: 'MC nổi tiếng với phong cách dẫn dắt hài hước và cuốn hút', price: 100000 },
    { id: 3, name: 'Backdrop Tiêu Chuẩn', image: 'https://images.unsplash.com/photo-1519671482677-76ce3692eb04?auto=format&fit=crop&q=80&w=200', description: 'Backdrop trang trí cơ bản với các mẫu tiêu chuẩn', price: 2000000 },
    { id: 4, name: 'Backdrop VIP', image: 'https://images.unsplash.com/photo-1537904904737-13fc2b3560a1?auto=format&fit=crop&q=80&w=200', description: 'Backdrop cao cấp với thiết kế riêng, trang trí sang trọng', price: 5000000 },
    { id: 5, name: 'Âm thanh & Âm nhạc', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=200', description: 'Hệ thống âm thanh chuyên nghiệp, DJ live để làm nóng không khí', price: 3000000 },
    { id: 6, name: 'Chụp Ảnh & Video', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=200', description: 'Chụp ảnh và quay phim chuyên nghiệp suốt sự kiện', price: 2500000 },
    { id: 7, name: 'Lighting LED', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=200', description: 'Hệ thống đèn LED hiện đại tạo không khí sôi động', price: 2000000 },
    { id: 8, name: 'Hoa trang trí', image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&q=80&w=200', description: 'Hoa tươi và trang trí hoa cao cấp cho sự kiện', price: 1500000 },
  ];
  const eventServices = eventServicesFromApi.length > 0 ? eventServicesFromApi : fallbackEventServices;

  // Validate Step 1 trước khi chuyển bước
  const handleNextStep = () => {
    setEventStepError('');

    // 1) Chọn loại sự kiện
    if (!selectedEventId || selectedEventId < 1) {
      setEventStepError('eventId');
      return;
    }
    // 2) Chọn ngày (luôn có default → không cần check trống, chỉ check quá khứ nếu muốn)
    // 3) Chọn giờ
    if (!selectedEventTime) {
      setEventStepError('time');
      return;
    }
    // 4) Số khách trong 1 bàn
    const guestsPerTable = parseInt(eventForm.numGuests, 10);
    if (!guestsPerTable || guestsPerTable < 1) {
      setEventStepError('Vui lòng nhập số khách trong 1 bàn (≥1).');
      return;
    }
    // 5) Số bàn
    const tables = parseInt(eventForm.numTables, 10);
    if (!tables || tables < 1) {
      setEventStepError('Vui lòng nhập số lượng bàn (≥1).');
      return;
    }
    // 6) Họ tên
    if (!eventForm.fullName || !eventForm.fullName.trim()) {
      setEventStepError('fullName');
      return;
    }
    // 7) SĐT
    if (!eventForm.phone || !eventForm.phone.trim()) {
      setEventStepError('phone');
      return;
    }

    setEventStepError('');
    setEventStep(2);
  };

  // Function to toggle service selection
  const toggleService = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Calculate total service cost
  const calculateServiceTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = eventServices.find(s => s.id === serviceId);
      return total + (service?.price || 0);
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
      setEventError('Vui lòng chọn ngày tổ chức sự kiện');
      return;
    }

    if (!selectedEventId || selectedEventId < 1) {
      setEventError('Vui lòng chọn loại sự kiện.');
      return;
    }

    const numTables = Math.max(1, parseInt(eventForm.numTables, 10) || 1);
    const guestsPerTable = Math.max(1, parseInt(eventForm.numGuests, 10) || 10);
    const expectedGuests = numTables * guestsPerTable;
    if (numTables < 1) {
      setEventError('Số lượng bàn phải lớn hơn 0.');
      return;
    }
    if (guestsPerTable < 1) {
      setEventError('Số khách trong 1 bàn phải lớn hơn 0.');
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
      // Payload đúng spec Swagger: CreateBookEventApiRequestDTO
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

      const payload = {
        numberOfGuests: expectedGuests,
        reservationDate: formatReservationDate(selectedDate),
        reservationTime,
        note: eventForm.note || '',
        area: eventForm.location || 'Trong nhà (Máy lạnh)',
        eventId: selectedEventId,
        services: selectedServices.map(id => ({
          serviceId: id,
          quantity: 1,
          note: ''
        })),
        foods: foodItems
      };

      console.log('[Event] Submitting book-event:', payload);
      const response = await eventBookingAPI.create(payload);
      console.log('[Event] Success:', response?.data);
      setEventSuccess('Đặt sự kiện thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
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

  const guestsPerTableInput = Number.parseInt(eventForm.numGuests, 10);
  const tablesInput = Number.parseInt(eventForm.numTables, 10);
  const expectedGuestCount =
    Number.isFinite(guestsPerTableInput) && guestsPerTableInput > 0 &&
    Number.isFinite(tablesInput) && tablesInput > 0
      ? guestsPerTableInput * tablesInput
      : 0;

  // FAQ Data
  const faqItems = [
    {
      id: 1,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 2,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 3,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 4,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 5,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 6,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    }
  ];

  // Service Items for Carousel
  const serviceItems = [
    { id: 1, name: 'Tiệc sinh nhật', image: 'https://images.unsplash.com/photo-1551632786-de41ec6a05ae?auto=format&fit=crop&q=80&w=400', desc: 'Lợi chủ tự ăn tại chỗ' },
    { id: 2, name: 'Tiệc sinh nhật', image: 'https://images.unsplash.com/photo-1504674900861-b72b27e84530?auto=format&fit=crop&q=80&w=400', desc: 'Nơi lành lẽ, không khí sạch sẽ' },
    { id: 3, name: 'Tiệc sinh nhật', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=400', desc: 'Lợi chủ tự ăn tại chỗ' },
    { id: 4, name: 'Tiệc sinh nhật', image: 'https://images.unsplash.com/photo-1552566239-4a8c54ef0eaa?auto=format&fit=crop&q=80&w=400', desc: 'Lợi chủ tự ăn tại chỗ' }
  ];

  // Add-on Services
  const addOnServices = [
    { 
      id: 1, 
      name: 'Bánh Sinh Nhật', 
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400', 
      description: 'Cá mú được tẩm bột tỏi hành và chiên trong ngập đầu ăn sẽ tạo cảm giác như ở trên mây',
      price: '250.000 vnđ' 
    },
    { 
      id: 2, 
      name: 'MC', 
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?auto=format&fit=crop&q=80&w=400', 
      description: 'Cá mú được tẩm bột tỏi hành và chiên trong ngập đầu ăn sẽ tạo cảm giác như ở trên mây',
      price: '250.000 vnđ' 
    },
    { 
      id: 3, 
      name: 'Cá mú đủ', 
      image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=400', 
      description: 'Cá mú được tẩm bột tỏi hành và chiên trong ngập đầu ăn sẽ tạo cảm giác như ở trên mây',
      price: '250.000 vnđ' 
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
                          className={`calendar-day-block ${!isSelectable ? 'day-disabled' : ''} ${isSelected ? 'day-active' : ''} ${isSelectable ? 'day-selectable' : ''}`}
                          style={{ cursor: isSelectable ? 'pointer' : 'not-allowed', opacity: isSelectable ? 1 : 0.5 }}
                          className={`
                            ${isToday ? 'today' : ''}
                            ${isSelected ? 'day-active' : ''}
                            ${!isSelectable ? 'day-disabled' : ''}
                            ${isSelectable ? 'day-selectable' : ''}
                          `}
                          style={{
                            cursor: isSelectable ? 'pointer' : 'not-allowed',
                            opacity: isSelectable ? 1 : 0.35
                          }}
                        >
                          <div className="calendar-weekday">{weekday}</div>
                          <div className="calendar-day-number">{day}</div>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="time-grid">
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
                    onChange={(e) => setBookingForm({...bookingForm, fullName: e.target.value})}
                  />
                </div>
                <div className="input-group-row">
                  <label>Số điện thoại:</label>
                  <input 
                    type="text" 
                    placeholder="" 
                    value={bookingForm.phone}
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
                {bookingError && <p className="booking-status booking-status-error">{bookingError}</p>}
                {bookingSuccess && <p className="booking-status booking-status-success">{bookingSuccess}</p>}
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
                    Bước {eventStep}: {
                      eventStep === 1 ? 'Chọn Sự Kiện & Thông Tin' :
                      eventStep === 2 ? 'Dịch Vụ Đi Kèm' :
                      eventStep === 3 ? 'Lên Thực Đơn' :
                      'Xác Nhận & Thanh Toán'
                    }
                  </span>
                  <span className="event-percent">{Math.round((eventStep / 4) * 100)}% Hoàn thành</span>
                </div>
                <div className="event-progress-bar-bg">
                  <div className="event-progress-bar-fill" style={{ width: `${(eventStep / 4) * 100}%` }} />
                </div>
                <div className="event-step-labels">
                  <span className={eventStep >= 1 ? 'active' : ''}>Chọn Sự Kiện</span>
                  <span className={eventStep >= 2 ? 'active' : ''}>Dịch Vụ</span>
                  <span className={eventStep >= 3 ? 'active' : ''}>Thực Đơn</span>
                  <span className={eventStep >= 4 ? 'active' : ''}>Thanh Toán</span>
                </div>
              </div>

              {/* STEP 1: Chọn sự kiện + Ngày giờ + Thông tin khách hàng */}
              {eventStep === 1 && (
                <div className="event-form-step">
                  <div className="event-form-card event-form-card-new">
                    <div className="event-step1-grid">

                      {/* ── CỘT TRÁI: Event + Date/Time + Guests/Tables ── */}
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
                          <div className="event-type-chips">
                            {eventTypes.map(ev => (
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
                                const isToday = date.toDateString() === today.toDateString();
                                const isPast = date < today && date.toDateString() !== today.toDateString();
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
                          <div className="time-slots-grid">
                            {eventTimeSlots.map(time => {
                              const [h, m] = time.split(':').map(Number);
                              const slotDate = new Date(selectedDate);
                              slotDate.setHours(h, m, 0, 0);
                              const now = new Date();
                              const isPast = selectedDate.toDateString() === now.toDateString() && slotDate <= now;
                              const isSelected = selectedEventTime === time;
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  className={`time-slot-btn ${isSelected ? 'active' : ''} ${isPast ? 'disabled' : ''}`}
                                  disabled={isPast}
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

                        {/* Số khách + Số bàn */}
                        <div className="event-step1-row-2">
                          <div className="event-field-block">
                            <label className="event-field-label">
                              <Users size={14} className="icon-orange" />
                              Số khách / bàn <span className="required-asterisk">*</span>
                            </label>
                            <input
                              type="number"
                              className="event-step1-input"
                              value={eventForm.numGuests}
                              min="1"
                              onChange={(e) => {
                                setEventForm({ ...eventForm, numGuests: e.target.value });
                                setEventStepError('');
                              }}
                              placeholder="10"
                            />
                          </div>
                          <div className="event-field-block">
                            <label className="event-field-label">
                              <UtensilsCrossed size={14} className="icon-orange" />
                              Số bàn <span className="required-asterisk">*</span>
                            </label>
                            <input
                              type="number"
                              className="event-step1-input"
                              value={eventForm.numTables}
                              min="1"
                              onChange={(e) => {
                                setEventForm({ ...eventForm, numTables: e.target.value });
                                setEventStepError('');
                              }}
                              placeholder="5"
                            />
                          </div>
                        </div>
                        <div className="event-expected-guests-box">
                          <label className="event-field-label">
                            <Users size={14} className="icon-orange" />
                            Số khách dự kiến
                          </label>
                          <div className="event-expected-guests-value">
                            {expectedGuestCount.toLocaleString('vi-VN')} khách
                          </div>
                        </div>
                        {(eventStepError === 'guests' || eventStepError === 'tables') && (
                          <p className="event-field-error">{eventStepError}</p>
                        )}
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
                            className="event-step1-input"
                            value={eventForm.fullName}
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
                            className="event-step1-input"
                            value={eventForm.phone}
                            maxLength={11}
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
                            <MapPin size={14} className="icon-orange" />
                            Khu vực tổ chức
                          </label>
                          <select
                            className="event-step1-input"
                            value={eventForm.location}
                            onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                          >
                            <option value="">Chọn khu vực</option>
                            <option value="Trong nhà (Máy lạnh)">Trong nhà (Máy lạnh)</option>
                            <option value="Ngoài trời (Sân vườn)">Ngoài trời (Sân vườn)</option>
                          </select>
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
                    {eventStepError && !['eventId', 'time', 'fullName', 'phone', 'guests', 'tables'].includes(eventStepError) && (
                      <p className="event-form-error-summary">{eventStepError}</p>
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
                            className={`event-service-card-v2 ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                            onClick={() => toggleService(service.id)}
                          >
                            <div className="event-service-card-v2-img">
                              <img src={service.image} alt={service.name} />
                              {selectedServices.includes(service.id) && (
                                <div className="event-service-card-v2-check"><Check size={18} strokeWidth={3} /></div>
                              )}
                            </div>
                            <h5 className="event-service-card-v2-title">{service.name}</h5>
                            <p className="event-service-card-v2-price">{formatCurrency(service.price).replace('₫', '')} đ</p>
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
                    <h4 className="event-menu-detail-title">Chi tiết thực đơn đã chọn</h4>
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
                      const serviceFee = Math.round(subtotal * 0.05);
                      const total = subtotal + serviceFee;
                      return (
                        <div className="event-menu-summary">
                          <div className="event-menu-summary-row"><span>Tạm tính:</span><span>{formatCurrency(subtotal)}</span></div>
                          <div className="event-menu-summary-row"><span>Phí dịch vụ (5%):</span><span>{formatCurrency(serviceFee)}</span></div>
                          <div className="event-menu-summary-row event-menu-summary-total"><span>TỔNG CỘNG:</span><span>{formatCurrency(total)}</span></div>
                          <div className="event-menu-summary-actions">
                            <button type="button" className="event-btn-edit-menu" onClick={() => setIsEditingMenu(true)}><Utensils size={18} /> Chỉnh sửa thực đơn</button>
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

              {/* STEP 4: Thanh toán - một thẻ trắng lớn căn giữa như ảnh */}
              {eventStep === 4 && (
                <div className="event-form-step event-payment-step">
                  <div className="event-payment-outer-card">
                    <div className="event-payment-columns">
                    <div className="event-payment-card event-payment-summary">
                      <h4 className="event-payment-card-title"><Tag size={18} className="icon-orange" /> Tóm tắt đơn hàng</h4>
                      {(() => {
                        const bookingFee = 2500000;
                        const decorationFee = selectedServices.length > 0 ? calculateServiceTotal() : 1000000;
                        const serviceFeePercent = 0.1;
                        const subtotalBeforeFee = bookingFee + decorationFee;
                        const serviceFeeAmount = Math.round(subtotalBeforeFee * serviceFeePercent);
                        const totalPayment = subtotalBeforeFee + serviceFeeAmount;
                        return (
                          <>
                            <div className="event-payment-line"><span>Dịch vụ đặt lịch</span><span>{formatCurrency(bookingFee)}</span></div>
                            <div className="event-payment-line"><span>Phí trang trí</span><span>{formatCurrency(decorationFee)}</span></div>
                            <div className="event-payment-line"><span>Phí phục vụ (10%)</span><span>{formatCurrency(serviceFeeAmount)}</span></div>
                            <div className="event-payment-total-row"><span>Tổng cộng</span><span className="event-payment-total-amount">{formatCurrency(totalPayment)}</span></div>
                            <div className="event-payment-discount">
                              <label>Mã giảm giá</label>
                              <div className="event-payment-discount-row">
                                <input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Nhập mã khuyến mãi" />
                                <button type="button" className="event-payment-apply-btn">Áp dụng</button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="event-payment-card event-payment-methods">
                      <h4 className="event-payment-card-title"><Tag size={18} className="icon-orange" /> Phương thức thanh toán</h4>
                      <div className="event-payment-options">
                        <label className={`event-payment-option ${paymentMethod === 'payos' ? 'selected' : ''}`} onClick={() => setPaymentMethod('payos')}>
                          <input type="radio" name="paymentMethod" checked={paymentMethod === 'payos'} readOnly />
                          <div className="event-payment-option-icon"><CreditCard size={22} /></div>
                          <div className="event-payment-option-text">
                            <strong>PayOS</strong>
                            <span>Thanh toán nhanh qua cổng PayOS</span>
                          </div>
                        </label>
                        <label className={`event-payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                          <input type="radio" name="paymentMethod" checked={paymentMethod === 'cash'} readOnly />
                          <div className="event-payment-option-icon"><Wallet size={22} /></div>
                          <div className="event-payment-option-text">
                            <strong>Tiền mặt</strong>
                            <span>Thanh toán trực tiếp khi nhận dịch vụ</span>
                          </div>
                        </label>
                      </div>
                      <div className="event-payment-security">
                        <ShieldCheck size={18} className="event-payment-security-icon" />
                        <p>Thông tin thanh toán của bạn được mã hóa và bảo mật tuyệt đối theo tiêu chuẩn quốc tế. Chúng tôi không lưu trữ thông tin thẻ của bạn.</p>
                      </div>
                    </div>
                    </div>

                    <button
                      type="button"
                      className="event-btn-confirm-payment"
                      onClick={handleEventSubmit}
                      disabled={isEventSubmitting}
                    >
                      {isEventSubmitting ? 'ĐANG XỬ LÝ...' : 'Xác nhận thanh toán →'}
                    </button>
                    {eventError && <p className="booking-status booking-status-error" style={{ textAlign: 'center', marginTop: 8 }}>{eventError}</p>}
                    {eventSuccess && <p className="booking-status booking-status-success" style={{ textAlign: 'center', marginTop: 8 }}>{eventSuccess}</p>}
                    <p className="event-payment-terms">Bằng cách nhấn nút, bạn đồng ý với <a href="#terms">Điều khoản dịch vụ</a> của chúng tôi.</p>
                    <button type="button" className="event-btn-back event-btn-back-payment-link" onClick={() => setEventStep(3)}>← Quay lại</button>
                  </div>
                </div>
              )}

              {/* STEP 5: Success */}
              {eventStep === 5 && (
                <div className="event-form-step">
                  <div className="event-success-card">
                    <div className="event-success-icon"><Check size={48} strokeWidth={2.5} /></div>
                    <h2>Đặt Sự Kiện Thành Công!</h2>
                    <p>{eventSuccess || 'Cảm ơn bạn đã đặt sự kiện. Nhân viên của chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận chi tiết.'}</p>
                    <div className="event-success-actions">
                      <button type="button" className="event-btn-primary" onClick={() => { setEventStep(1); setEventSuccess(''); }}>Đặt sự kiện mới</button>
                      <button type="button" className="event-btn-secondary" onClick={() => navigate('/')}>Về trang chủ</button>
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
                            className={`event-service-card-v2 ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                            onClick={() => toggleService(service.id)}
                          >
                            <div className="event-service-card-v2-img">
                              <img src={service.image} alt={service.name} />
                              {selectedServices.includes(service.id) && (
                                <div className="event-service-card-v2-check"><Check size={18} strokeWidth={3} /></div>
                              )}
                            </div>
                            <h5 className="event-service-card-v2-title">{service.name}</h5>
                            <p className="event-service-card-v2-price">{formatCurrency(service.price).replace('₫', '')} đ</p>
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

        {/* SECTION 3: SERVICE CAROUSEL */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẦY ĐỦ CÁC SỰ KIỆN</h2>
          <div className="carousel-container">
            <button className="carousel-nav prev" onClick={() => setServiceCarouselIndex(Math.max(0, serviceCarouselIndex - 1))}>
              <ChevronLeft size={24} />
            </button>
            <div className="carousel-content">
              {serviceItems.slice(serviceCarouselIndex, serviceCarouselIndex + 4).map(item => (
                <div key={item.id} className="carousel-item">
                  <img src={item.image} alt={item.name} />
                  <h4>{item.name}</h4>
                  <p className="carousel-item-desc">{item.desc}</p>
                </div>
              ))}
            </div>
            <button className="carousel-nav next" onClick={() => setServiceCarouselIndex(Math.min(serviceItems.length - 4, serviceCarouselIndex + 1))}>
              <ChevronRight size={24} />
            </button>
          </div>
        </section>

        {/* SECTION 4: ADD-ON SERVICES */}
        <section className="service-card-section">
          <h2 className="service-title-gold">DỊCH VỤ KÈM THEO</h2>
          <div className="addon-carousel-container">
            <button className="addon-carousel-nav prev" onClick={() => setAddOnCarouselIndex(Math.max(0, addOnCarouselIndex - 1))}>
              <ChevronLeft size={32} />
            </button>
            <div className="addon-carousel-content">
              {addOnServices.slice(addOnCarouselIndex, addOnCarouselIndex + 3).map(item => (
                <div key={item.id} className="addon-item-card">
                  <div className="addon-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="addon-item-info">
                    <h4 className="addon-item-name">{item.name}</h4>
                    <p className="addon-item-description">{item.description}</p>
                    <p className="addon-item-price">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="addon-carousel-nav next" onClick={() => setAddOnCarouselIndex(Math.min(addOnServices.length - 3, addOnCarouselIndex + 1))}>
              <ChevronRight size={32} />
            </button>
          </div>
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

      <Footer />
    </div>
  );
};

export default Services;