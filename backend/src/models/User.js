const { prisma } = require('../database/connection');

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function fromTelegram(tg) {
  return {
    firstName: String(tg.first_name || 'Mehmon').slice(0, 64),
    lastName: tg.last_name ? String(tg.last_name).slice(0, 64) : null,
    username: tg.username ? String(tg.username).slice(0, 64) : null,
  };
}

async function upsertFromTelegram(tg) {
  const telegramId = String(tg.id);
  const data = fromTelegram(tg);
  const user = await prisma.user.upsert({
    where: { telegramId },
    update: data,
    create: { telegramId, ...data },
  });
  cache.set(telegramId, { user, at: Date.now() });
  return user;
}

// Har so'rovda bazaga yozmaslik uchun qisqa muddatli kesh
async function ensure(tg) {
  const hit = cache.get(String(tg.id));
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.user;
  return upsertFromTelegram(tg);
}

async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function update(id, data) {
  const user = await prisma.user.update({ where: { id }, data });
  cache.set(user.telegramId, { user, at: Date.now() });
  return user;
}

async function setPhoneByTelegramId(telegramId, phone) {
  const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  if (!user) return null;
  return update(user.id, { phone });
}

module.exports = { upsertFromTelegram, ensure, findById, update, setPhoneByTelegramId };
