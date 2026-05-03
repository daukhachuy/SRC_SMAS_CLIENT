/**
 * Phí ship theo khoảng cách — khớp bậc backend (≤5km → 15k; ≤10km → 25k; còn lại → 40k).
 */
export function deliveryFeeFromDistanceKm(km) {
  const d = Number(km);
  if (!Number.isFinite(d) || d < 0) return 40000;
  if (d <= 5) return 15000;
  if (d <= 10) return 25000;
  return 40000;
}

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function parseEnvCoord(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function geocodeNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'vi,en' },
    referrerPolicy: 'no-referrer',
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = Number(data[0].lat);
  const lon = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

/** Photon (Komoot) — thường hoạt động khi Nominatim bị chặn từ localhost. */
async function geocodePhoton(query) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=vi`;
  const res = await fetch(url, { referrerPolicy: 'no-referrer' });
  if (!res.ok) return null;
  const data = await res.json();
  const f = data?.features?.[0];
  const coords = f?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

/** Open-Meteo Geocoding — CORS mở, dự phòng thứ ba. */
async function geocodeOpenMeteo(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=vi&format=json`;
  const res = await fetch(url, { referrerPolicy: 'no-referrer' });
  if (!res.ok) return null;
  const data = await res.json();
  const r = data?.results?.[0];
  if (!r || r.latitude == null || r.longitude == null) return null;
  const lat = Number(r.latitude);
  const lon = Number(r.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

/**
 * Geocode địa chỉ: Nominatim → Photon → Open-Meteo (nhiều biến thể chuỗi).
 */
function shortenAddressForGeocode(raw) {
  const s = String(raw || '').trim();
  const q = s.match(/Quận\s+[^,]+/i);
  const tp = s.match(/Thành phố\s+[^,]+/i);
  if (q && tp) return `${q[0]}, ${tp[0]}, Việt Nam`;
  return null;
}

export async function geocodeAddressToLatLng(address) {
  const raw = String(address || '').trim();
  if (!raw) return null;

  const short = shortenAddressForGeocode(raw);
  const variants = [
    `${raw}, Vietnam`,
    raw,
    raw.replace(/,\s*Việt Nam\s*$/i, '').trim(),
    ...(short ? [short] : []),
  ];
  const uniq = [...new Set(variants.filter(Boolean))];

  for (const q of uniq) {
    for (const fn of [geocodeNominatim, geocodePhoton, geocodeOpenMeteo]) {
      try {
        const pt = await fn(q);
        if (pt) return pt;
      } catch {
        /* thử nguồn / chuỗi kế */
      }
    }
  }
  return null;
}

/**
 * Ước tính phí trên client: điểm xuất phát (cửa hàng/kho) → địa chỉ giao (Haversine, bậc 5/10 km).
 * Mặc định: trung tâm Đà Nẵng (gần khu vực ship nội thành backend thường dùng).
 * Địa chỉ trên hoá đơn giỏ (vd. Điện Bàn) có thể là chi nhánh — nếu BE tính từ điểm khác, đặt
 * REACT_APP_DELIVERY_ORIGIN_LAT / LNG trùng tọa độ trong code C#.
 */
export async function estimateDeliveryFeeFromAddressClient(address) {
  const originLat = parseEnvCoord('REACT_APP_DELIVERY_ORIGIN_LAT', 16.0544);
  const originLon = parseEnvCoord('REACT_APP_DELIVERY_ORIGIN_LNG', 108.2022);

  const dest = await geocodeAddressToLatLng(address);
  if (!dest) {
    const fb = process.env.REACT_APP_DELIVERY_FEE;
    if (fb !== undefined && fb !== '') {
      const n = Number(fb);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    console.warn(
      '[deliveryFee] Không geocode được địa chỉ — dùng mặc định 25.000đ. Thêm API POST /order/delivery-fee-estimate hoặc REACT_APP_DELIVERY_ORIGIN_LAT/LNG + geocode ổn định.'
    );
    return 25000;
  }

  const km = haversineDistanceKm(originLat, originLon, dest.lat, dest.lon);
  return deliveryFeeFromDistanceKm(km);
}
