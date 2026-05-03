export const NOTIFICATION_PUSH_EVENT = 'smas:notification-push';

export function emitNotificationPush() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_PUSH_EVENT));
}

/**
 * @param {() => void} handler
 * @returns {() => void}
 */
export function subscribeNotificationPush(handler) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(NOTIFICATION_PUSH_EVENT, handler);
  return () => window.removeEventListener(NOTIFICATION_PUSH_EVENT, handler);
}
