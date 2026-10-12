const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];

const listActive = () => prisma.category.findMany({ where: { isActive: true }, orderBy: ORDER_BY });
const listAll = () => prisma.category.findMany({ orderBy: ORDER_BY, include: { _count: { select: { products: true } } } });
const create = (data) => prisma.category.create({ data });
const update = (id, data) => prisma.category.update({ where: { id }, data });
const remove = (id) => prisma.category.delete({ where: { id } });

module.exports = { listActive, listAll, create, update, remove };
