const { prisma } = require('../database/connection');

const ACTIVE_STATUSES = ['NEW', 'ACCEPTED', 'ON_WAY'];
const withUser = { user: { select: { id: true, telegramId: true, firstName: true, username: true } } };

const create = (data) => prisma.order.create({ data, include: withUser });
const findByClientRef = (clientRef) => prisma.order.findUnique({ where: { clientRef }, include: withUser });
const findById = (id) => prisma.order.findUnique({ where: { id }, include: withUser });

const listForUser = (userId, take = 30) =>
  prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take });

function listForAdmin({ status, take = 150 } = {}) {
  let where = {};
  if (status === 'ACTIVE') where = { status: { in: ACTIVE_STATUSES } };
  else if (status) where = { status };
  return prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take, include: withUser });
}

const updateStatus = (id, status) =>
  prisma.order.update({ where: { id }, data: { status }, include: withUser });

// ---- Oshxona cheki navbati ----
const PRINT_STATUSES = { NEW: ['NEW', 'ACCEPTED', 'ON_WAY'], ACCEPTED: ['ACCEPTED', 'ON_WAY'] };
const PRINT_WINDOW_MS = 12 * 60 * 60 * 1000;

function printQueue(mode) {
  const statuses = PRINT_STATUSES[mode];
  if (!statuses) return Promise.resolve([]);
  return prisma.order.findMany({
    where: { printedAt: null, status: { in: statuses }, createdAt: { gte: new Date(Date.now() - PRINT_WINDOW_MS) } },
    orderBy: { id: 'asc' },
    take: 20,
    include: withUser,
  });
}

// Bir chek faqat bir marta chiqishi uchun atomar "band qilish"
async function claimPrint(id) {
  const { count } = await prisma.order.updateMany({ where: { id, printedAt: null }, data: { printedAt: new Date() } });
  return count === 1;
}

const releasePrint = (id) => prisma.order.updateMany({ where: { id }, data: { printedAt: null } });

async function stats() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [today, byStatus, last] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: start }, status: { not: 'CANCELLED' } },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.findFirst({ orderBy: { id: 'desc' }, select: { id: true } }),
  ]);
  const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  return {
    todayOrders: today._count._all,
    todayRevenue: today._sum.total || 0,
    counts,
    lastId: last?.id || 0,
    active: ACTIVE_STATUSES.reduce((sum, s) => sum + (counts[s] || 0), 0),
  };
}

module.exports = { ACTIVE_STATUSES, printQueue, claimPrint, releasePrint, create, findByClientRef, findById, listForUser, listForAdmin, updateStatus, stats };
