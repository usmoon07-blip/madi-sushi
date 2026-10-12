const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];

const listActive = () => prisma.branch.findMany({ where: { isActive: true }, orderBy: ORDER_BY });
const listAll = () => prisma.branch.findMany({ orderBy: ORDER_BY, include: { _count: { select: { orders: true } } } });
const findActive = (id) => prisma.branch.findFirst({ where: { id, isActive: true } });
const count = () => prisma.branch.count();
const create = (data) => prisma.branch.create({ data });
const update = (id, data) => prisma.branch.update({ where: { id }, data });
const remove = (id) => prisma.branch.delete({ where: { id } });

module.exports = { listActive, listAll, findActive, count, create, update, remove };
