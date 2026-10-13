const fs = require('fs');
const path = require('path');
const config = require('../config/default');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Branch = require('../models/Branch');
const { resolveCoords } = require('../services/maps');
const { searchAddress } = require('../services/geocode');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { createAdminToken, safeEqual, recordLoginFailure, clearLoginFailures } = require('../middlewares/auth.middleware');
const Upload = require('../models/Upload');
const { HttpError } = require('./cartController');
const botController = require('./botController');
const { bot } = require('../core/bot');
const printQueue = require('../services/printQueue');
const { parseAddress } = require('../services/printer');

const STATUSES = ['NEW', 'ACCEPTED', 'ON_WAY', 'DONE', 'CANCELLED'];

const parseId = (v) => {
  const id = Number(v);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Noto'g'ri ID");
  return id;
};
const intOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(String(v).replace(/\s/g, '')));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

async function login(req, res) {
  const password = String(req.body?.password || '');
  if (!config.adminPassword || !safeEqual(password, config.adminPassword)) {
    recordLoginFailure(req.ip);
    throw new HttpError(401, "Parol noto'g'ri");
  }
  clearLoginFailures(req.ip);
  res.json({ token: createAdminToken() });
}

// ---- Buyurtmalar ----
async function listOrders(req, res) {
  const status = String(req.query.status || '');
  if (status && status !== 'ACTIVE' && !STATUSES.includes(status)) throw new HttpError(400, "Noto'g'ri holat");
  const [orders, stats] = await Promise.all([Order.listForAdmin({ status: status || undefined }), Order.stats()]);
  res.json({ orders, stats });
}

// Mijoz botga yuborgan to'lov chekini Telegram'dan olib beradi (token brauzerga chiqmaydi)
async function getReceipt(req, res) {
  const id = parseId(req.params.id);
  const order = await Order.findById(id);
  if (!order?.receiptFileId) throw new HttpError(404, 'Chek yuborilmagan');
  if (!bot) throw new HttpError(503, 'Bot ulanmagan');
  const failed = new HttpError(502, "Chekni Telegramdan olib bo'lmadi. Chek botdagi xabarda ham bor");
  const file = await bot.api.getFile(order.receiptFileId).catch(() => null);
  if (!file?.file_path) throw failed;
  const root = (process.env.TELEGRAM_API_ROOT || 'https://api.telegram.org').replace(/\/+$/, '');
  const tg = await fetch(`${root}/file/bot${config.botToken}/${file.file_path}`).catch(() => null);
  if (!tg?.ok) throw failed;
  const ext = (file.file_path.split('.').pop() || '').toLowerCase();
  const type = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' }[ext] || 'application/octet-stream';
  res.set({ 'Content-Type': type, 'Cache-Control': 'private, max-age=3600' });
  res.send(Buffer.from(await tg.arrayBuffer()));
}

async function confirmReceipt(req, res) {
  const order = await botController.confirmOrderReceipt(parseId(req.params.id));
  if (!order) throw new HttpError(404, 'Chek topilmadi');
  printQueue.kick();
  res.json({ order });
}

async function rejectReceipt(req, res) {
  const order = await botController.rejectOrderReceipt(parseId(req.params.id));
  if (!order) throw new HttpError(404, 'Buyurtma topilmadi');
  res.json({ order });
}

async function updateOrderStatus(req, res) {
  const id = parseId(req.params.id);
  const status = String(req.body?.status || '');
  if (!STATUSES.includes(status)) throw new HttpError(400, "Noto'g'ri holat");
  const current = await Order.findById(id);
  if (!current) throw new HttpError(404, 'Buyurtma topilmadi');
  if (current.status === status) return res.json({ order: current });
  const order = await Order.updateStatus(id, status);
  botController.notifyStatus(order).catch((err) => console.warn('[admin] notify:', err.message));
  printQueue.kick();
  return res.json({ order });
}

// ---- Oshxona cheki ----
async function getPrintQueue(req, res) {
  const settings = await Settings.get();
  // Tarmoq printeri ulangan bo'lsa, cheklarni server o'zi chiqaradi
  if ((settings.printerIp && !config.publicUrl) || settings.printMode === 'OFF') return res.json({ orders: [] });
  return res.json({ orders: await Order.printQueue(settings.printMode) });
}

