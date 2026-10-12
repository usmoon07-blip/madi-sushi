const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { normalizePhone } = require('../services/format');
const { reverseGeocode } = require('../services/geocode');
const botController = require('./botController');
const printQueue = require('../services/printQueue');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const cleanText = (v, max) => {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
  return s ? s.slice(0, max) : null;
};
const toCoord = (v, limit) => {
  const n = Number(v);
  return v !== null && v !== '' && Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
};

const publicUser = (u) => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  username: u.username,
  phone: u.phone,
  lastAddress: u.lastAddress,
  lastLat: u.lastLat,
  lastLon: u.lastLon,
});

const publicSettings = (s) => ({
  cards: Array.isArray(s.cards) ? s.cards : [],
  deliveryFee: s.deliveryFee,
  freeDeliveryFrom: s.freeDeliveryFrom,
  minOrder: s.minOrder,
  pickupAddress: s.pickupAddress,
  contactPhone: s.contactPhone,
  isOpen: s.isOpen,
});

const publicProduct = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  ingredients: p.ingredients,
  imageUrl: p.imageUrl,
  oldPrice: p.oldPrice,
  price: p.price,
  category: p.category,
});

const publicOrder = (o) => ({
  id: o.id,
  items: o.items,
  subtotal: o.subtotal,
  deliveryFee: o.deliveryFee,
  total: o.total,
  deliveryType: o.deliveryType,
  paymentType: o.paymentType,
  address: o.address,
  status: o.status,
  createdAt: o.createdAt,
});

async function bootstrap(req, res) {
  const [products, settings, user] = await Promise.all([
    Product.listActive(),
    Settings.get(),
    User.findById(req.user.id),
  ]);
  res.json({
    user: publicUser(user),
    settings: publicSettings(settings),
    products: products.map(publicProduct),
  });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  res.json({ user: publicUser(user) });
}

async function savePhone(req, res) {
  const phone = normalizePhone(req.body?.phone);
  if (!phone) throw new HttpError(400, "Telefon raqami noto'g'ri. Masalan: +998 90 123 45 67");
  const user = await User.update(req.user.id, { phone });
  res.json({ user: publicUser(user) });
}

async function geocode(req, res) {
  const lat = toCoord(req.body?.lat, 90);
  const lon = toCoord(req.body?.lon, 180);
  if (lat === null || lon === null) throw new HttpError(400, "Lokatsiya noto'g'ri");
  res.json(await reverseGeocode(lat, lon));
}

async function myOrders(req, res) {
  const orders = await Order.listForUser(req.user.id);
  res.json({ orders: orders.map(publicOrder) });
}

async function createOrder(req, res) {
  const body = req.body || {};
  const clientRef = cleanText(body.clientRef, 64);

  // Tarmoq uzilib, so'rov qayta yuborilsa, buyurtma ikki marta yaratilmaydi
  if (clientRef) {
    const existing = await Order.findByClientRef(clientRef);
    if (existing && existing.userId === req.user.id) return res.json({ order: publicOrder(existing) });
  }

  const settings = await Settings.get();
  if (!settings.isOpen) throw new HttpError(409, 'Hozir buyurtmalar qabul qilinmayapti. Keyinroq urinib ko‘ring');

  // Savatni tekshirish
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const qtyById = new Map();
  for (const it of rawItems) {
    const id = Number(it?.productId);
    const qty = Math.floor(Number(it?.qty));
    if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(qty) || qty <= 0) continue;
    qtyById.set(id, Math.min((qtyById.get(id) || 0) + qty, 50));
  }
  if (!qtyById.size) throw new HttpError(400, "Savat bo'sh");
  if (qtyById.size > 40) throw new HttpError(400, 'Savatda mahsulotlar juda ko‘p');

  const products = await Product.findActiveByIds([...qtyById.keys()]);
  if (products.length !== qtyById.size) {
    throw new HttpError(409, "Savatdagi ba'zi mahsulotlar hozir mavjud emas. Savatni yangilang");
  }

  // Narxlar faqat serverda hisoblanadi
  const items = products.map((p) => ({
    productId: p.id,
    name: p.name,
    price: p.price,
    qty: qtyById.get(p.id),
    imageUrl: p.imageUrl,
  }));
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (subtotal < settings.minOrder) {
    throw new HttpError(400, `Minimal buyurtma summasi: ${settings.minOrder.toLocaleString('ru-RU')} so'm`);
  }

  const deliveryType = body.deliveryType === 'PICKUP' ? 'PICKUP' : 'DELIVERY';
  const paymentType = body.paymentType === 'CARD' ? 'CARD' : 'CASH';

  const phone = normalizePhone(body.phone);
  if (!phone) throw new HttpError(400, "Telefon raqamini to'g'ri kiriting");

  const lat = deliveryType === 'DELIVERY' ? toCoord(body.lat, 90) : null;
  const lon = deliveryType === 'DELIVERY' ? toCoord(body.lon, 180) : null;
  const address = deliveryType === 'DELIVERY' ? cleanText(body.address, 300) : settings.pickupAddress;
  if (deliveryType === 'DELIVERY' && !address && (lat === null || lon === null)) {
    throw new HttpError(400, 'Yetkazib berish manzilini kiriting yoki lokatsiyani yuboring');
  }

  const deliveryFee =
    deliveryType === 'DELIVERY' && !(settings.freeDeliveryFrom > 0 && subtotal >= settings.freeDeliveryFrom)
      ? settings.deliveryFee
      : 0;

  const customerName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ').slice(0, 100);

  let order;
  try {
    order = await Order.create({
      clientRef,
      userId: req.user.id,
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      deliveryType,
      paymentType,
      customerName,
      phone,
      address,
      addressNote: deliveryType === 'DELIVERY' ? cleanText(body.addressNote, 200) : null,
      lat,
      lon,
      comment: cleanText(body.comment, 300),
    });
  } catch (err) {
    if (err.code === 'P2002' && clientRef) {
      const existing = await Order.findByClientRef(clientRef);
      if (existing) return res.json({ order: publicOrder(existing) });
    }
    throw err;
  }

  const userUpdate = { phone };
  if (deliveryType === 'DELIVERY') Object.assign(userUpdate, { lastAddress: address, lastLat: lat, lastLon: lon });
  await User.update(req.user.id, userUpdate).catch((err) => console.warn('[order] user update:', err.message));

  botController.notifyNewOrder(order).catch((err) => console.warn('[order] notify:', err.message));
  printQueue.kick();

  return res.status(201).json({ order: publicOrder(order) });
}

module.exports = { HttpError, bootstrap, me, savePhone, geocode, myOrders, createOrder, publicProduct };
