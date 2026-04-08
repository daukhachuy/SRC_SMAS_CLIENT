import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Calendar, 
  Info, 
  Star, 
  AlertTriangle,
  Check
} from 'lucide-react';
import { markNotificationAsRead } from '../api/notificationApi';
import '../styles/NotificationDropdown.css';

const NotificationDropdown = ({ isOpen, onClose, notifications: externalNotifications, onNotificationsChange }) => {
  const dropdownRef = useRef(null);

  const getVisualByNotification = (notification) => {
    if (notification?.icon && notification?.iconBg) {
      return { Icon: notification.icon, iconBg: notification.iconBg };
    }

    const raw = String(notification?.type || notification?.tone || '').toLowerCase();
    if (raw.includes('order')) return { Icon: ShoppingCart, iconBg: 'bg-orange' };
    if (raw.includes('book')) return { Icon: Calendar, iconBg: 'bg-orange' };
    if (raw.includes('warning') || raw.includes('error')) return { Icon: AlertTriangle, iconBg: 'bg-red' };
    if (raw.includes('promotion')) return { Icon: Star, iconBg: 'bg-yellow' };
    if (raw.includes('success')) return { Icon: Check, iconBg: 'bg-blue' };
    return { Icon: Info, iconBg: 'bg-blue' };
  };
  
  // Sample notifications data
  const defaultNotifications = [
    {
      id: 1,
      type: 'order',
      title: 'Đơn hàng mới #DH123',
      message: 'Một đơn hàng mới vừa được tạo từ Table B12 đang chờ bạn xác nhận.',
      time: '5 phút trước',
      isRead: false,
      icon: ShoppingCart,
      iconBg: 'bg-orange',
    },
    {
      id: 2,
      type: 'booking',
      title: 'Yêu cầu đặt bàn mới',
      message: 'Khách hàng Anh Minh vừa gửi yêu cầu đặt bàn 6 người vào lúc 19:00 tối nay.',
      time: '15 phút trước',
      isRead: false,
      icon: Calendar,
      iconBg: 'bg-orange',
    },
    {
      id: 3,
      type: 'system',
      title: 'Cập nhật hệ thống thành công',
      message: 'Phiên bản v2.4.0 đã được triển khai với các tính năng tối ưu hóa kho hàng.',
      time: '2 giờ trước',
      isRead: true,
      icon: Info,
      iconBg: 'bg-blue',
    },
    {
      id: 4,
      type: 'promotion',
      title: 'Chiến dịch Marketing tháng 6',
      message: 'Chương trình khuyến mãi tháng 6 đã sẵn sàng để áp dụng cho khách VIP.',
      time: '5 giờ trước',
      isRead: true,
      icon: Star,
      iconBg: 'bg-yellow',
    },
    {
      id: 5,
      type: 'warning',
      title: 'Cảnh báo tồn kho',
      message: 'Nguyên liệu "Cá hồi Na Uy" đang ở mức dưới hạn mức tối thiểu.',
      time: '1 ngày trước',
      isRead: true,
      icon: AlertTriangle,
      iconBg: 'bg-red',
    },
  ];

  const [notifications, setNotifications] = useState(
    externalNotifications || defaultNotifications
  );

  useEffect(() => {
    if (Array.isArray(externalNotifications)) {
      setNotifications(externalNotifications);
    }
  }, [externalNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((notif) => !notif.isRead).map((notif) => notif.id);

    if (unreadIds.length > 0) {
      await Promise.allSettled(unreadIds.map((id) => markNotificationAsRead(id)));
    }

    const next = notifications.map((notif) => ({ ...notif, isRead: true }));
    setNotifications(next);
    if (typeof onNotificationsChange === 'function') {
      onNotificationsChange(next);
    }
  };

  const handleNotificationClick = async (id) => {
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Mark notification as read failed:', error);
    }

    const next = notifications.map((notif) =>
      notif.id === id ? { ...notif, isRead: true } : notif
    );
    setNotifications(next);
    if (typeof onNotificationsChange === 'function') {
      onNotificationsChange(next);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="notification-overlay" onClick={onClose} />
      
      {/* Dropdown */}
      <div 
        ref={dropdownRef}
        className="notification-dropdown"
      >
        {/* Header */}
        <div className="notification-header">
          <h3 className="notification-title">Thông báo</h3>
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              Đánh dấu tất cả là đã đọc
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="notification-list">
          {notifications.length === 0 && (
            <div className="notification-item" style={{ justifyContent: 'center' }}>
              <div className="notification-content">
                <p className="notification-item-title">Chưa có thông báo</p>
                <p className="notification-message">Hệ thống chưa có thông báo mới.</p>
              </div>
            </div>
          )}
          {notifications.map((notification) => {
            const { Icon, iconBg } = getVisualByNotification(notification);
            return (
              <div
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className={`notification-icon ${iconBg}`}>
                  <Icon size={20} />
                </div>
                <div className="notification-content">
                  <p className="notification-item-title">{notification.title}</p>
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-time">{notification.time}</span>
                </div>
                {!notification.isRead && (
                  <div className="unread-indicator" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="notification-footer">
          <button className="view-all-notifications-btn">
            Xem tất cả thông báo
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
