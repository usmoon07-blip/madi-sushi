// Bepul Render 15 daqiqa jimlikdan keyin serverni uxlatadi. GitHub'ning jadvali kechikib ishlaydi,
// shuning uchun ish vaqtida server o'z ochiq manziliga har 8 daqiqada so'rov yuboradi —
// bu so'rov Render orqali kirgani uchun "faollik" hisoblanadi va server uxlamaydi.
// KEEP_AWAKE: "off" — o'chirish, "always" — kecha-kunduz; bo'sh bo'lsa — ish vaqtida.
// KEEP_AWAKE_HOURS: UTC soatlar oralig'i, sukut bo'yicha "4-21" (Toshkent 09:00–02:00).
const config = require('../config/default');

const INTERVAL_MS = 8 * 60 * 1000;

function inHours(range) {
  const m = String(range).match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return true;
  const [from, to] = [Number(m[1]), Number(m[2])];
  const h = new Date().getUTCHours();
  return from <= to ? h >= from && h <= to : h >= from || h <= to;
}

function start() {
  const mode = (process.env.KEEP_AWAKE || '').trim().toLowerCase();
  // Faqat Render'ning bepul serverida kerak (mahalliy kompyuterda ishlamaydi)
  if (mode === 'off' || !config.publicUrl || !process.env.RENDER) return;
  const hours = (process.env.KEEP_AWAKE_HOURS || '4-21').trim();
  const url = `${config.publicUrl}/api/health`;
  setInterval(() => {
    if (mode !== 'always' && !inHours(hours)) return;
    fetch(url, { signal: AbortSignal.timeout(20000) }).catch(() => {});
  }, INTERVAL_MS).unref();
  console.log(`[keep-awake] Yoqildi: har 8 daqiqada (${mode === 'always' ? 'doim' : `UTC ${hours}`})`);
}

module.exports = { start };