async function claimPrint(req, res) {
  res.json({ claimed: await Order.claimPrint(parseId(req.params.id)) });
}

async function printOrderNow(req, res) {
  const settings = await Settings.get();
  if (!settings.printerIp) throw new HttpError(400, 'Tarmoq printeri sozlanmagan');
  const order = await Order.findById(parseId(req.params.id));
  if (!order) throw new HttpError(404, 'Buyurtma topilmadi');
  try {
    await printQueue.printOrder(order, settings, { reprint: true });
  } catch (err) {
    throw new HttpError(502, err.message);
  }
  res.json({ ok: true });
}

async function printTest(req, res) {
  const settings = await Settings.get();
  if (!settings.printerIp) throw new HttpError(400, 'Avval printer IP manzilini kiriting va saqlang');
  const sample = {
    id: 0,
    createdAt: new Date(),
    deliveryType: 'DELIVERY',
    paymentType: 'CASH',
    items: [
      { name: 'Filadelfiya', qty: 2, price: 89000 },
      { name: "Coca-Cola 0.5", qty: 1, price: 12000 },
    ],
    comment: 'Sinov cheki - printer ishlayapti',
    subtotal: 190000,
    deliveryFee: 0,
    total: 190000,
    customerName: 'Sinov',
    phone: '+998 90 000 00 00',
    address: settings.pickupAddress,
  };
  try {
    await printQueue.printOrder(sample, settings, { reprint: false });
  } catch (err) {
    throw new HttpError(502, err.message);
  }
  res.json({ ok: true });
}

// ---- Mahsulotlar ----
function productData(body, { partial = false } = {}) {
  const data = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has('name')) {
    const name = String(body.name || '').trim();
    if (!name) throw new HttpError(400, 'Mahsulot nomini kiriting');
    data.name = name.slice(0, 80);
  }
  if (!partial || has('categoryId')) {
    const categoryId = Number(body.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) throw new HttpError(400, 'Kategoriyani tanlang');
    data.categoryId = categoryId;
  }
  if (!partial || has('price')) {
    const price = intOrNull(body.price);
    if (!price || Number.isNaN(price)) throw new HttpError(400, "Narxni to'g'ri kiriting");
    data.price = price;
  }
  if (has('oldPrice')) {
    const oldPrice = intOrNull(body.oldPrice);
    if (Number.isNaN(oldPrice)) throw new HttpError(400, "Eski narx noto'g'ri");
    data.oldPrice = oldPrice || null;
  }
  if (has('nameRu')) data.nameRu = String(body.nameRu || '').trim().slice(0, 80);
  if (has('description')) data.description = String(body.description || '').trim().slice(0, 500);
  if (has('descriptionRu')) data.descriptionRu = String(body.descriptionRu || '').trim().slice(0, 500);
  if (has('isHit')) data.isHit = Boolean(body.isHit);
  if (has('imageUrl')) data.imageUrl = String(body.imageUrl || '').trim().slice(0, 500);
  const list = (v) =>
    (Array.isArray(v) ? v : String(v || '').split(/[\n,]/))
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 20)
      .map((x) => x.slice(0, 60));
  if (has('ingredients')) data.ingredients = list(body.ingredients);
  if (has('ingredientsRu')) data.ingredientsRu = list(body.ingredientsRu);
  if (has('isActive')) data.isActive = Boolean(body.isActive);
  if (has('sortOrder')) data.sortOrder = Math.round(Number(body.sortOrder)) || 0;

  if (data.oldPrice && data.price && data.oldPrice <= data.price) data.oldPrice = null;
  return data;
}

async function listProducts(req, res) {
  res.json({ products: await Product.listAll() });
}

async function createProduct(req, res) {
  try {
    const product = await Product.create(productData(req.body || {}));
    res.status(201).json({ product });
  } catch (err) {
    if (err.code === 'P2003') throw new HttpError(400, 'Kategoriya topilmadi');
    throw err;
  }
}

