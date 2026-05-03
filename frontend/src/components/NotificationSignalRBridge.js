import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { createHubConnection, NOTIFICATION_HUB } from '../realtime/signalrClient';
import { emitNotificationPush } from '../utils/notificationRealtimeBus';

/** Tên method server → client thường gặp (ASP.NET SignalR). */
const SERVER_TO_CLIENT_METHODS = [
  'ReceiveNotification',
  'NewNotification',
  'NotificationReceived',
  'NotificationCreated',
  'SendNotification',
  'ReceiveMessage',
  'notify',
];

/**
 * Một kết nối hub thông báo; khi nhận push → refetch qua bus.
 * Nếu backend chưa map hub, start() thất bại im lặng — vẫn còn polling.
 */
export default function NotificationSignalRBridge() {
  const { token } = useAuth();
  const connRef = useRef(null);

  useEffect(() => {
    if (!token) {
      if (connRef.current) {
        void connRef.current.stop();
        connRef.current = null;
      }
      return undefined;
    }

    const conn = createHubConnection(NOTIFICATION_HUB);
    connRef.current = conn;

    const onPush = () => {
      emitNotificationPush();
    };

    SERVER_TO_CLIENT_METHODS.forEach((name) => {
      conn.on(name, onPush);
    });

    conn.onreconnected(onPush);

    void conn.start().catch(() => {
      /* Hub có thể chưa tồn tại trên API */
    });

    return () => {
      void conn.stop();
      connRef.current = null;
    };
  }, [token]);

  return null;
}
