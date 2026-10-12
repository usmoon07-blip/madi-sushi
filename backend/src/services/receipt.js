const { money } = require('./format');

const pad = (n) => String(n).padStart(2, '0');
const dateText = (d) => {
  const x = new Date(d);
  return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

// Termoprinterlar faqat lotin harflarini to'g'ri chiqaradi: o'zbekcha belgilarni moslaymiz
function toAscii(text) {
  return String(text ?? '')
    .replace(/[ʻʼ‘’`´]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/×/g, 'x')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e\n]/g, '');
}

// Matnni ustun kengligiga bo'lish
function wrap(text, width) {
  const words = toAscii(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (!line) line = w.slice(0, width);
    else if (line.length + 1 + w.length <= width) line += ` ${w}`;
    else {
      lines.push(line);
      line = w.slice(0, width);
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

const twoCols = (left, right, width) => {
  const r = toAscii(right);
  const l = toAscii(left).slice(0, Math.max(1, width - r.length - 1));
  return l + ' '.repeat(Math.max(1, width - l.length - r.length)) + r;
};

/**
 * Chekni qatorlarga aylantiradi.
 * Har bir qator: { text, align?: 'left'|'center', bold?: bool, big?: bool }
 */
function buildReceipt(order, { width = 48, brand = 'MADI SUSHI', reprint = false } = {}) {
  const L = [];
  const add = (text, opts = {}) => L.push({ text: toAscii(text), ...opts });
  const sep = (ch = '-') => add(ch.repeat(width));
  const isDelivery = order.deliveryType === 'DELIVERY';

  add(brand, { align: 'center', bold: true, big: true });
  add(reprint ? 'OSHXONA CHEKI (NUSXA)' : 'OSHXONA CHEKI', { align: 'center' });
  sep('=');
  add(`BUYURTMA #${order.id}`, { align: 'center', bold: true, big: true });
  add(dateText(order.createdAt), { align: 'center' });
  add(isDelivery ? '>>> YETKAZIB BERISH <<<' : '>>> OLIB KETISH <<<', { align: 'center', bold: true });
  sep('=');

  for (const item of order.items) {
    const qty = `${item.qty} x `;
    wrap(item.name, Math.floor(width / 2) - qty.length).forEach((line, i) =>
      add(i === 0 ? `${qty}${line}` : `${' '.repeat(qty.length)}${line}`, { bold: true, big: true })
    );
  }
  sep();

  if (order.comment) {
    add('IZOH:', { bold: true });
    wrap(order.comment, width).forEach((l) => add(l, { bold: true }));
    sep();
  }

  add(twoCols('Mahsulotlar:', money(order.subtotal), width));
  if (order.deliveryFee) add(twoCols('Yetkazib berish:', money(order.deliveryFee), width));
  add(twoCols('JAMI:', money(order.total), width), { bold: true });
  add(twoCols("To'lov:", order.paymentType === 'CARD' ? 'KARTA' : 'NAQD', width), { bold: true });
  sep();

  add(`Mijoz: ${order.customerName}`);
  add(`Tel: ${order.phone}`, { bold: true });
  if (isDelivery) {
    wrap(`Manzil: ${order.address || 'lokatsiya bo\'yicha'}`, width).forEach((l) => add(l));
    if (order.addressNote) wrap(order.addressNote, width).forEach((l) => add(l));
  }
  sep('=');
  add('Yoqimli ishtaha!', { align: 'center' });
  return L;
}

module.exports = { buildReceipt, toAscii, dateText };
