const crypto = require('crypto');
const { prisma } = require('../database/connection');

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function save(buffer, mime) {
  const id = `${Date.now().toString(36)}${crypto.randomBytes(6).toString('hex')}`;
  await prisma.upload.create({ data: { id, mime, data: buffer } });
  return `/uploads/${id}.${EXT[mime] || 'img'}`;
}

const idFromUrl = (url) => (String(url).match(/^\/uploads\/([a-z0-9]+)\.\w+$/) || [])[1] || null;

const find = (id) => prisma.upload.findUnique({ where: { id } });

async function removeByUrl(url) {
  const id = idFromUrl(url);
  if (id) await prisma.upload.deleteMany({ where: { id } });
}

module.exports = { EXT, save, find, idFromUrl, removeByUrl };