// ---- Kategoriyalar ----
function categoryData(body, { partial = false } = {}) {
  const data = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  if (!partial || has('nameUz')) {
    const nameUz = String(body.nameUz || '').trim();
    if (!nameUz) throw new HttpError(400, 'Kategoriya nomini kiriting');
    data.nameUz = nameUz.slice(0, 40);
  }
  if (has('nameRu')) data.nameRu = String(body.nameRu || '').trim().slice(0, 40);
  if (has('imageUrl')) data.imageUrl = String(body.imageUrl || '').trim().slice(0, 500);
  if (has('sortOrder')) data.sortOrder = Math.round(Number(body.sortOrder)) || 0;
  if (has('isActive')) data.isActive = Boolean(body.isActive);
  return data;
}

async function listCategories(req, res) {
  res.json({ categories: await Category.listAll() });
}

async function createCategory(req, res) {
  res.status(201).json({ category: await Category.create(categoryData(req.body || {})) });
}

async function updateCategory(req, res) {
  res.json({ category: await Category.update(parseId(req.params.id), categoryData(req.body || {}, { partial: true })) });
}

async function deleteCategory(req, res) {
  // Kategoriya o'chsa, mahsulotlari o'chmaydi — "kategoriyasiz" bo'lib qoladi
  await Category.remove(parseId(req.params.id));
  res.json({ ok: true });
}

// ---- Filiallar ----
async function branchData(body, { partial = false } = {}) {
  const data = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  const text = (v, max) => String(v || '').trim().slice(0, max);
  if (!partial || has('name')) {
    data.name = text(body.name, 60);
    if (!data.name) throw new HttpError(400, 'Filial nomini kiriting');
  }
  if (!partial || has('address')) {
    data.address = text(body.address, 200);
    if (!data.address) throw new HttpError(400, 'Filial manzilini kiriting');
  }
  if (has('nameRu')) data.nameRu = text(body.nameRu, 60);
  if (has('phone')) data.phone = text(body.phone, 40);
  if (has('workHours')) data.workHours = text(body.workHours, 60);
  if (has('sortOrder')) data.sortOrder = Math.round(Number(body.sortOrder)) || 0;
  if (has('isActive')) data.isActive = Boolean(body.isActive);
  if (has('location')) {
    const raw = text(body.location, 500);
    if (!raw) Object.assign(data, { lat: null, lon: null });
    else {
      const c = await resolveCoords(raw);
      if (!c) throw new HttpError(400, "Lokatsiyani tushunib bo'lmadi. Xaritadan nuqtani tanlang yoki koordinata yozing: 41.2851, 69.2041");
      Object.assign(data, c);
    }
  }
  return data;
}

async function geocodeSearch(req, res) {
  const q = String(req.body?.q || '').trim().slice(0, 120);
  res.json({ results: q.length < 3 ? [] : await searchAddress(q) });
}

async function listBranches(req, res) {
  res.json({ branches: await Branch.listAll() });
}

async function createBranch(req, res) {
  res.status(201).json({ branch: await Branch.create(await branchData(req.body || {})) });
}

async function updateBranch(req, res) {
  res.json({ branch: await Branch.update(parseId(req.params.id), await branchData(req.body || {}, { partial: true })) });
}

async function deleteBranch(req, res) {
  // Eski buyurtmalar o'chmaydi — manzili buyurtmaning o'zida saqlangan
  await Branch.remove(parseId(req.params.id));
  res.json({ ok: true });
}

// ---- Otzivlar ----
async function listReviews(req, res) {
  res.json({ reviews: await Review.list() });
}

async function updateProduct(req, res) {
  const id = parseId(req.params.id);
  const product = await Product.update(id, productData(req.body || {}, { partial: true }));
  res.json({ product });
}

async function deleteProduct(req, res) {
  const id = parseId(req.params.id);
  const product = await Product.remove(id);
  if (product.imageUrl.startsWith('/uploads/')) {
    Upload.removeByUrl(product.imageUrl).catch(() => {});
    fs.promises.unlink(path.join(config.paths.uploads, path.basename(product.imageUrl))).catch(() => {});
  }
  res.json({ ok: true });
}

