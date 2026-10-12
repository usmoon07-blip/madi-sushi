const Product = require('../models/Product');
const Category = require('../models/Category');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { normalizePhone, money } = require('../services/format');
const { t, normLang } = require('../services/i18n');
const { reverseGeocode, searchAddress } = require('../services/geocode');
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
  lang: u.lang,
});

const publicSettings = (s) => ({
  cards: Array.isArray(s.cards) ? s.cards : [],
  deliveryFee: s.deliveryFee,
  freeDeliveryFrom: s.freeDeliveryFrom,
  minOrder: s.minOrder,
  pickupAddress: s.pickupAddress,
  contactPhone: s.contactPhone,
  isOpen: s.isOpen,
  workHours: s.workHours,
  instagram: s.instagram,
  aboutUz: s.aboutUz,
  aboutRu: s.aboutRu,
});

// Ikki tilli maydonlar: name/description/ingredients — o'zbekcha, *Ru — ruscha (bo'sh bo'lsa o'zbekchasi ko'rsatiladi)
const publicProduct = (p) => ({
  id: p.id,
  name: p.name,
  nameRu: p.nameRu,
  description: p.description,
  descriptionRu: p.descriptionRu,
  ingredients: p.ingredients,
  ingredientsRu: p.ingredientsRu,
  imageUrl: p.imageUrl,
  oldPrice: p.oldPrice,
  price: p.price,
  categoryId: p.categoryId,
  isHit: p.isHit,
});

const publicCategory = (c) => ({ id: c.id, nameUz: c.nameUz, nameRu: c.nameRu, imageUrl: c.imageUrl });

async function loadMenu() {
  const [products, categories, settings] = await Promise.all([Product.listActive(), Category.listActive(), Settings.get()]);
  return {
    products: products.map(publicProduct),
    categories: categories.map(publicCategory),
    settings: publicSettings(settings),
  };
}

const publicOrder = (o) => ({
  id: o.id,
  items: o.items,
  subtotal: o.subtotal,
  deliveryFee: o.deliveryFee,
  total: o.total,
  deliveryType: o.deliveryType,
  paymentType: o.paymentType,
  address: o.address,
  receiptAt: o.receiptAt,
  receiptConfirmedAt: o.receiptConfirmedAt,
  status: o.status,
  createdAt: o.createdAt,
});

async function bootstrap(req, res) {
  const [menu, user, favorites] = await Promise.all([loadMenu(), User.findById(req.user.id), Favorite.listIds(req.user.id)]);
  // user.lang — foydalanuvchi o'zi tanlagan til (null — hali tanlamagan)
  res.json({ ...menu, user: publicUser(user), favorites });
}

// Telegramsiz ochiq menyu: Mini App nusxasi (snapshot) va tezkor yuklash uchun
async function publicMenu(req, res) {
  res.set('Cache-Control', 'public, max-age=30');
  res.json(await loadMenu());
}

async function setLang(req, res) {
  const lang = normLang(req.body?.lang);
  const user = await User.update(req.user.id, { lang });
  res.json({ user: publicUser(user) });
}

// Mini App ochilganda so'raladigan lokatsiya (manzil matni bilan)
async function saveLocation(req, res) {
  const lat = toCoord(req.body?.lat, 90);
  const lon = toCoord(req.body?.lon, 180);
  const address = cleanText(req.body?.address, 300);
  if ((lat === null || lon === null) && !address) throw new HttpError(400, t(req.lang, 'errLocation'));
  const user = await User.update(req.user.id, { lastLat: lat, lastLon: lon, lastAddress: address });
  res.json({ user: publicUser(user) });
}

async function toggleFavorite(req, res) {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) throw new HttpError(400, t(req.lang, 'errNotFound'));
  try {
    const liked = await Favorite.toggle(req.user.id, productId);
    res.json({ liked, favorites: await Favorite.listIds(req.user.id) });
  } catch (err) {
    if (err.code === 'P2003') throw new HttpError(404, t(req.lang, 'errNotFound'));
    throw err;
  }
}

