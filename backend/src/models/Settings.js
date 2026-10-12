const { prisma } = require('../database/connection');

let cached = null;

async function get() {
  if (cached) return cached;
  cached = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return cached;
}

async function update(data) {
  cached = await prisma.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  return cached;
}

module.exports = { get, update };
