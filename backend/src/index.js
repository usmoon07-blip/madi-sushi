const fs = require('fs');
const path = require('path');
const express = require('express');
const { webhookCallback } = require('grammy');
const config = require('./config/default');
const { prisma, connectWithRetry } = require('./database/connection');
const { bot, webhook } = require('./core/bot');
const Upload = require('./models/Upload');
const { publicMenu } = require('./controllers/cartController');
const h = require('./middlewares/asyncHandler');
const { errText, redact } = require('./services/redact');
const { t } = require('./services/i18n');
const webapp = require('./core/webapp');
const printQueue = require('./services/printQueue');
const { registerBotRoutes } = require('./routes/bot.routes');
const clientRoutes = require('./routes/client.routes');
const adminRoutes = require('./routes/admin.routes');

const useWebhook = Boolean(bot && config.publicUrl);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

// CORS: faqat o'z saytlarimiz (masalan Vercel'dagi Mini App). Origin'siz so'rovlar (Telegram, server) o'tadi
app.use(['/api', '/uploads', '/static'], (req, res, next) => {
  const origin = req.get('origin');
  if (origin) {
    const allowed = config.corsOrigins;
    if (allowed.length === 0 || allowed.includes(origin.replace(/\/$/, ''))) {
      res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Telegram-Init-Data, ngrok-skip-browser-warning',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      });
    }
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

app.use(express.json({ limit: '200kb' }));

// Telegram webhook — 404 handlerlaridan OLDIN turishi shart
if (useWebhook) {
  app.post(webhook.path, webhookCallback(bot, 'express', { secretToken: webhook.secretToken, onTimeout: 'return' }));
}
if (bot) registerBotRoutes(bot);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/menu', h(publicMenu));
app.use('/api/admin', adminRoutes);
app.use('/api', clientRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Topilmadi' }));

// Yuklangan rasmlar: bazadan (server diski vaqtinchalik bo'lishi mumkin), bo'lmasa diskdan
app.get(
  '/uploads/:file',
  h(async (req, res, next) => {
    const id = Upload.idFromUrl(`/uploads/${req.params.file}`);
    const file = id && (await Upload.find(id));
    if (!file) return next();
    res.set({ 'Content-Type': file.mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
    return res.send(Buffer.from(file.data));
  })
);
fs.mkdirSync(config.paths.uploads, { recursive: true });
app.use('/uploads', express.static(config.paths.uploads, { maxAge: '30d', immutable: true }));
app.use('/static', express.static(config.paths.public, { maxAge: '7d' }));

// React ilovalarni (build qilingan) tarqatish
function serveSpa(mount, dir) {
  const indexFile = path.join(dir, 'index.html');
  app.use(mount, express.static(dir, { index: false, maxAge: '1h' }));
  app.get(mount === '/' ? '*' : `${mount}*`, (req, res) => {
    if (!fs.existsSync(indexFile)) {
      // Mini App boshqa joyda (masalan Vercel) bo'lsa — o'sha yerga yo'naltiramiz
      if (mount === '/' && config.webappUrl && config.webappUrl !== config.publicUrl) {
        return res.redirect(302, config.webappUrl);
      }
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
  if (err.code === 'P2003') return res.status(400).json({ error: "Bog'liq ma'lumot topilmadi (masalan, kategoriya)" });
  const status = err.status || 500;
  if (status >= 500) console.error('[api]', redact(err.stack || err.message));
  return res.status(status).json({ error: status >= 500 ? "Serverda xatolik. Qayta urinib ko'ring" : err.message });
});

async function startBot() {
  // Buyruqlar ro'yxati: o'zbekcha (asosiy) va ruscha (Telegram tili rus bo'lganlar uchun)
  for (const lang of ['uz', 'ru']) {
    await bot.api
      .setMyCommands(
        [
          { command: 'start', description: t(lang, 'commandStart') },
          { command: 'info', description: t(lang, 'commandInfo') },
          { command: 'lang', description: t(lang, 'commandLang') },
        ],
        lang === 'ru' ? { language_code: 'ru' } : undefined
      )
      .catch((err) => console.warn('[bot] Buyruqlar:', errText(err)));
  }
  webapp.start();

  if (useWebhook) {
    await bot.init();
    await bot.api.setWebhook(`${config.publicUrl}${webhook.path}`, {
      secret_token: webhook.secretToken,
      allowed_updates: ['message', 'callback_query'],
    });
    console.log(`[bot] @${bot.botInfo.username} webhook rejimida ishlayapti ✅`);
    return;
  }

  bot
    .start({
        drop_pending_updates: true,
        allowed_updates: ['message', 'callback_query'],
      onStart: (me) => console.log(`[bot] @${me.username} ishlayapti ✅`),
    })
    .catch((err) => {
      if (err.error_code === 409) console.error('[bot] Bot boshqa joyda ham ishga tushirilgan. Faqat bitta nusxa qoldiring.');
      else if (err.error_code === 401) console.error("[bot] BOT_TOKEN noto'g'ri. .env faylini tekshiring.");
      else console.error('[bot] Ishga tushmadi:', errText(err));
    });
}

async function main() {
  // Port darhol ochiladi — bepul serverda uyg'onish tezroq bo'lsin
  const server = app.listen(config.port, () => {
    console.log(`\n🍣 Madi Sushi ishga tushdi (port ${config.port})`);
    if (config.publicUrl) {
      console.log(`   Server:      ${config.publicUrl}`);
      console.log(`   Admin panel: ${config.publicUrl}/admin\n`);
    } else {
      console.log(`   Mini App:    http://localhost:${config.port}`);
      console.log(`   Admin panel: http://localhost:${config.port}/admin\n`);
    }
  });

  console.log('[db] Bazaga ulanilmoqda...');
  await connectWithRetry();
  console.log('[db] Ulandi ✅');

  printQueue.start();

  if (bot) {
    await startBot().catch((err) => console.error('[bot] Ishga tushmadi:', errText(err)));
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
  console.error('\n❌ Ishga tushmadi:', errText(err));
  if (String(err.message).includes("Can't reach database")) {
    console.error("   Neon bazasiga ulanib bo'lmadi. Internet va .env dagi DATABASE_URL ni tekshiring.");
  }
  process.exit(1);
});
