import { tg } from './telegram.js';

// Vercel'da: VITE_API_URL = https://SERVER.onrender.com/api. Server bilan birga bo'lsa — nisbiy /api
export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const API_ORIGIN = API_BASE.startsWith('http') ? new URL(API_BASE).origin : '';

// Bazadagi rasm yo'llari (/uploads/...) server manzilida turadi; /static/... ilova bilan birga keladi
export const mediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  return url;
};

let currentLang = 'uz';
export const setApiLang = (lang) => {
  currentLang = lang;
};

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg?.initData || '',
        'ngrok-skip-browser-warning': '1',
        'X-Lang': currentLang,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(currentLang === 'ru' ? 'Нет подключения к интернету. Попробуйте снова' : "Internet aloqasi yo'q. Qayta urinib ko'ring");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || (currentLang === 'ru' ? 'Произошла ошибка. Попробуйте снова' : "Xatolik yuz berdi. Qayta urinib ko'ring"));
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  bootstrap: () => request('/bootstrap'),
  menu: () => request('/menu'),
  setLang: (lang) => request('/me/lang', { method: 'POST', body: { lang } }),
  saveLocation: (loc) => request('/me/location', { method: 'POST', body: loc }),
  toggleFavorite: (id) => request(`/favorites/${id}`, { method: 'POST' }),
  review: (rating, text) => request('/reviews', { method: 'POST', body: { rating, text } }),
  me: () => request('/me'),
  savePhone: (phone) => request('/me/phone', { method: 'POST', body: { phone } }),
  geocode: (lat, lon) => request('/geocode', { method: 'POST', body: { lat, lon } }),
  orders: () => request('/orders'),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
};
