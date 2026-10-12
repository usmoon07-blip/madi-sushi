const { prisma } = require('../database/connection');

async function listIds(userId) {
  const rows = await prisma.favorite.findMany({ where: { userId }, select: { productId: true }, orderBy: { createdAt: 'desc' } });
  return rows.map((r) => r.productId);
}

async function toggle(userId, productId) {
  const where = { userId_productId: { userId, productId } };
  const exists = await prisma.favorite.findUnique({ where });
  if (exists) {
    await prisma.favorite.delete({ where });
    return false;
  }
  await prisma.favorite.upsert({ where, update: {}, create: { userId, productId } });
  return true;
}

module.exports = { listIds, toggle };
