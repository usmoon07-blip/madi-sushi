const crypto = require('crypto');
const config = require('../config/default');
const User = require('../models/User');

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

// Telegram Mini App initData imzosini tekshirish
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyInitData(initData) {
  if (!initData || !config.botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(config.botToken).digest();
  const calculated = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (!safeEqual(calculated, hash)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > config.initDataMaxAgeSec) return null;

  try {
    const user = JSON.parse(params.get('user') || 'null');
    return user && user.id ? user : null;
  } catch {
    return null;
  }
}

async function telegramAuth(req, res, next) {
  try {
    const initData = req.get('x-telegram-init-data');
    let tgUser = verifyInitData(initData);
    if (!tgUser && !initData && config.allowDevUser) {
      tgUser = { id: 1, first_name: 'Test', username: 'dev' };
    }
    if (!tgUser) {
      return res.status(401).json({ error: "Ilovani Telegram bot orqali oching" });
    }
    req.tgUser = tgUser;
    req.user = await User.ensure(tgUser);
    return next();
  } catch (err) {
    return next(err);
  }
}

// ---- Admin token (oddiy imzolangan token) ----
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', config.appSecret).update(payload).digest('base64url');

function createAdminToken() {
  const payload = b64(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) + config.adminTokenTtlSec }));
  return `${payload}.${sign(payload)}`;
}

function verifyAdminToken(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.role === 'admin' && data.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function adminAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyAdminToken(token)) return res.status(401).json({ error: 'Qaytadan kiring' });
  return next();
}

// Parolni tanlab topishdan himoya: bitta IP'dan 8 ta xato urinish -> 15 daqiqa blok
const MAX_FAILS = 8;
const BLOCK_MS = 15 * 60 * 1000;
const failures = new Map();

function loginLimiter(req, res, next) {
  const entry = failures.get(req.ip);
  if (entry && entry.blockedUntil > Date.now()) {
    const minutes = Math.ceil((entry.blockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Juda ko'p xato urinish. ${minutes} daqiqadan so'ng qayta urining` });
  }
  return next();
}

function recordLoginFailure(ip) {
  const entry = failures.get(ip) || { count: 0, blockedUntil: 0 };
  if (entry.blockedUntil && entry.blockedUntil <= Date.now()) entry.count = 0;
  entry.count += 1;
  entry.blockedUntil = entry.count >= MAX_FAILS ? Date.now() + BLOCK_MS : 0;
  failures.set(ip, entry);
  if (failures.size > 10000) failures.clear();
}

const clearLoginFailures = (ip) => failures.delete(ip);

module.exports = {
  verifyInitData,
  telegramAuth,
  createAdminToken,
  adminAuth,
  loginLimiter,
  recordLoginFailure,
  clearLoginFailures,
  safeEqual,
};
