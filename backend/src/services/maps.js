// Yandex havolalari: telefonda ilovani, kompyuterda saytni ochadi

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const fix = (n) => Number(n).toFixed(6);

function yandexRouteUrl({ lat, lon, address }) {
  if (isNum(lat) && isNum(lon)) return `https://yandex.uz/maps/?rtext=~${fix(lat)},${fix(lon)}&rtt=auto&z=16`;
  if (address) return `https://yandex.uz/maps/?text=${encodeURIComponent(address)}`;
  return null;
}

function yandexNaviUrl({ lat, lon }) {
  if (!isNum(lat) || !isNum(lon)) return null;
  return `yandexnavi://build_route_on_map?lat_to=${fix(lat)}&lon_to=${fix(lon)}`;
}

/**
 * Yandex Go — "Dostavka" bo'limi. "Qayerga" = mijoz nuqtasi, "Qayerdan" = filial (bo'lsa).
 * Rasmiy format: https://3.redirect.appmetrica.yandex.com/route?...&vertical=delivery
 * (3 — Yandex Go ilovasi kodi; tracking_id — ilova o'rnatilmagan bo'lsa do'konga yo'naltiradi)
 */
function yandexGoUrl({ lat, lon }, shop = {}) {
  if (!isNum(lat) || !isNum(lon)) return null;
  const params = new URLSearchParams();
  if (isNum(shop.shopLat) && isNum(shop.shopLon)) {
    params.set('start-lat', fix(shop.shopLat));
    params.set('start-lon', fix(shop.shopLon));
  }
  params.set('end-lat', fix(lat));
  params.set('end-lon', fix(lon));
  params.set('vertical', 'delivery');
  params.set('ref', 'madisushi');
  params.set('appmetrica_tracking_id', '1178268795219780156');
  return `https://3.redirect.appmetrica.yandex.com/route?${params}`;
}

// O'zbekiston hududi (koordinatalar almashib qolganini aniqlash uchun)
const inUz = (lat, lon) => lat >= 37 && lat <= 46 && lon >= 55 && lon <= 74;

/**
 * Matndan koordinata ajratadi:
 *  "41.311, 69.279" · Yandex havolasi (ll=/pt=/whatshere — lon,lat) · Google havolasi (@lat,lon yoki q=lat,lon)
 */
function parseCoords(input) {
  const text = decodeURIComponent(String(input || '').trim());
  if (!text) return null;
  const pair = (a, b) => [Number(a), Number(b)];
  let lat;
  let lon;

  const yandex = text.match(/(?:[?&](?:ll|pt)=|whatshere\[point\]=)(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const google = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) || text.match(/[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  const plain = text.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);

  if (yandex) [lon, lat] = pair(yandex[1], yandex[2]);
  else if (google) [lat, lon] = pair(google[1], google[2]);
  else if (plain) [lat, lon] = pair(plain[1], plain[2]);
  else return null;

  if (!inUz(lat, lon) && inUz(lon, lat)) [lat, lon] = [lon, lat];
  if (!isNum(lat) || !isNum(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

module.exports = { yandexRouteUrl, yandexNaviUrl, yandexGoUrl, parseCoords };
