import { useEffect, useRef } from 'react';
import { playIncomingNotificationSound } from '../utils/uiClickSound';

/**
 * Phát âm khi số thông báo chưa đọc tăng (sau lần cập nhật đầu tiên).
 * Dùng chung Admin / Manager / Waiter / Kitchen / Header.
 */
export function useUnreadNotificationSound(notifications) {
  const skipFirst = useRef(true);
  const prevUnread = useRef(0);

  useEffect(() => {
    const unread = Array.isArray(notifications)
      ? notifications.filter((n) => !n.isRead).length
      : 0;
    if (skipFirst.current) {
      skipFirst.current = false;
      prevUnread.current = unread;
      return;
    }
    if (unread > prevUnread.current) {
      void playIncomingNotificationSound();
    }
    prevUnread.current = unread;
  }, [notifications]);
}
