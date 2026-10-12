// Qurilishdan oldin menyu nusxasini serverdan oladi (src/menu-snapshot.json).
// Server javob bermasa — omborda saqlangan eski nusxa ishlatiladi, qurilish to'xtamaydi.
import { writeFileSync } from 'node:fs';

const api = (process.env.VITE_API_URL || '').replace(/\/+$/, '');
const out = new URL('../src/menu-snapshot.json', import.meta.url);

if (!api) {
  console.log('[snapshot] VITE_API_URL yo‘q — saqlangan nusxa ishlatiladi');
  process.exit(0);
}

try {
  // Bepul server uxlab yotgan bo'lsa, uyg'onishi uchun 90 soniya kutamiz
  const res = await fetch(`${api}/menu`, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.products) || !data.products.length) throw new Error("menyu bo'sh");
  writeFileSync(out, `${JSON.stringify({ generatedAt: new Date().toISOString(), ...data }, null, 2)}\n`);
  console.log(`[snapshot] ✅ ${data.products.length} ta mahsulot saqlandi`);
} catch (err) {
  console.warn(`[snapshot] Serverdan olinmadi (${err.message}) — saqlangan nusxa ishlatiladi`);
}
