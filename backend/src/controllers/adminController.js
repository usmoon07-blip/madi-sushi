const fs = require('fs');
const path = require('path');
const config = require('../config/default');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { createAdminToken, safeEqual } = require('../middlewares/auth.middleware');
const { HttpError } = require('./cartController');
const botController = require('./botController');

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
    throw new HttpError(401, "Parol noto'g'ri");
  }
  res.json({ token: createAdminToken() });
}

// ---- Buyurtmalar ----
async function listOrders(req, res) {
  const status = String(req.query.status || '');
  if (status && status !== 'ACTIVE' && !STATUSES.includes(status)) throw new HttpError(400, "Noto'g'ri holat");
  const [orders, stats] = await Promise.all([Order.listForAdmin({ status: status || undefined }), Order.stats()]);
  res.json({ orders, stats });
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
  return res.json({ order });
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
  if (!partial || has('category')) {
    const category = String(body.category || '').trim();
    if (!category) throw new HttpError(400, 'Kategoriyani kiriting');
    data.category = category.slice(0, 40);
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
  if (has('description')) data.description = String(body.description || '').trim().slice(0, 500);
  if (has('imageUrl')) data.imageUrl = String(body.imageUrl || '').trim().slice(0, 500);
  if (has('ingredients')) {
    const list = Array.isArray(body.ingredients) ? body.ingredients : String(body.ingredients || '').split(/[\n,]/);
    data.ingredients = list.map((s) => String(s).trim()).filter(Boolean).slice(0, 20).map((s) => s.slice(0, 60));
  }
  if (has('isActive')) data.isActive = Boolean(body.isActive);
  if (has('sortOrder')) data.sortOrder = Math.round(Number(body.sortOrder)) || 0;

  if (data.oldPrice && data.price && data.oldPrice <= data.price) data.oldPrice = null;
  return data;
}

async function listProducts(req, res) {
  res.json({ products: await Product.listAll() });
}

async function createProduct(req, res) {
  const product = await Product.create(productData(req.body || {}));
  res.status(201).json({ product });
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
    fs.promises.unlink(path.join(config.paths.uploads, path.basename(product.imageUrl))).catch(() => {});
  }
  res.json({ ok: true });
}

async function uploadImage(req, res) {
  if (!req.file) throw new HttpError(400, 'Rasm tanlanmadi (JPG, PNG yoki WEBP, 5 MB gacha)');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}

// ---- Sozlamalar ----
async function getSettings(req, res) {
  res.json({ settings: await Settings.get() });
}

async function updateSettings(req, res) {
  const body = req.body || {};
  const data = {};
  for (const key of ['deliveryFee', 'freeDeliveryFrom', 'minOrder']) {
    if (key in body) {
      const n = intOrNull(body[key]);
      if (n === null || Number.isNaN(n)) throw new HttpError(400, "Summalarni to'g'ri kiriting");
      data[key] = n;
    }
  }
  if ('pickupAddress' in body) data.pickupAddress = String(body.pickupAddress || '').trim().slice(0, 200);
  if ('contactPhone' in body) data.contactPhone = String(body.contactPhone || '').trim().slice(0, 40);
  if ('isOpen' in body) data.isOpen = Boolean(body.isOpen);
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
  res.json({ settings: await Settings.update(data) });
}

module.exports = {
  login,
  listOrders,
  updateOrderStatus,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  getSettings,
  updateSettings,
};