async function uploadImage(req, res) {
  if (!req.file) throw new HttpError(400, 'Rasm tanlanmadi (JPG, PNG yoki WEBP, 5 MB gacha)');
  const url = await Upload.save(req.file.buffer, req.file.mimetype);
  res.status(201).json({ url });
}

// ---- Sozlamalar ----
async function getSettings(req, res) {
  // cloud: server internetda (Render) — ichki tarmoqdagi printerga ulana olmaydi
  const settings = await Settings.get();
  res.json({
    settings: config.publicUrl ? { ...settings, printerIp: '' } : settings,
    printer: printQueue.status(),
    serverMode: config.publicUrl ? 'cloud' : 'local',
  });
}

async function updateSettings(req, res) {
  const body = req.body || {};
  const data = {};
  for (const key of ['minOrder']) {
    if (key in body) {
      const n = intOrNull(body[key]);
      if (n === null || Number.isNaN(n)) throw new HttpError(400, "Summalarni to'g'ri kiriting");
      data[key] = n;
    }
  }
  if ('pickupAddress' in body) data.pickupAddress = String(body.pickupAddress || '').trim().slice(0, 200);
  if ('contactPhone' in body) data.contactPhone = String(body.contactPhone || '').trim().slice(0, 40);
  if ('workHours' in body) data.workHours = String(body.workHours || '').trim().slice(0, 60);
  // "@nom", "instagram.com/nom" yoki to'liq havola — faqat nom saqlanadi
  if ('instagram' in body) {
    data.instagram = String(body.instagram || '')
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^(www\.)?instagram\.com\//i, '')
      .replace(/^@/, '')
      .split(/[/?#]/)[0]
      .slice(0, 60);
  }
  if ('aboutUz' in body) data.aboutUz = String(body.aboutUz || '').trim().slice(0, 2000);
  if ('aboutRu' in body) data.aboutRu = String(body.aboutRu || '').trim().slice(0, 2000);
  if ('isOpen' in body) data.isOpen = Boolean(body.isOpen);
  if ('printMode' in body) {
    if (!['OFF', 'NEW', 'ACCEPTED'].includes(body.printMode)) throw new HttpError(400, "Chek rejimi noto'g'ri");
    data.printMode = body.printMode;
  }
  if ('paperWidth' in body) data.paperWidth = Number(body.paperWidth) === 58 ? 58 : 80;
  if ('printCopies' in body) data.printCopies = Math.min(3, Math.max(1, Math.round(Number(body.printCopies)) || 1));
  if ('printerIp' in body) {
    const value = String(body.printerIp || '').trim();
    const { host, port } = parseAddress(value);
    if (value && (!/^[a-zA-Z0-9.-]+$/.test(host) || port < 1 || port > 65535)) {
      throw new HttpError(400, "Printer manzili noto'g'ri. Masalan: 192.168.1.100");
    }
    data.printerIp = value;
  }
  if ('cards' in body) {
    if (!Array.isArray(body.cards)) throw new HttpError(400, "Kartalar ro'yxati noto'g'ri");
    data.cards = body.cards.slice(0, 5).map((c) => {
      const digits = String(c?.number || '').replace(/\D/g, '');
      if (digits.length !== 16) throw new HttpError(400, "Karta raqami 16 ta raqamdan iborat bo'lishi kerak");
      return {
        number: digits.replace(/(\d{4})(?=\d)/g, '$1 '),
        holder: String(c?.holder || '').trim().slice(0, 60),
        bank: String(c?.bank || '').trim().slice(0, 30),
      };
    });
  }
  const settings = await Settings.update(data);
  printQueue.kick();
  res.json({ settings: config.publicUrl ? { ...settings, printerIp: '' } : settings });
}

module.exports = {
  login,
  listOrders,
  getReceipt,
  confirmReceipt,
  rejectReceipt,
  updateOrderStatus,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  getSettings,
  updateSettings,
  listBranches,
  geocodeSearch,
  createBranch,
  updateBranch,
  deleteBranch,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listReviews,
  getPrintQueue,
  claimPrint,
  printOrderNow,
  printTest,
};
