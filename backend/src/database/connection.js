const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// Neon bazasi uxlab qolgan bo'lsa, uyg'onishi uchun bir necha marta urinib ko'ramiz
async function connectWithRetry(attempts = 5) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      if (i === attempts) throw err;
      console.warn(`[db] Ulanib bo'lmadi (${i}/${attempts}), qayta urinilmoqda...`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

module.exports = { prisma, connectWithRetry };
