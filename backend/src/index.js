const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('./config/default');
const { prisma, connectWithRetry } = require('./database/connection');
const { bot } = require('./core/bot');
const webapp = require('./core/webapp');
const printQueue = require('./services/printQueue');
const { registerBotRoutes } = require('./routes/bot.routes');
const clientRoutes = require('./routes/client.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/admin', adminRoutes);
app.use('/api', clientRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Topilmadi' }));

fs.mkdirSync(config.paths.uploads, { recursive: true });
app.use('/uploads', express.static(config.paths.uploads, { maxAge: '30d', immutable: true }));
app.use('/static', express.static(config.paths.public, { maxAge: '7d' }));

// React ilovalarni (build qilingan) tarqatish
function serveSpa(mount, dir) {
  const indexFile = path.join(dir, 'index.html');
  app.use(mount, express.static(dir, { index: false, maxAge: '1h' }));
  app.get(mount === '/' ? '*' : `${mount}*`, (req, res) => {
    if (!fs.existsSync(indexFile)) {
      return res
        .status(503)
        .type('text/plain; charset=utf-8')
        .send('Frontend hali build qilinmagan. Loyiha papkasida "npm run build" ni ishga tushiring.');
    }
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(indexFile);
  });
}
serveSpa('/admin', config.paths.adminDist);
serveSpa('/', config.paths.miniappDist);

// Xatolarni yagona joyda ushlash
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: "Noto'g'ri so'rov" });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Rasm hajmi 5 MB dan oshmasligi kerak' });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Topilmadi' });
  const status = err.status || 500;
  if (status >= 500) console.error('[api]', err);
  return res.status(status).json({ error: status >= 500 ? "Serverda xatolik. Qayta urinib ko'ring" : err.message });
});

async function main() {
  console.log('[db] Bazaga ulanilmoqda...');
  await connectWithRetry();
  console.log('[db] Ulandi ✅');

  const server = app.listen(config.port, () => {
    console.log(`\n🍣 Madi Sushi ishga tushdi`);
    console.log(`   Mini App:    http://localhost:${config.port}`);
    console.log(`   Admin panel: http://localhost:${config.port}/admin\n`);
  });

  printQueue.start();

  if (bot) {
    registerBotRoutes(bot);
    await bot.api
      .setMyCommands([
        { command: 'start', description: 'Menyuni ochish' },
        { command: 'info', description: 'Manzil va aloqa' },
      ])
      .catch((err) => console.warn('[bot] Buyruqlar:', err.description || err.message));
    webapp.start();
    bot
      .start({
        drop_pending_updates: true,
        allowed_updates: ['message'],
        onStart: (me) => console.log(`[bot] @${me.username} ishlayapti ✅`),
      })
      .catch((err) => {
        if (err.error_code === 409) console.error('[bot] Bot boshqa joyda ham ishga tushirilgan. Faqat bitta nusxa qoldiring.');
        else if (err.error_code === 401) console.error("[bot] BOT_TOKEN noto'g'ri. .env faylini tekshiring.");
        else console.error('[bot] Ishga tushmadi:', err.message);
      });
  } else {
    console.warn('[bot] BOT_TOKEN yo‘q — bot o‘chirilgan.');
  }

  const shutdown = async () => {
    console.log("\nTo'xtatilmoqda...");
    server.close();
    if (bot?.isRunning()) await bot.stop().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('\n❌ Ishga tushmadi:', err.message);
  if (String(err.message).includes("Can't reach database")) {
    console.error("   Neon bazasiga ulanib bo'lmadi. Internet va .env dagi DATABASE_URL ni tekshiring.");
  }
  process.exit(1);
});
