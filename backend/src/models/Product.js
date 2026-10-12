const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];
// Mijozga: mahsulot ham, kategoriyasi ham faol bo'lishi kerak
const ACTIVE = { isActive: true, OR: [{ categoryId: null }, { category: { is: { isActive: true } } }] };

const listActive = () => prisma.product.findMany({ where: ACTIVE, orderBy: ORDER_BY });
const listAll = () => prisma.product.findMany({ orderBy: ORDER_BY, include: { category: true } });
const findActiveByIds = (ids) => prisma.product.findMany({ where: { ...ACTIVE, id: { in: ids } } });
const create = (data) => prisma.product.create({ data });
const update = (id, data) => prisma.product.update({ where: { id }, data });
const remove = (id) => prisma.product.delete({ where: { id } });
const count = () => prisma.product.count();

module.exports = { listActive, listAll, findActiveByIds, create, update, remove, count };
