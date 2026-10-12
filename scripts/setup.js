// Bir buyruq bilan o'rnatish: .env yaratish, paketlar, baza, build
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const envPath = path.join(root, 'backend', '.env');

const c = { red: (s) => `\x1b[31m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m` };
const step = (n, text) => console.log(`\n${c.red('●')} ${c.bold(`${n}. ${text}`)}`);

function run(cmd, cwd) {
  const res = spawnSync(cmd, { cwd: path.join(root, cwd), stdio: 'inherit', shell: true });
  if (res.status !== 0) {
    console.error(c.red(`\n❌ Xato: "${cmd}" (${cwd}) bajarilmadi. Yuqoridagi xabarni o'qing.`));
    process.exit(1);
  }
}

function ask(rl, question, validate) {
  return new Promise((resolve) => {
    const loop = () =>
      rl.question(question, (answer) => {
        const value = answer.trim().replace(/^["']|["']$/g, '');
        const error = validate ? validate(value) : null;
        if (error) {
          console.log(c.red(`   ${error}`));
          loop();
        } else resolve(value);
      });
    loop();
  });
}

// Neon manzilidan Prisma uchun 2 ta manzil tayyorlash
function buildDbUrls(raw) {
  const url = new URL(raw);
  url.searchParams.delete('channel_binding');
  url.searchParams.set('sslmode', 'require');
  url.searchParams.set('connect_timeout', '15');
  const direct = new URL(url);
  direct.hostname = direct.hostname.replace('-pooler', '');
  const pooled = new URL(url);
  if (pooled.hostname.includes('-pooler')) pooled.searchParams.set('pgbouncer', 'true');
  return { pooled: pooled.toString(), direct: direct.toString() };
}

async function createEnv() {
  console.log("\nSizdan 4 ta ma'lumot so'raladi. Nusxalab, shu yerga joylashtiring (sichqonchaning o'ng tugmasi) va Enter bosing.\n");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const dbUrl = await ask(rl, '1) Neon connection string (postgresql://...): ', (v) =>
    /^postgres(ql)?:\/\/.+@.+\/.+/.test(v) ? null : "postgresql:// bilan boshlanadigan to'liq manzilni kiriting"
  );
  const botToken = await ask(rl, '2) Bot token (BotFather): ', (v) =>
    /^\d+:[\w-]{30,}$/.test(v) ? null : "Token noto'g'ri ko'rinishda. Masalan: 123456789:AAH..."
  );
  const adminIds = await ask(rl, '3) Telegram ID (bir nechta bo\'lsa vergul bilan): ', (v) =>
    /^\d+(\s*,\s*\d+)*$/.test(v) ? null : "Faqat raqamlar kiriting"
  );
  const password = await ask(rl, '4) Admin panel paroli: ', (v) => (v.length >= 4 ? null : 'Kamida 4 ta belgi'));
  rl.close();

  const { pooled, direct } = buildDbUrls(dbUrl);
  const env = [
    `DATABASE_URL="${pooled}"`,
    `DIRECT_URL="${direct}"`,
    `BOT_TOKEN="${botToken}"`,
    `ADMIN_IDS="${adminIds.replace(/\s/g, '')}"`,
    `ADMIN_PASSWORD="${password.replace(/"/g, '\\"')}"`,
    `APP_SECRET="${crypto.randomBytes(24).toString('hex')}"`,
    'PORT=3000',
    'WEBAPP_URL=""',
    'YANDEX_GEOCODER_KEY=""',
    'ALLOW_DEV_USER=false',
    '',
  ].join('\n');
  fs.writeFileSync(envPath, env);
  console.log(c.green('\n✅ backend/.env fayli yaratildi'));
}

(async () => {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) {
    console.error(c.red(`Node.js ${process.versions.node} eski. https://nodejs.org dan LTS versiyani o'rnating.`));
    process.exit(1);
  }

  console.log(c.bold('\n🍣 Madi Sushi — o\'rnatish'));

  step(1, 'Sozlamalar (.env)');
  if (fs.existsSync(envPath)) console.log("backend/.env allaqachon bor — o'tkazib yuborildi (qayta yaratish uchun faylni o'chiring).");
  else await createEnv();

  step(2, 'Backend paketlari');
  run('npm install --no-audit --no-fund', 'backend');

  step(3, 'Baza: jadvallar (migratsiya) va boshlang\'ich menyu (seed)');
  run('npx prisma migrate deploy', 'backend');
  run('node prisma/seed.js', 'backend');

  step(4, 'Mini App');
  run('npm install --no-audit --no-fund', 'miniapp');
  run('npm run build', 'miniapp');

  step(5, 'Admin panel');
  run('npm install --no-audit --no-fund', 'admin');
  run('npm run build', 'admin');

  console.log(c.green(c.bold('\n✅ Hammasi tayyor!')));
  console.log(`
Keyingi qadamlar:
  1) Shu oynada:            ${c.bold('npm start')}
  2) Yangi oynada:          ${c.bold('ngrok http 3000')}
  3) Admin panel:           http://localhost:3000/admin
  4) Telegramda botga:      /start
`);
})();
