import { tg } from './telegram.js';

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
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
  me: () => request('/me'),
  savePhone: (phone) => request('/me/phone', { method: 'POST', body: { phone } }),
  geocode: (lat, lon) => request('/geocode', { method: 'POST', body: { lat, lon } }),
  orders: () => request('/orders'),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
};
