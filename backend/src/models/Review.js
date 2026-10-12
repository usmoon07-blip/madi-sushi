const { prisma } = require('../database/connection');

const create = (data) =>
  prisma.review.create({ data, include: { user: { select: { firstName: true, username: true, phone: true, telegramId: true } } } });

const list = (take = 200) =>
  prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    include: { user: { select: { firstName: true, lastName: true, username: true, phone: true } } },
  });

module.exports = { create, list };
