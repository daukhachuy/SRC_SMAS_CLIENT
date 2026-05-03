/**
 * Cầu nối toast toàn app: dùng từ util / file không có React hook.
 * AppToastProvider đăng ký bridge khi mount.
 */

let bridge = null;

export function registerAppToast(fn) {
  bridge = typeof fn === 'function' ? fn : null;
}

export function unregisterAppToast() {
  bridge = null;
}

/**
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 */
export function emitAppToast(message, type = 'info') {
  const raw =
    typeof message === 'string'
      ? message
      : String(message?.message ?? message ?? '');
  const text = raw.trim() || '—';
  const t = ['success', 'error', 'info'].includes(type) ? type : 'info';
  if (bridge) {
    bridge(text, t);
    return;
  }
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[AppToast]', t, text);
  }
}
