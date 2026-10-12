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

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg?.initData || '',
        'ngrok-skip-browser-warning': '1',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Internet aloqasi yo'q. Qayta urinib ko'ring");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Xatolik yuz berdi. Qayta urinib ko'ring");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  bootstrap: () => request('/bootstrap'),
  menu: () => request('/menu'),
  me: () => request('/me'),
  savePhone: (phone) => request('/me/phone', { method: 'POST', body: { phone } }),
  geocode: (lat, lon) => request('/geocode', { method: 'POST', body: { lat, lon } }),
  orders: () => request('/orders'),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
};
