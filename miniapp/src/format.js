export const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ')} so'm`;

export const STATUS = {
  NEW: { label: 'Qabul qilindi', tone: 'red' },
  ACCEPTED: { label: 'Tayyorlanmoqda', tone: 'amber' },
  ON_WAY: { label: "Yo'lda", tone: 'blue' },
  DONE: { label: 'Yakunlandi', tone: 'green' },
  CANCELLED: { label: 'Bekor qilindi', tone: 'gray' },
};

export function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "+998 90 123 45 67" ko'rinishida yozib borish
export function formatPhoneInput(value) {
  let d = String(value).replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return `+998${parts.length ? ' ' : ''}${parts.join(' ')}`;
}

export const isValidPhone = (value) => /^998\d{9}$/.test(String(value).replace(/\D/g, ''));

export const yandexMapUrl = (lat, lon) => `https://yandex.uz/maps/?pt=${lon},${lat}&z=17&l=map`;
export const yandexSearchUrl = (text) => `https://yandex.uz/maps/?text=${encodeURIComponent(text)}`;

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
