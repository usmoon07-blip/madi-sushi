export const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ')} so'm`;

export const STATUSES = [
  { value: 'NEW', label: 'Yangi', tone: 'red' },
  { value: 'ACCEPTED', label: 'Tayyorlanmoqda', tone: 'amber' },
  { value: 'ON_WAY', label: "Yo'lda / Tayyor", tone: 'blue' },
  { value: 'DONE', label: 'Yakunlandi', tone: 'green' },
  { value: 'CANCELLED', label: 'Bekor qilindi', tone: 'gray' },
];
export const statusOf = (v) => STATUSES.find((s) => s.value === v) || STATUSES[0];

export const NEXT_STATUS = {
  NEW: { value: 'ACCEPTED', label: 'Qabul qilish' },
  ACCEPTED: { value: 'ON_WAY', label: "Jo'natish" },
  ON_WAY: { value: 'DONE', label: 'Yakunlash' },
};

export function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  const today = new Date();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === today.toDateString()) return `Bugun, ${time}`;
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${time}`;
}

export const yandexRoute = (o) =>
  o.lat != null && o.lon != null
    ? `https://yandex.uz/maps/?rtext=~${o.lat},${o.lon}&rtt=auto&z=16`
    : `https://yandex.uz/maps/?text=${encodeURIComponent(o.address || '')}`;
export const yandexNavi = (o) => `yandexnavi://build_route_on_map?lat_to=${o.lat}&lon_to=${o.lon}`;

const hasCoords = (o) => o?.lat != null && o?.lon != null;
const fix = (n) => Number(n).toFixed(6);

// Yandex Go — "Dostavka" bo'limi: "Qayerga" = mijoz nuqtasi, "Qayerdan" = filial (sozlamalarda bo'lsa)
export function yandexGo(o, settings) {
  if (!hasCoords(o)) return null;
  const p = new URLSearchParams();
  if (settings?.shopLat != null && settings?.shopLon != null) {
    p.set('start-lat', fix(settings.shopLat));
    p.set('start-lon', fix(settings.shopLon));
  }
  p.set('end-lat', fix(o.lat));
  p.set('end-lon', fix(o.lon));
  p.set('vertical', 'delivery');
  p.set('ref', 'madisushi');
  p.set('appmetrica_tracking_id', '1178268795219780156');
  return `https://3.redirect.appmetrica.yandex.com/route?${p}`;
}

// Kuryer uchun izoh: Yandex Go'dagi "Kuryerga izoh" maydoniga qo'yish uchun
export const courierNote = (o) =>
  [`Buyurtma #${o.id}`, `Mijoz: ${o.customerName}, ${o.phone}`, o.address, o.addressNote, o.paymentType === 'CASH' ? `Naqd: ${money(o.total)}` : "To'langan (karta)"]
    .filter(Boolean)
    .join('\n');

export const isTouchDevice = () => window.matchMedia?.('(pointer: coarse)').matches;
