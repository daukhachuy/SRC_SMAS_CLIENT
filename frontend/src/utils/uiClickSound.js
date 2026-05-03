/**
 * Hai loại âm (cùng smasUiSound):
 * - Click: một nhịp trầm rất ngắn (~50ms) — “chạm nút / gõ nhẹ”.
 * - Thông báo: hai nốt sine cao lệch nhịp — “chuông có tin mới”, dễ phân biệt.
 */

let audioCtx;

function getAudioContext() {
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

/** Mở AudioContext ngay lần chạm/chuột đầu (Chrome/Safari hay giữ suspended). */
function primeAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
}

export function isUiClickSoundEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('smasUiSound') !== '0';
  } catch {
    return true;
  }
}

/** WAV fallback cho CLICK: một sine trầm, rất ngắn. */
function playSynthesizedWavFallback() {
  try {
    const sampleRate = 22050;
    const duration = 0.07;
    const f = 295;
    const n = Math.floor(sampleRate * duration);
    const bytesPerSample = 2;
    const dataSize = n * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const wStr = (pos, str) => {
      for (let i = 0; i < str.length; i += 1) view.setUint8(pos + i, str.charCodeAt(i));
    };

    wStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    wStr(8, 'WAVE');
    wStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    wStr(36, 'data');
    view.setUint32(40, dataSize, true);

    let off = 44;
    for (let i = 0; i < n; i += 1) {
      const t = i / sampleRate;
      const attack = Math.min(1, i / 24);
      const decay = Math.exp(-t * 42);
      const env = attack * decay;
      const sample = Math.sin(2 * Math.PI * f * t) * 0.5 * env;
      const q = Math.max(-1, Math.min(1, sample));
      view.setInt16(off, Math.round(q * 32767), true);
      off += 2;
    }

    const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
    const a = new Audio();
    a.src = url;
    a.volume = 0.68;
    void a.play().finally(() => URL.revokeObjectURL(url));
  } catch {
    // ignore
  }
}

/** Hai nốt nhẹ lên dần — “có thông báo mới” (khác tiếng click). */
function playNotificationWavFallback() {
  try {
    const sampleRate = 22050;
    const duration = 0.28;
    const n = Math.floor(sampleRate * duration);
    const bytesPerSample = 2;
    const dataSize = n * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const wStr = (pos, str) => {
      for (let i = 0; i < str.length; i += 1) view.setUint8(pos + i, str.charCodeAt(i));
    };

    wStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    wStr(8, 'WAVE');
    wStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    wStr(36, 'data');
    view.setUint32(40, dataSize, true);

    /** Hai nốt sine cao, tách rời — giống Web: 880 Hz rồi ~1320 Hz. */
    const ding = (i, freq, i0, len) => {
      const t = (i - i0) / sampleRate;
      if (i < i0 || i >= i0 + len) return 0;
      const env =
        Math.min(1, (i - i0) / 50) * Math.max(0, 1 - (i - i0 - len * 0.5) / (len * 0.5));
      return Math.sin(2 * Math.PI * freq * t) * 0.48 * env;
    };

    let off = 44;
    const aLen = Math.floor(sampleRate * 0.14);
    const b0 = Math.floor(sampleRate * 0.13);
    const bLen = Math.floor(sampleRate * 0.15);
    for (let i = 0; i < n; i += 1) {
      const s1 = ding(i, 880, 0, aLen);
      const s2 = ding(i, 1318.51, b0, bLen);
      const q = Math.max(-1, Math.min(1, s1 + s2));
      view.setInt16(off, Math.round(q * 32767), true);
      off += 2;
    }

    const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
    const a = new Audio();
    a.src = url;
    a.volume = 0.58;
    void a.play().finally(() => URL.revokeObjectURL(url));
  } catch {
    playSynthesizedWavFallback();
  }
}

/** Một “ding” thông báo: chỉ sine + hoà âm bát độ nhẹ (không dùng tam giác như click). */
function scheduleNotificationDing(ctx, tStart, fundamentalHz) {
  const tEnd = tStart + 0.22;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, tStart);
  master.gain.exponentialRampToValueAtTime(0.13, tStart + 0.004);
  master.gain.exponentialRampToValueAtTime(0.0001, tStart + 0.19);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(fundamentalHz, tStart);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(fundamentalHz * 2, tStart);

  const g2 = ctx.createGain();
  g2.gain.value = 0.14;

  osc1.connect(master);
  osc2.connect(g2);
  g2.connect(master);
  master.connect(ctx.destination);

  osc1.start(tStart);
  osc2.start(tStart);
  osc1.stop(tEnd);
  osc2.stop(tEnd);
}

/** Thông báo mới (chuông đôi nhẹ). Cùng công tắc smasUiSound. */
export async function playIncomingNotificationSound() {
  if (!isUiClickSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) {
    playNotificationWavFallback();
    return;
  }
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const t0 = ctx.currentTime;
    scheduleNotificationDing(ctx, t0, 880);
    scheduleNotificationDing(ctx, t0 + 0.13, 1318.51);
  } catch {
    playNotificationWavFallback();
  }
}

export async function playUiClickSound() {
  if (!isUiClickSoundEnabled()) return;
  const ctx = getAudioContext();

  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const t0 = ctx.currentTime;
      const tEnd = t0 + 0.058;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, t0);
      master.gain.exponentialRampToValueAtTime(0.11, t0 + 0.002);
      master.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, t0);
      filter.Q.setValueAtTime(0.7, t0);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(295, t0);

      osc.connect(filter);
      filter.connect(master);
      master.connect(ctx.destination);

      osc.start(t0);
      osc.stop(tEnd);
      return;
    } catch {
      // thử fallback
    }
  }

  playSynthesizedWavFallback();
}

function isClickableTarget(el) {
  if (!el || el.nodeType !== 1) return false;
  const tag = el.tagName;
  if (tag === 'BUTTON') return true;
  if (tag === 'INPUT') {
    const type = String(el.type || '').toLowerCase();
    return type === 'submit' || type === 'button' || type === 'reset';
  }
  if (el.getAttribute('role') === 'button') return true;
  if (el.hasAttribute && el.hasAttribute('data-ui-click-sound')) return true;
  return false;
}

function isDisabled(el) {
  if (!el) return true;
  if (el.disabled) return true;
  if (el.getAttribute('aria-disabled') === 'true') return true;
  return false;
}

/**
 * Bắt click — capture. Mỗi pointerdown: cố gắng resume context (nhẹ).
 */
export function attachGlobalUiClickSound() {
  const onPointerDown = () => {
    primeAudioContext();
  };

  const onClick = (e) => {
    if (typeof e.button === 'number' && e.button !== 0) return;
    const node = e.target;
    if (!node || typeof node.closest !== 'function') return;
    const btn = node.closest(
      'button, [role="button"], [data-ui-click-sound], input[type="submit"], input[type="button"], input[type="reset"]'
    );
    if (!btn || !isClickableTarget(btn)) return;
    if (isDisabled(btn)) return;
    primeAudioContext();
    void playUiClickSound();
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('click', onClick, true);
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('click', onClick, true);
  };
}
