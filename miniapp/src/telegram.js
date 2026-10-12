export const tg = window.Telegram?.WebApp ?? null;
export const isTelegram = Boolean(tg?.initData);

const atLeast = (v) => Boolean(tg?.isVersionAtLeast?.(v));

// Telefon va planshetda (iPad ham) Mini App katta — butun ekranga ochilsin
const MOBILE = ['ios', 'android', 'android_x'];

function syncFullscreen() {
  document.documentElement.classList.toggle('is-fullscreen', Boolean(tg?.isFullscreen));
}

export function setupTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  try {
    if (atLeast('8.0')) {
      tg.onEvent('fullscreenChanged', syncFullscreen);
      tg.onEvent('fullscreenFailed', () => tg.expand());
      if (MOBILE.includes(tg.platform) && !tg.isFullscreen) tg.requestFullscreen();
      syncFullscreen();
    }
  } catch {
    /* fullscreen qo'llanmasa — oddiy expand qoladi */
  }
  try {
    if (atLeast('6.1')) {
      tg.setHeaderColor('#0a0a0b');
      tg.setBackgroundColor('#0a0a0b');
    }
    if (atLeast('7.10')) tg.setBottomBarColor('#0a0a0b');
    if (atLeast('7.7')) tg.disableVerticalSwipes();
  } catch {
    /* eski Telegram versiyalari */
  }
}

export const haptic = {
  tap: () => atLeast('6.1') && tg.HapticFeedback.impactOccurred('light'),
  success: () => atLeast('6.1') && tg.HapticFeedback.notificationOccurred('success'),
  error: () => atLeast('6.1') && tg.HapticFeedback.notificationOccurred('error'),
};

export function closeApp() {
  if (tg) tg.close();
}

export function openLink(url) {
  if (tg && atLeast('6.1')) tg.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

export function onBackButton(handler) {
  if (!tg || !atLeast('6.1')) return () => {};
  tg.BackButton.onClick(handler);
  tg.BackButton.show();
  return () => {
    tg.BackButton.offClick(handler);
    tg.BackButton.hide();
  };
}

const browserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? 'denied' : 'unavailable')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });

// Avval Telegram LocationManager (Bot API 8.0+), bo'lmasa brauzer geolokatsiyasi
export function getLocation() {
  const lm = tg?.LocationManager;
  if (!lm || !atLeast('8.0')) return browserLocation();
  return new Promise((resolve, reject) => {
    const request = () => {
      if (!lm.isLocationAvailable) return browserLocation().then(resolve, reject);
      lm.getLocation((data) => {
        if (data) resolve({ lat: data.latitude, lon: data.longitude });
        else reject(new Error(lm.isAccessRequested && !lm.isAccessGranted ? 'denied' : 'unavailable'));
      });
    };
    if (lm.isInited) request();
    else lm.init(request);
  });
}

export function openLocationSettings() {
  try {
    tg?.LocationManager?.openSettings();
  } catch {
    /* ignore */
  }
}

// Telegram'dagi telefon raqamni so'rash (Bot API 6.9+)
export function requestPhone() {
  return new Promise((resolve) => {
    if (!tg || !atLeast('6.9')) return resolve({ ok: false, phone: null });
    tg.requestContact((ok, response) => {
      resolve({ ok, phone: response?.responseUnsafe?.contact?.phone_number || null });
    });
  });
}