async function createReview(req, res) {
  const rating = Math.round(Number(req.body?.rating));
  if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, t(req.lang, 'errReview'));
  const review = await Review.create({ userId: req.user.id, rating, text: cleanText(req.body?.text, 1000) || '' });
  botController.notifyReview(review).catch((err) => console.warn('[review] notify:', err.message));
  res.status(201).json({ ok: true, message: t(req.lang, 'reviewThanks') });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  res.json({ user: publicUser(user) });
}

async function savePhone(req, res) {
  const phone = normalizePhone(req.body?.phone);
  if (!phone) throw new HttpError(400, t(req.lang, 'errPhone'));
  const user = await User.update(req.user.id, { phone });
  res.json({ user: publicUser(user) });
}

async function geocode(req, res) {
  const lat = toCoord(req.body?.lat, 90);
  const lon = toCoord(req.body?.lon, 180);
  if (lat === null || lon === null) throw new HttpError(400, t(req.lang, 'errLocation'));
  res.json(await reverseGeocode(lat, lon));
}

async function geocodeSearch(req, res) {
  const q = cleanText(req.body?.q, 120);
  if (!q || q.length < 3) return res.json({ results: [] });
  res.json({ results: await searchAddress(q) });
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
  if (!settings.isOpen) throw new HttpError(409, t(req.lang, 'errClosed'));

  // Savatni tekshirish
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const qtyById = new Map();
  const nameById = new Map();
  for (const it of rawItems) {
    const id = Number(it?.productId);
    const qty = Math.floor(Number(it?.qty));
    if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(qty) || qty <= 0) continue;
    qtyById.set(id, Math.min((qtyById.get(id) || 0) + qty, 50));
    if (typeof it.name === 'string') nameById.set(id, it.name);
  }
  if (!qtyById.size) throw new HttpError(400, t(req.lang, 'errCartEmpty'));
  if (qtyById.size > 40) throw new HttpError(400, t(req.lang, 'errCartTooBig'));

  const products = await Product.findActiveByIds([...qtyById.keys()]);
  if (products.length !== qtyById.size) {
    throw new HttpError(409, t(req.lang, 'errUnavailable'));
  }
  // Ilovadagi menyu nusxasi eskirgan bo'lsa, boshqa taom buyurtma qilinib qolmasin
  if (products.some((p) => nameById.has(p.id) && nameById.get(p.id) !== p.name)) {
    throw new HttpError(409, t(req.lang, 'errMenuChanged'));
  }

  // Narxlar faqat serverda hisoblanadi
  const items = products.map((p) => ({
    productId: p.id,
    name: p.name,
    nameRu: p.nameRu || p.name,
    price: p.price,
    qty: qtyById.get(p.id),
    imageUrl: p.imageUrl,
  }));
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (subtotal < settings.minOrder) {
    throw new HttpError(400, t(req.lang, 'errMinOrder', money(settings.minOrder)));
  }

  const deliveryType = body.deliveryType === 'PICKUP' ? 'PICKUP' : 'DELIVERY';
  const paymentType = body.paymentType === 'CARD' ? 'CARD' : 'CASH';

  const phone = normalizePhone(body.phone);
  if (!phone) throw new HttpError(400, t(req.lang, 'errPhone'));

  const lat = deliveryType === 'DELIVERY' ? toCoord(body.lat, 90) : null;
  const lon = deliveryType === 'DELIVERY' ? toCoord(body.lon, 180) : null;
  const address = deliveryType === 'DELIVERY' ? cleanText(body.address, 300) : settings.pickupAddress;
  if (deliveryType === 'DELIVERY' && !address && (lat === null || lon === null)) {
    throw new HttpError(400, t(req.lang, 'errAddress'));
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

module.exports = {
  HttpError,
  bootstrap,
  publicMenu,
  me,
  savePhone,
  setLang,
  saveLocation,
  toggleFavorite,
  createReview,
  geocode,
  geocodeSearch,
  myOrders,
  createOrder,
  publicProduct,
};
