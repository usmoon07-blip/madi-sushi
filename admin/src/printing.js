// Brauzer orqali chek chop etish (USB yoki Windows'ga ulangan har qanday printer)
import { useSyncExternalStore } from 'react';
import { money } from './format.js';

const DEVICE_KEY = 'madi_kitchen_printer';

// ---- Printer sozlamalari uchun kichik umumiy store ----
let config = null;
const listeners = new Set();
export const printerConfig = {
  get: () => config,
  set: (next) => {
    config = next;
    listeners.forEach((fn) => fn());
  },
  subscribe: (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
export const usePrinterConfig = () => useSyncExternalStore(printerConfig.subscribe, printerConfig.get);

// ---- Shu kompyuter chek chiqaradimi (har bir qurilmada alohida) ----
export const device = {
  isKitchen: () => {
    try {
      return localStorage.getItem(DEVICE_KEY) === '1';
    } catch {
      return false;
    }
  },
  setKitchen: (on) => {
    try {
      if (on) localStorage.setItem(DEVICE_KEY, '1');
      else localStorage.removeItem(DEVICE_KEY);
    } catch {
      /* ignore */
    }
    if (config) printerConfig.set({ ...config });
  },
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const pad = (n) => String(n).padStart(2, '0');
const dateText = (iso) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function receiptBody(o, { reprint }) {
  const isDelivery = o.deliveryType === 'DELIVERY';
  return `
  <div class="r">
    <div class="c brand">MADI SUSHI</div>
    <div class="c">${reprint ? 'OSHXONA CHEKI (NUSXA)' : 'OSHXONA CHEKI'}</div>
    <div class="sep2"></div>
    <div class="c num">#${o.id}</div>
    <div class="c">${dateText(o.createdAt)}</div>
    <div class="c type">${isDelivery ? 'YETKAZIB BERISH' : 'OLIB KETISH'}</div>
    <div class="sep2"></div>
    ${o.items.map((i) => `<div class="item"><b>${i.qty} ×</b> ${esc(i.name)}</div>`).join('')}
    <div class="sep"></div>
    ${o.comment ? `<div class="note"><b>IZOH:</b> ${esc(o.comment)}</div><div class="sep"></div>` : ''}
    <div class="row"><span>Mahsulotlar</span><span>${money(o.subtotal)}</span></div>
    ${o.deliveryFee ? `<div class="row"><span>Yetkazib berish</span><span>${money(o.deliveryFee)}</span></div>` : ''}
    <div class="row total"><span>JAMI</span><span>${money(o.total)}</span></div>
    <div class="row total"><span>To'lov</span><span>${o.paymentType === 'CARD' ? 'KARTA' : 'NAQD'}</span></div>
    <div class="sep"></div>
    <div>Mijoz: ${esc(o.customerName)}</div>
    <div><b>Tel: ${esc(o.phone)}</b></div>
    ${isDelivery ? `<div>Manzil: ${esc(o.address || "lokatsiya bo'yicha")}</div>` : ''}
    ${isDelivery && o.addressNote ? `<div>${esc(o.addressNote)}</div>` : ''}
    <div class="sep2"></div>
    <div class="c">Yoqimli ishtaha!</div>
  </div>`;
}

export function receiptHtml(order, { paperWidth = 80, copies = 1, reprint = false } = {}) {
  const content = Number(paperWidth) === 58 ? 48 : 72;
  const body = Array.from({ length: copies }, () => receiptBody(order, { reprint })).join('<div class="cut"></div>');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Chek #${order.id}</title><style>
    @page { size: ${paperWidth}mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; background: #fff; font: 12px/1.35 Arial, Helvetica, sans-serif; }
    .r { width: ${content}mm; margin: 0 auto; padding: 3mm 0 6mm; }
    .c { text-align: center; }
    .brand { font-size: 18px; font-weight: 800; letter-spacing: 2px; }
    .num { font-size: 30px; font-weight: 800; margin: 2px 0; }
    .type { font-size: 15px; font-weight: 800; margin-top: 2px; }
    .item { font-size: 16px; font-weight: 700; margin: 3px 0; }
    .note { font-size: 14px; font-weight: 700; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .total { font-weight: 800; font-size: 14px; }
    .sep { border-top: 1px dashed #000; margin: 6px 0; }
    .sep2 { border-top: 2px solid #000; margin: 6px 0; }
    .cut { page-break-after: always; break-after: page; }
  </style></head><body>${body}</body></html>`;
}

// Chop etishlar ketma-ket bajariladi
let chain = Promise.resolve();

function printOnce(html) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);
    const done = () => {
      setTimeout(() => {
        iframe.remove();
        resolve();
      }, 500);
    };
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        done();
      }
    };
    iframe.srcdoc = html;
  });
}

export function printReceipt(order, opts) {
  chain = chain.then(() => printOnce(receiptHtml(order, opts))).catch(() => {});
  return chain;
}

export const SAMPLE_ORDER = {
  id: 0,
  createdAt: new Date().toISOString(),
  deliveryType: 'DELIVERY',
  paymentType: 'CASH',
  items: [
    { productId: 1, name: 'Filadelfiya', qty: 2, price: 89000 },
    { productId: 2, name: 'Coca-Cola 0.5', qty: 1, price: 12000 },
  ],
  comment: 'Sinov cheki — printer ishlayapti',
  subtotal: 190000,
  deliveryFee: 0,
  total: 190000,
  customerName: 'Sinov',
  phone: '+998 90 000 00 00',
  address: "Toshkent, Foziltepa ko'chasi, 40",
};
