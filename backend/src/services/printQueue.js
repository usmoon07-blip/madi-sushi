// Oshxona cheklarini tarmoq printeriga avtomatik chiqarish
const config = require('../config/default');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { buildReceipt } = require('./receipt');
const { printLines, columnsFor } = require('./printer');

const INTERVAL_MS = 5000;
let running = false;
let lastError = null;
let lastErrorLoggedAt = 0;

const status = () => ({ lastError });

async function printOrder(order, settings, { reprint = false } = {}) {
  const lines = buildReceipt(order, { width: columnsFor(settings.paperWidth), reprint });
  await printLines(settings.printerIp, lines, reprint ? 1 : settings.printCopies);
}

async function processQueue() {
  if (running) return;
  running = true;
  try {
    const settings = await Settings.get();
    // Internetdagi server ichki tarmoq printeriga ulana olmaydi
    if (config.publicUrl || !settings.printerIp || settings.printMode === 'OFF') return;
    const orders = await Order.printQueue(settings.printMode);
    for (const order of orders) {
      if (!(await Order.claimPrint(order.id))) continue;
      try {
        await printOrder(order, settings);
        lastError = null;
        console.log(`[printer] #${order.id} cheki chiqarildi`);
      } catch (err) {
        await Order.releasePrint(order.id);
        lastError = err.message;
        // Printer o'chiq bo'lsa, logni har daqiqada bir martadan ortiq to'ldirmaymiz
        if (Date.now() - lastErrorLoggedAt > 60_000) {
          console.warn(`[printer] ${err.message}. Qayta urinilmoqda...`);
          lastErrorLoggedAt = Date.now();
        }
        break;
      }
    }
  } catch (err) {
    console.warn('[printer]', err.message);
  } finally {
    running = false;
  }
}

// Buyurtma kelganda yoki holati o'zgarganda darhol tekshirish
const kick = () => {
  processQueue();
};

function start() {
  setInterval(processQueue, INTERVAL_MS).unref();
  processQueue();
}

module.exports = { start, kick, printOrder, status };
