import { useEffect } from 'react';
import { subscribeNotificationPush } from '../utils/notificationRealtimeBus';

/**
 * Gọi lại load thông báo khi SignalR (hoặc bus) báo có cập nhật.
 * @param {{ current: (() => unknown) | null | undefined }} reloadRef
 */
export function useNotificationPushReload(reloadRef) {
  useEffect(() => {
    const onPush = () => {
      void reloadRef.current?.();
    };
    return subscribeNotificationPush(onPush);
  }, [reloadRef]);
}
