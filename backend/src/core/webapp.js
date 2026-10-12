const config = require('../config/default');
const { bot } = require('./bot');

// Mini App manzili: .env dagi WEBAPP_URL yoki ishlab turgan ngrok'dan avtomatik olinadi
let currentUrl = config.webappUrl || null;
const listeners = new Set();

const getUrl = () => currentUrl;
const onChange = (fn) => listeners.add(fn);

async function setUrl(url) {
  if (!url || url === currentUrl) return;
  currentUrl = url;
  console.log(`[webapp] Mini App manzili: ${url}`);
  for (const fn of listeners) {
    try {
      await fn(url);
    } catch (err) {
      console.warn('[webapp]', err.message);
    }
  }
}

async function readNgrokUrl() {
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = await res.json();
    const tunnel = (data.tunnels || []).find((t) => String(t.public_url).startsWith('https://'));
    return tunnel ? tunnel.public_url.replace(/\/+$/, '') : null;
  } catch {
    return null;
  }
}

async function updateMenuButton(url) {
  if (!bot) return;
  await bot.api.setChatMenuButton({
    menu_button: { type: 'web_app', text: '🍣 Menyu', web_app: { url } },
  });
  console.log("[bot] Menyu tugmasi yangilandi");
}

function start() {
  onChange(updateMenuButton);
  if (config.webappUrl) {
    updateMenuButton(config.webappUrl).catch((err) => console.warn('[bot] Menyu tugmasi:', err.message));
    return;
  }
  let warned = false;
  const tick = async () => {
    const url = await readNgrokUrl();
    if (url) await setUrl(url);
    else if (!currentUrl && !warned) {
      warned = true;
      console.log('[webapp] ngrok topilmadi. Boshqa oynada "ngrok http 3000" ni ishga tushiring.');
    }
  };
  tick();
  setInterval(tick, 5000).unref();
}

module.exports = { getUrl, onChange, start };
