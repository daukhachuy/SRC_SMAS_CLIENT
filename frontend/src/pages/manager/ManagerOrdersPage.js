import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  History,
  MoreHorizontal,
  PartyPopper,
  UtensilsCrossed
} from 'lucide-react';
import EventDetailModal from './EventDetailModal';
import DeliveryDetailModal from './DeliveryDetailModal';

const orderTabs = [
  { label: 'Tất cả', count: 32, filterKey: 'all' },
  { label: 'Ăn tại chỗ', count: 12, filterKey: 'dine' },
  { label: 'Mang về', count: 6, filterKey: 'takeaway' },
  { label: 'Vận chuyển', count: 10, filterKey: 'delivery' },
  { label: 'Sự kiện', count: 4, filterKey: 'event' }
];

const activeOrders = [
  {
    code: '#HD001',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 05',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '3 món ăn',
    amount: '450.000đ',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD002',
    mode: 'Vận chuyển',
    title: 'Anh Hoàng (1.2km)',
    status: 'Đang giao',
    statusClass: 'shipping',
    items: '8 món ăn',
    amount: '1.200.000đ',
    image:
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD003',
    mode: 'Sự kiện',
    title: 'Tiệc sinh nhật - P1',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '25 món ăn',
    amount: '5.320.000đ',
    image:
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
    icon: 'event',
    // Detailed data for modal
    id: 'SK003',
    type: 'Sinh nhật',
    name: 'Thôi nôi bé Bún',
    menuItems: [
      {
        name: 'Gỏi ngó sen tôm thịt',
        quantity: '10',
        unitPrice: '185.000đ',
        totalPrice: '1.850.000đ',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD--pKKiLLFbBFyxbHp9pdf2TDQ_oW0wl90W7Gh5nyAsPMdTUu08VqRo1E_4z02Nbld-bKF6uUBsJ7eknI3bCaTMOL5cnQNGJwJ9UP8Bg148IxHfRbkKTxTTpqFccKE8LWeY1Fhzxia4gvJYdVTjcOx3F2JqHexTUNbErrt2Wix_0uGhGOb6DlCevzKZOJCXVRfRUWGuHlsr2qxbJCcD9S2I2nEVDA5h4WaA0XJKoho-o0va1NRIwuiYTjA8DEPCoS6VoftjUCTjuU'
      },
      {
        name: 'Gà quay mật ong (Con)',
        quantity: '05',
        unitPrice: '420.000đ',
        totalPrice: '2.100.000đ',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAFhkqirmoFN_flgfsh1gx_upLY6RFtouNfYSwM6HAMfY5yuFCCdf-cjijg_E69xhWRxZaMjCw57ZwrFg7W9-ZRB437UE4ZMwiHLNVygvelD9HWx3q9soSnEu3-VUhCDVvTZh_eDk9OL3XstP7lp0tWrNCvhlg1cvPU9r1tnom3aOR0S4UA41p-BF1ISNxlKqyrrWrSIq_wd6PeS3HH6enSNqRh9-N7L2rsH-ggvqljLJDg75xLW1eYFcksp3Kznz2uii5vtQEAfY'
      },
      {
        name: 'Lẩu thái hải sản (Lớn)',
        quantity: '03',
        unitPrice: '550.000đ',
        totalPrice: '1.650.000đ',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD--pKKiLLFbBFyxbHp9pdf2TDQ_oW0wl90W7Gh5nyAsPMdTUu08VqRo1E_4z02Nbld-bKF6uUBsJ7eknI3bCaTMOL5cnQNGJwJ9UP8Bg148IxHfRbkKTxTTpqFccKE8LWeY1Fhzxia4gvJYdVTjcOx3F2JqHexTUNbErrt2Wix_0uGhGOb6DlCevzKZOJCXVRfRUWGuHlsr2qxbJCcD9S2I2nEVDA5h4WaA0XJKoho-o0va1NRIwuiYTjA8DEPCoS6VoftjUCTjuU'
      }
    ],
    customer: {
      name: 'Nguyễn Hoàng Nam',
      type: 'Khách hàng thân thiết',
      phone: '090 123 4567',
      eventType: 'Sinh nhật',
      eventDate: '28/10/2023',
      guestCount: '30 người'
    },
    contractStatus: {
      status: 'Đã ký kết',
      code: 'Mã HĐ: #SK-2310-003'
    },
    paymentInfo: {
      menuTotal: '5.320.000đ',
      tax: '532.000đ',
      deposit: '2.000.000đ',
      remaining: '3.852.000đ'
    }
  },
  {
    code: '#HD004',
    mode: 'Mang về',
    title: 'Chị Lan',
    status: 'Sẵn sàng',
    statusClass: 'ready',
    items: '1 món ăn',
    amount: '150.000đ',
    image:
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
    icon: 'takeaway'
  },
  {
    code: '#HD005',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 02',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '2 món ăn',
    amount: '220.000đ',
    image:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD006',
    mode: 'Vận chuyển',
    title: 'Chị Thu (2.5km)',
    status: 'Đang giao',
    statusClass: 'shipping',
    items: '5 món ăn',
    amount: '680.000đ',
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD007',
    mode: 'Ăn tại chỗ',
    title: 'Phòng VIP 1',
    status: 'Sẵn sàng',
    statusClass: 'ready',
    items: '12 món ăn',
    amount: '2.450.000đ',
    image:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD008',
    mode: 'Sự kiện',
    title: 'Workshop Tech',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '15 món ăn',
    amount: '3.800.000đ',
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    icon: 'event',
    // Detailed data for modal
    id: 'SK002',
    type: 'Workshop',
    name: 'Digital Marketing 2023',
    menuItems: [
      {
        name: 'Gỏi ngó sen tôm thịt',
        quantity: '5',
        unitPrice: '185.000đ',
        totalPrice: '925.000đ',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD--pKKiLLFbBFyxbHp9pdf2TDQ_oW0wl90W7Gh5nyAsPMdTUu08VqRo1E_4z02Nbld-bKF6uUBsJ7eknI3bCaTMOL5cnQNGJwJ9UP8Bg148IxHfRbkKTxTTpqFccKE8LWeY1Fhzxia4gvJYdVTjcOx3F2JqHexTUNbErrt2Wix_0uGhGOb6DlCevzKZOJCXVRfRUWGuHlsr2qxbJCcD9S2I2nEVDA5h4WaA0XJKoho-o0va1NRIwuiYTjA8DEPCoS6VoftjUCTjuU'
      },
      {
        name: 'Gà nướng teriyaki',
        quantity: '7',
        unitPrice: '350.000đ',
        totalPrice: '2.450.000đ',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAFhkqirmoFN_flgfsh1gx_upLY6RFtouNfYSwM6HAMfY5yuFCCdf-cjijg_E69xhWRxZaMjCw57ZwrFg7W9-ZRB437UE4ZMwiHLNVygvelD9HWx3q9soSnEu3-VUhCDVvTZh_eDk9OL3XstP7lp0tWrNCvhlg1cvPU9r1tnom3aOR0S4UA41p-BF1ISNxlKqyrrWrSIq_wd6PeS3HH6enSNqRh9-N7L2rsH-ggvqljLJDg75xLW1eYFcksp3Kznz2uii5vtQEAfY'
      },
      {
        name: 'Canh chua cá',
        quantity: '3',
        unitPrice: '250.000đ',
        totalPrice: '750.000đ',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD--pKKiLLFbBFyxbHp9pdf2TDQ_oW0wl90W7Gh5nyAsPMdTUu08VqRo1E_4z02Nbld-bKF6uUBsJ7eknI3bCaTMOL5cnQNGJwJ9UP8Bg148IxHfRbkKTxTTpqFccKE8LWeY1Fhzxia4gvJYdVTjcOx3F2JqHexTUNbErrt2Wix_0uGhGOb6DlCevzKZOJCXVRfRUWGuHlsr2qxbJCcD9S2I2nEVDA5h4WaA0XJKoho-o0va1NRIwuiYTjA8DEPCoS6VoftjUCTjuU'
      }
    ],
    customer: {
      name: 'Nguyễn Văn A',
      type: 'Khách hàng doanh nghiệp',
      phone: '091 234 5678',
      eventType: 'Workshop',
      eventDate: '05/12/2023',
      guestCount: '50 người'
    },
    contractStatus: {
      status: 'Chưa ký kết',
      code: 'Mã HĐ: #SK-2310-002'
    },
    paymentInfo: {
      menuTotal: '3.800.000đ',
      tax: '380.000đ',
      deposit: '1.500.000đ',
      remaining: '2.680.000đ'
    }
  },
  // Additional delivery orders
  {
    code: '#HD009',
    mode: 'Vận chuyển',
    title: 'Anh Nam (3.2km)',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '4 món ăn',
    amount: '520.000đ',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD010',
    mode: 'Vận chuyển',
    title: 'Chị Mai (1.8km)',
    status: 'Đang giao',
    statusClass: 'shipping',
    items: '6 món ăn',
    amount: '850.000đ',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD011',
    mode: 'Vận chuyển',
    title: 'Anh Tuấn (4.5km)',
    status: 'Chờ xác nhận',
    statusClass: 'pending',
    items: '3 món ăn',
    amount: '380.000đ',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD012',
    mode: 'Vận chuyển',
    title: 'Chị Hương (2.1km)',
    status: 'Đang giao',
    statusClass: 'shipping',
    items: '7 món ăn',
    amount: '920.000đ',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD013',
    mode: 'Vận chuyển',
    title: 'Anh Minh (5.0km)',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '5 món ăn',
    amount: '720.000đ',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD014',
    mode: 'Vận chuyển',
    title: 'Chị Linh (0.8km)',
    status: 'Chờ xác nhận',
    statusClass: 'pending',
    items: '2 món ăn',
    amount: '280.000đ',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD015',
    mode: 'Vận chuyển',
    title: 'Anh Khoa (3.7km)',
    status: 'Đang giao',
    statusClass: 'shipping',
    items: '8 món ăn',
    amount: '1.150.000đ',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  {
    code: '#HD016',
    mode: 'Vận chuyển',
    title: 'Chị Phương (2.9km)',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '4 món ăn',
    amount: '590.000đ',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    icon: 'delivery'
  },
  // Additional dine-in orders
  {
    code: '#HD017',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 08',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '4 món ăn',
    amount: '620.000đ',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD018',
    mode: 'Mang về',
    title: 'Anh Bình',
    status: 'Sẵn sàng',
    statusClass: 'ready',
    items: '2 món ăn',
    amount: '180.000đ',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
    icon: 'takeaway'
  },
  {
    code: '#HD019',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 12',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '5 món ăn',
    amount: '750.000đ',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD020',
    mode: 'Ăn tại chỗ',
    title: 'Phòng VIP 2',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '10 món ăn',
    amount: '1.880.000đ',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD021',
    mode: 'Mang về',
    title: 'Chị Thanh',
    status: 'Chờ xác nhận',
    statusClass: 'pending',
    items: '3 món ăn',
    amount: '320.000đ',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
    icon: 'takeaway'
  },
  {
    code: '#HD022',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 15',
    status: 'Sẵn sàng',
    statusClass: 'ready',
    items: '6 món ăn',
    amount: '980.000đ',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD023',
    mode: 'Mang về',
    title: 'Anh Đức',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '2 món ăn',
    amount: '240.000đ',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
    icon: 'takeaway'
  },
  {
    code: '#HD024',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 03',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '3 món ăn',
    amount: '450.000đ',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD025',
    mode: 'Mang về',
    title: 'Chị Nga',
    status: 'Sẵn sàng',
    statusClass: 'ready',
    items: '4 món ăn',
    amount: '520.000đ',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
    icon: 'takeaway'
  },
  {
    code: '#HD026',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 20',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '7 món ăn',
    amount: '1.120.000đ',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD027',
    mode: 'Mang về',
    title: 'Anh Hải',
    status: 'Chờ xác nhận',
    statusClass: 'pending',
    items: '1 món ăn',
    amount: '95.000đ',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
    icon: 'takeaway'
  },
  {
    code: '#HD028',
    mode: 'Ăn tại chỗ',
    title: 'Phòng VIP 3',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '15 món ăn',
    amount: '2.650.000đ',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  // Additional event orders
  {
    code: '#HD029',
    mode: 'Sự kiện',
    title: 'Tiệc tất niên công ty',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '30 món ăn',
    amount: '8.500.000đ',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    icon: 'event'
  },
  {
    code: '#HD030',
    mode: 'Sự kiện',
    title: 'Lễ kỷ niệm 10 năm',
    status: 'Chờ xác nhận',
    statusClass: 'pending',
    items: '20 món ăn',
    amount: '6.200.000đ',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
    icon: 'event'
  },
  {
    code: '#HD031',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 07',
    status: 'Sẵn sàng',
    statusClass: 'ready',
    items: '3 món ăn',
    amount: '420.000đ',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  },
  {
    code: '#HD032',
    mode: 'Ăn tại chỗ',
    title: 'Bàn số 18',
    status: 'Đang chuẩn bị',
    statusClass: 'preparing',
    items: '5 món ăn',
    amount: '780.000đ',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
    icon: 'dine'
  }
];

const historyOrders = [
  {
    code: '#HD0010',
    time: '12:45 - 20/10/2023',
    type: 'Ăn tại chỗ',
    amount: '850.000đ',
    status: 'Hoàn thành',
    statusClass: 'done',
    icon: 'dine'
  },
  {
    code: '#HD0009',
    time: '12:30 - 20/10/2023',
    type: 'Mang về',
    amount: '215.000đ',
    status: 'Hoàn thành',
    statusClass: 'done',
    icon: 'dine'
  },
  {
    code: '#HD0008',
    time: '11:55 - 20/10/2023',
    type: 'Vận chuyển',
    amount: '1.500.000đ',
    status: 'Đã hủy',
    statusClass: 'cancelled',
    icon: 'delivery'
  }
];

const ModeIcon = ({ mode }) => {
  if (mode === 'delivery') {
    return <Bike size={14} />;
  }
  if (mode === 'event') {
    return <PartyPopper size={14} />;
  }

  return <UtensilsCrossed size={14} />;
};

const ManagerOrdersPage = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleEventClick = (order) => {
    if (order.icon === 'event') {
      setSelectedEvent(order);
      setIsModalOpen(true);
    } else if (order.icon === 'delivery') {
      setSelectedDelivery(order);
      setIsDeliveryModalOpen(true);
    } else if (order.icon === 'dine') {
      navigate(`/manager/orders/dine-in/${encodeURIComponent(order.code)}`);
    } else if (order.icon === 'takeaway') {
      navigate(`/manager/orders/takeaway/${encodeURIComponent(order.code)}`);
    }
  };

  const handleTabClick = (filterKey) => {
    setActiveTab(filterKey);
  };

  // Filter orders based on active tab
  const filteredOrders = activeTab === 'all' 
    ? activeOrders 
    : activeOrders.filter(order => order.icon === activeTab);

  return (
    <div className="manager-page-grid orders-page">
      <div className="manager-page-header orders-header-row">
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p>
            Hôm nay: <strong>24 tháng 10, 2023</strong>
          </p>
        </div>
        <div className="orders-toolbar-actions">
          <button className="manager-secondary-btn orders-tool-btn">
            <Filter size={16} />
            <span>Bộ lọc</span>
          </button>
          <button className="manager-secondary-btn orders-tool-btn">
            <Download size={16} />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      <div className="orders-tabs">
        {orderTabs.map((tab) => (
          <button 
            key={tab.label} 
            className={`orders-tab ${activeTab === tab.filterKey ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.filterKey)}
          >
            <span>{tab.label}</span>
            <small>{tab.count.toString().padStart(2, '0')}</small>
          </button>
        ))}
      </div>

      <section className="manager-card orders-active-section">
        <div className="orders-section-head">
          <div>
            <h2>Đơn hàng đang hoạt động</h2>
            <p>Hiển thị {filteredOrders.length} đơn mới nhất theo trạng thái vận hành.</p>
          </div>
          <span className="orders-count">{filteredOrders.length} đơn</span>
        </div>

        <div className="orders-grid-cards">
          {filteredOrders.map((order) => (
            <article
              className="order-item-card"
              key={order.code}
              onClick={() => handleEventClick(order)}
              style={{ cursor: 'pointer' }}
            >
              <div className="order-item-top">
                <div>
                  <p className="order-item-meta">
                    <ModeIcon mode={order.icon} />
                    <span>
                      {order.code} • {order.mode}
                    </span>
                  </p>
                  <h3>{order.title}</h3>
                </div>
                <span className={`orders-state ${order.statusClass}`}>{order.status}</span>
              </div>

              <div className="order-item-image" style={{ backgroundImage: `url(${order.image})` }}>
                <div className="order-item-overlay">
                  <span>{order.items}</span>
                </div>
              </div>

              <div className="order-item-bottom">
                <strong>{order.amount}</strong>
                <button aria-label={`Tác vụ ${order.code}`}>
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="orders-pagination">
          <p>
            Hiển thị <strong>1-{filteredOrders.length}</strong> trong tổng số <strong>{filteredOrders.length}</strong> đơn hàng đang hoạt động
          </p>
          <div className="orders-pagination-controls">
            <button className="orders-page-btn disabled" disabled>
              <ChevronLeft size={16} />
              <span>Trang trước</span>
            </button>
            <div className="orders-pages">
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button>4</button>
            </div>
            <button className="orders-page-btn">
              <span>Trang sau</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="manager-card orders-history-section">
        <div className="orders-section-head history">
          <div>
            <h2>
              <History size={18} />
              <span>Lịch sử đơn hàng gần đây</span>
            </h2>
          </div>
        </div>

        <div className="manager-table-wrap">
          <table className="manager-table orders-history-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Thời gian</th>
                <th>Loại hình</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {historyOrders.map((order) => (
                <tr key={order.code}>
                  <td>{order.code}</td>
                  <td>{order.time}</td>
                  <td>
                    <div className="orders-history-type">
                      <ModeIcon mode={order.icon} />
                      <span>{order.type}</span>
                    </div>
                  </td>
                  <td>{order.amount}</td>
                  <td>
                    <span className={`orders-state ${order.statusClass}`}>{order.status}</span>
                  </td>
                  <td>
                    <button className="orders-detail-btn">Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="orders-history-footer">
          <p>Hiển thị 3 trên 150 đơn hàng</p>
          <div className="orders-mini-pager">
            <button disabled>
              <ChevronLeft size={16} />
            </button>
            <button>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <footer className="orders-footer-note">
        <CalendarDays size={14} />
        <p>© 2023 Restaurant POS System • Thiết kế theo phong cách TechDine</p>
      </footer>

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        event={selectedEvent}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={() => {
          console.log('Save event changes:', selectedEvent);
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
      />

      {/* Delivery Detail Modal */}
      <DeliveryDetailModal
        isOpen={isDeliveryModalOpen}
        deliveryData={selectedDelivery}
        onClose={() => {
          setIsDeliveryModalOpen(false);
          setSelectedDelivery(null);
        }}
      />
    </div>
  );
};

export default ManagerOrdersPage;
