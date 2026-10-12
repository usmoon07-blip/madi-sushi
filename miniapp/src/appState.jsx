import { createContext, useContext } from 'react';

// Ilova bo'ylab umumiy holat: menyu, foydalanuvchi, manzil, yetkazish usuli, yoqtirilganlar, navigatsiya
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const LOC_KEY = 'madi_location_v1';
const MODE_KEY = 'madi_mode_v1';

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const storedLocation = {
  get: () => read(LOC_KEY),
  set: (loc) => write(LOC_KEY, loc),
};
export const storedMode = {
  get: () => (read(MODE_KEY) === 'PICKUP' ? 'PICKUP' : 'DELIVERY'),
  set: (mode) => write(MODE_KEY, mode),
};
export const hasLocation = (loc) => Boolean(loc && ((loc.lat != null && loc.lon != null) || loc.address));
