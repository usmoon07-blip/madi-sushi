const { prisma } = require('../database/connection');

const ORDER_BY = [{ sortOrder: 'asc' }, { id: 'asc' }];

const listActive = () => prisma.product.findMany({ where: { isActive: true }, orderBy: ORDER_BY });
const listAll = () => prisma.product.findMany({ orderBy: ORDER_BY });
const findActiveByIds = (ids) => prisma.product.findMany({ where: { id: { in: ids }, isActive: true } });
const create = (data) => prisma.product.create({ data });
const update = (id, data) => prisma.product.update({ where: { id }, data });
const remove = (id) => prisma.product.delete({ where: { id } });
const count = () => prisma.product.count();

module.exports = { listActive, listAll, findActiveByIds, create, update, remove, count };
