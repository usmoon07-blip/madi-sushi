const config = require('../config/default');

const cache = new Map();
const TIMEOUT_MS = 7000;

const coordsText = (lat, lon) => `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

async function viaYandex(lat, lon) {
  const url =
    `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(config.yandexGeocoderKey)}` +
    `&geocode=${lon},${lat}&format=json&lang=uz_UZ&results=1&kind=house`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`yandex ${res.status}`);
  const data = await res.json();
  const obj = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  return obj?.metaDataProperty?.GeocoderMetaData?.text || null;
}

async function viaNominatim(lat, lon) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}` +
    `&zoom=18&addressdetails=1&accept-language=uz,ru`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MadiSushiBot/1.0 (Telegram Mini App)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = await res.json();
  const a = data.address || {};
  const street = [a.road || a.pedestrian || a.street, a.house_number].filter(Boolean).join(', ');
  const parts = [
    a.city || a.town || a.village || a.state,
    a.city_district || a.district || a.county,
    a.suburb || a.neighbourhood || a.quarter,
    street,
  ].filter(Boolean);
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  return unique.length ? unique.join(', ') : data.display_name || null;
}

async function reverseGeocode(lat, lon) {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key);

  let address = null;
  try {
    if (config.yandexGeocoderKey) address = await viaYandex(lat, lon);
  } catch (err) {
    console.warn('[geocode] Yandex xatosi:', err.message);
  }
  if (!address) {
    try {
      address = await viaNominatim(lat, lon);
    } catch (err) {
      console.warn('[geocode] Nominatim xatosi:', err.message);
    }
  }

  const result = { address: address || coordsText(lat, lon), exact: Boolean(address) };
  if (address) {
    if (cache.size > 2000) cache.clear();
    cache.set(key, result);
  }
  return result;
}

// ---- Manzilni nomi bo'yicha qidirish (Toshkent atrofida) ----
const BOX = { west: 68.9, south: 41.1, east: 69.65, north: 41.5 };
const searchCache = new Map();

async function searchYandex(q) {
  const url =
    `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(config.yandexGeocoderKey)}` +
    `&geocode=${encodeURIComponent(q)}&format=json&lang=uz_UZ&results=6` +
    `&bbox=${BOX.west},${BOX.south}~${BOX.east},${BOX.north}&rspn=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`yandex ${res.status}`);
  const data = await res.json();
  return (data?.response?.GeoObjectCollection?.featureMember || []).map(({ GeoObject: g }) => {
    const [lon, lat] = g.Point.pos.split(' ').map(Number);
    return { address: g.metaDataProperty?.GeocoderMetaData?.text || g.name, lat, lon };
  });
}

async function searchNominatim(q) {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=uz&bounded=1` +
    `&viewbox=${BOX.west},${BOX.north},${BOX.east},${BOX.south}&accept-language=uz,ru&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MadiSushiBot/1.0 (Telegram Mini App)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = await res.json();
  return data.map((r) => ({
    address: r.display_name.split(', ').filter((p) => !/^\d{6}$/.test(p) && p !== "O'zbekiston" && p !== 'Oʻzbekiston').slice(0, 5).join(', '),
    lat: Number(r.lat),
    lon: Number(r.lon),
  }));
}

async function searchAddress(q) {
  const key = q.toLowerCase();
  if (searchCache.has(key)) return searchCache.get(key);
  let results = [];
  try {
    if (config.yandexGeocoderKey) results = await searchYandex(q);
  } catch (err) {
    console.warn('[geocode] Yandex qidiruv xatosi:', err.message);
  }
  if (!results.length) {
    try {
      results = await searchNominatim(q);
    } catch (err) {
      console.warn('[geocode] Nominatim qidiruv xatosi:', err.message);
    }
  }
  results = results.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));
  if (results.length) {
    if (searchCache.size > 1000) searchCache.clear();
    searchCache.set(key, results);
  }
  return results;
}

module.exports = { reverseGeocode, searchAddress };
