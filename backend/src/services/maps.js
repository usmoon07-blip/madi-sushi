// Yandex havolalari: telefonda Yandex Maps ilovasini, kompyuterda saytni ochadi
function yandexRouteUrl({ lat, lon, address }) {
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return `https://yandex.uz/maps/?rtext=~${lat},${lon}&rtt=auto&z=16`;
  }
  if (address) return `https://yandex.uz/maps/?text=${encodeURIComponent(address)}`;
  return null;
}

function yandexNaviUrl({ lat, lon }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
}

module.exports = { yandexRouteUrl, yandexNaviUrl };
