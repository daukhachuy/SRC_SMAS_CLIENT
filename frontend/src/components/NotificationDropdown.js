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
  const [showAll, setShowAll] = useState(false);

  const getVisualByNotification = (notification) => {
    if (notification?.icon && notification?.iconBg) {
      return { Icon: notification.icon, iconBg: notification.iconBg };
    }

    const sev = String(notification?.severity || '').trim();
    if (sev === 'Error') return { Icon: AlertTriangle, iconBg: 'bg-red' };
    if (sev === 'Warning') return { Icon: AlertTriangle, iconBg: 'bg-yellow' };
    if (sev === 'Success') return { Icon: Check, iconBg: 'bg-green' };
    if (sev === 'Information') return { Icon: Info, iconBg: 'bg-blue' };

    const raw = String(notification?.type || notification?.tone || '').toLowerCase();
    if (raw.includes('order')) return { Icon: ShoppingCart, iconBg: 'bg-orange' };
    if (raw.includes('book')) return { Icon: Calendar, iconBg: 'bg-orange' };
    if (raw.includes('warning') || raw.includes('error')) return { Icon: AlertTriangle, iconBg: 'bg-red' };
    if (raw.includes('promotion')) return { Icon: Star, iconBg: 'bg-yellow' };
    if (raw.includes('success')) return { Icon: Check, iconBg: 'bg-blue' };
    return { Icon: Info, iconBg: 'bg-blue' };
  };

  const [notifications, setNotifications] = useState(
    Array.isArray(externalNotifications) ? externalNotifications : []
  );

  useEffect(() => {
    if (Array.isArray(externalNotifications)) {
      setNotifications(externalNotifications);
    }
  }, [externalNotifications]);

  useEffect(() => {
    if (!isOpen) {
      setShowAll(false);
    }
  }, [isOpen]);

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
  const visibleNotifications = showAll
    ? notifications
    : notifications.filter((n) => !n.isRead);

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
          {visibleNotifications.length === 0 && (
            <div className="notification-item" style={{ justifyContent: 'center' }}>
              <div className="notification-content">
                <p className="notification-item-title">
                  {showAll ? 'Chưa có thông báo' : 'Không có thông báo chưa đọc'}
                </p>
                <p className="notification-message">
                  {showAll ? 'Hệ thống chưa có thông báo mới.' : 'Bạn đã đọc tất cả thông báo.'}
                </p>
              </div>
            </div>
          )}
          {visibleNotifications.map((notification) => {
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
                  <p className="notification-item-title" title={notification.title}>
                    {notification.title}
                  </p>
                  {notification.severity ? (
                    <span className="notification-severity" title="Severity">
                      {notification.severity}
                    </span>
                  ) : null}
                  <p className="notification-message" title={notification.message}>
                    {notification.message}
                  </p>
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
          {!showAll && (
            <button
              className="view-all-notifications-btn"
              onClick={() => setShowAll(true)}
            >
              Xem tất cả thông báo
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
