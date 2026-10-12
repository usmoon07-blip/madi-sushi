# 🍣 Madi Sushi — Telegram Mini App + Bot + Admin panel

Toshkentdagi premium sushi bar uchun buyurtma tizimi. Qora-qizil dizaynda.

| Qism | Qayerda | Vazifasi |
|---|---|---|
| **Backend + bot** (webhook) | **Render** (bepul) | Buyurtmalarni qabul qiladi, mijoz va adminga xabar yuboradi |
| **Mini App** (mijoz) | **Vercel** (bepul) | Menyu · Savat · Profil |
| **Admin panel** | Render, `/admin` | Buyurtmalar, mahsulotlar, kartalar, oshxona cheki |
| **Baza** | **Neon** PostgreSQL (bepul) | Buyurtmalar, menyu, yuklangan rasmlar |

Kompyuter o'chiq bo'lsa ham bot ishlaydi. Kompyuterda (localhost) ishga tushirish ham mumkin — [pastda](#kompyuterda-ishga-tushirish-localhost).

---

## 🚀 Serverga joylash (bir marta, ~15 daqiqa)

### 1-qadam. Render — backend, bot va admin panel
1. https://render.com → **Get Started** → **GitHub** orqali kiring.
2. **New +** → **Blueprint** → `madi-sushi` omborini tanlang (ko'rinmasa: *Configure account* → omborga ruxsat bering).
3. Branch: `main` → **Apply**. Render 5 ta maxfiy qiymatni so'raydi:

   | Kalit | Qiymat |
   |---|---|
   | `DATABASE_URL` | Neon manzili, `-pooler` bilan, oxiriga `?sslmode=require&connect_timeout=15&pgbouncer=true` |
   | `DIRECT_URL` | Xuddi shu manzil, lekin `-pooler` so'zisiz, oxiri `?sslmode=require&connect_timeout=15` |
   | `BOT_TOKEN` | BotFather bergan token |
   | `ADMIN_IDS` | Telegram ID (bir nechta bo'lsa vergul bilan) |
   | `ADMIN_PASSWORD` | Admin panel paroli |

4. **Deploy** tugashini kuting (3–5 daqiqa). Yuqorida manzil chiqadi: `https://madi-sushi.onrender.com` (yoki shunga o'xshash).
5. Tekshiring: `https://SIZNING-MANZIL.onrender.com/api/health` → `{"ok":true}`.

Shu zahoti bot ishlaydi: Telegramda `/start` → **🍣 Menyu**. Admin panel: `https://SIZNING-MANZIL.onrender.com/admin`.

### 2-qadam. Vercel — Mini App (tez ochilishi uchun)
1. https://vercel.com → **Sign Up** → **GitHub** orqali kiring.
2. **Add New → Project** → `madi-sushi` → **Import**.
3. ⚠️ **Root Directory** → **Edit** → `miniapp` ni tanlang (eng ko'p uchraydigan xato — buni unutish).
4. **Environment Variables**: `VITE_API_URL` = `https://SIZNING-MANZIL.onrender.com/api`
5. **Deploy**. Manzil chiqadi: `https://madi-sushi.vercel.app` (yoki shunga o'xshash).

### 3-qadam. Render'ga Vercel manzilini qo'shish
Render → servis → **Environment** → **Add Environment Variable**:

| Kalit | Qiymat |
|---|---|
| `WEBAPP_URL` | `https://SIZNING-LOYIHA.vercel.app` |
| `CORS_ORIGINS` | `https://SIZNING-LOYIHA.vercel.app` |

**Save Changes** → server qayta ishga tushadi va botdagi **🍣 Menyu** tugmasi Vercel'ga ulanadi.

### 4-qadam. Serverni uxlatmaslik
Bepul Render 15 daqiqa jimlikdan keyin uxlaydi (uyg'onishi 30–60 soniya). GitHub Actions ish vaqtida (09:00–02:00) har 10 daqiqada uni turtib turadi.
Render manzili `https://madi-sushi.onrender.com` dan farq qilsa: GitHub → ombor → **Settings → Secrets and variables → Actions → Variables** → `SERVER_URL` = Render manzili.

### Bilib qo'ying
- Mini App ochilishi bilan menyu **darhol** ko'rinadi (menyu nusxasi ilova bilan birga keladi), server javob bergach jimgina yangilanadi. Menyuni ko'p o'zgartirsangiz, Vercel'da **Redeploy** qiling — nusxa yangilanadi.
- Yuklangan rasmlar **bazada** saqlanadi — Render qayta ishga tushganda o'chmaydi.
- Bitta botni ikki joydan ishlatib bo'lmaydi: server ishlayotganda kompyuterda `npm start` qilmang.
- Admin panelda 8 ta xato paroldan keyin o'sha IP 15 daqiqaga bloklanadi.

---

## Kompyuterda ishga tushirish (localhost)

### 1. Kompyuterga kerakli dasturlar (bir marta)

1. **Node.js** (LTS versiya): https://nodejs.org → yashil **LTS** tugmasi → o'rnating (hammasiga *Next*).
2. **Git**: https://git-scm.com/download/win → o'rnating.
3. **ngrok**: https://ngrok.com → *Sign up* → ro'yxatdan o'ting → *Download* → Windows uchun yuklab o'rnating.
   Saytdagi **Your Authtoken** sahifasidagi buyruqni terminalga bir marta kiriting:
   ```
   ngrok config add-authtoken SIZNING_TOKENINGIZ
   ```

### 2. Loyihani yuklab olish va o'rnatish

**PowerShell** (Windows → Start → "PowerShell") oching va ketma-ket yozing:

```powershell
cd Desktop
git clone -b claude/practical-pasteur-ah4bvu https://github.com/usmoon07-blip/madi-sushi.git
cd madi-sushi
npm run setup
```

`npm run setup` sizdan 4 ta narsani so'raydi: **Neon connection string**, **Bot token**, **Telegram ID** va **admin paroli**.
Har birini nusxalab joylashtiring (sichqonchaning o'ng tugmasi) va **Enter** bosing.

So'ng u avtomatik:
- paketlarni o'rnatadi (`npm install`),
- bazada jadvallarni yaratadi (`prisma migrate deploy`),
- boshlang'ich menyuni yozadi (`seed` — 11 ta mahsulot),
- Mini App va Admin panelni yig'adi (`build`).

### 3. Har kuni ishga tushirish

**1-oyna** (PowerShell, `madi-sushi` papkasida):
```powershell
npm start
```
`[bot] @... ishlayapti ✅` yozuvi chiqsa, hammasi joyida.

**2-oyna** (yangi PowerShell):
```powershell
ngrok http 3000
```

Hammasi shu. Server ngrok manzilini **o'zi topadi** va botdagi **🍣 Menyu** tugmasiga ulaydi (1-oynada `Mini App manzili: https://...` yozuvi chiqadi).

- Telegramda botingizga `/start` yozing → **🍣 Menyu** tugmasini bosing.
- Admin panel: brauzerda http://localhost:3000/admin → parolingiz.

> ⚠️ Ikkala oyna ham ochiq turishi kerak. Kompyuter o'chsa, bot ham to'xtaydi.
>
> ngrok bepul tarifida Mini App birinchi marta ochilganda ngrok ogohlantirish sahifasi chiqishi mumkin. **Visit Site** tugmasini bosing, keyin boshqa chiqmaydi.
>
> **Doimiy manzil (tavsiya):** ngrok saytida *Domains* bo'limidan bitta bepul domen oling va `ngrok http --url=SIZNING-DOMEN.ngrok-free.app 3000` deb ishga tushiring. Shunda manzil hech qachon o'zgarmaydi.

## 4. Admin panel imkoniyatlari

- **Buyurtmalar**: har 5 soniyada yangilanadi, yangi buyurtmada ovozli signal chalinadi.
  Holat tugmalari: *Qabul qilish → Jo'natish → Yakunlash*. Har bir o'zgarishda mijozga botdan xabar boradi.
  **🗺 Yandex Maps** / **🧭 Navigator** tugmalari mijoz lokatsiyasiga to'g'ridan-to'g'ri yo'l ochadi.
- **Mahsulotlar**: qo'shish, tahrirlash, rasm yuklash, **Faol/Nofaol** qilish, o'chirish.
- **Sozlamalar**: karta raqamlari (Uzcard/Humo), yetkazib berish narxi, bepul yetkazish chegarasi, minimal summa, filial manzili, telefon, buyurtma qabul qilishni to'xtatish, **oshxona cheki** (5-bo'lim).

Yangi buyurtma kelganda, adminning Telegramiga ham xabar, Yandex tugmasi va xaritadagi nuqta (lokatsiya) yuboriladi.

## 5. 🖨 Oshxona cheki (avtomatik chop etish)

Buyurtma kelganda oshxona printerida chek **avtomatik** chiqadi: buyurtma raqami, mahsulotlar (katta harfda), izoh, mijoz telefoni, manzil, to'lov turi va summa.
Bitta chek hech qachon ikki marta chiqmaydi. Printer o'chiq bo'lsa, chek yo'qolmaydi: printer yoqilishi bilan chiqadi.
Har bir buyurtma yonidagi **🖨 Chek** tugmasi chekni qayta chiqaradi.

**Admin panel → Sozlamalar → 🖨 Oshxona cheki** bo'limida quyidagilarni tanlang:
- **Chek qachon chiqsin**: *yangi buyurtma kelishi bilan* yoki *«Qabul qilish» bosilganda*;
- **Qog'oz kengligi**: 80 mm yoki 58 mm; **nusxalar soni**: 1–3 ta (masalan oshxona + kuryer uchun).

> **Server Render'da bo'lsa:** server internetda turadi va oshxonadagi ichki tarmoq printeriga ulana olmaydi. Shuning uchun **B) usulini** ishlating.
> LAN printerni ham Windows'ga printer qilib qo'shing (drayver o'rnatishda IP manzilini kiriting) — keyin xuddi USB kabi ishlaydi.
> Chrome yorlig'idagi manzil: `https://SIZNING-MANZIL.onrender.com/admin`.

### A) Tarmoq (LAN / Wi-Fi) printer — faqat kompyuterda (localhost) ishlaganda
1. Printerni router'ga kabel bilan ulang.
2. Printerning IP manzilini bilib oling. Printer o'chiq turganda **FEED** tugmasini bosib turib yoqing, shunda chiqadigan sinov chekida `IP Address: 192.168.x.x` yozilgan bo'ladi.
3. Sozlamalarda **Tarmoq (LAN / Wi-Fi)** ni tanlang, IP manzilni yozing va **Saqlash** ni bosing, keyin **🧾 Sinov cheki** ni bosing.

Bu usulda cheklarni server o'zi chiqaradi, admin panelni ochib qo'yish shart emas.

### B) Oshxona kompyuteri orqali (USB yoki Windows'ga qo'shilgan LAN printer)
1. Printer drayverini o'rnating va Windows'da uni **asosiy printer** qiling: *Sozlamalar → Printerlar → printer → «Использовать по умолчанию» / «Set as default»*.
2. Printer xususiyatlarida qog'oz o'lchamini 80 mm (yoki 58 mm) qilib qo'ying.
3. Oshxona kompyuterida Admin panelni oching. **Sozlamalar → Oshxona kompyuteri orqali** ni tanlang, **Saqlash** ni bosing, keyin **«Shu kompyuter — oshxona kompyuteri»** tugmasini yoqing.
4. Chek oynasiz, avtomatik chiqishi uchun maxsus Chrome yorlig'ini yarating. Ish stolida sichqonchaning o'ng tugmasini bosing → *Создать → Ярлык* (*New → Shortcut*) → quyidagini kiriting:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=http://localhost:3000/admin
   ```
   Nomini **Madi Oshxona** qilib qo'ying. Admin panelni har doim shu yorliq orqali oching.
   Avval barcha Chrome oynalarini yoping, aks holda `--kiosk-printing` ishlamaydi.
5. **🧾 Sinov cheki** ni bosib tekshiring.

> USB usulida Admin panel oynasi oshxona kompyuterida **ochiq turishi** kerak (oynani yig'ishtirib qo'ymang).
> Yon paneldagi yashil **🖨 Chek: shu kompyuter** yozuvi hammasi ishlayotganini bildiradi.

## 6. Yangilanishni o'rnatish

Loyihaning yangi versiyasi chiqqanda (`npm start` oynasini yopib, `madi-sushi` papkasida):
```powershell
git pull
npm run setup
npm start
```
`npm run setup` sozlamalaringizga tegmaydi: faqat yangi paketlarni o'rnatadi va bazani yangilaydi.

## 7. Foydali buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm start` | Serverni ishga tushirish |
| `npm run build` | Mini App/Admin kodi o'zgarsa, qayta yig'ish |
| `npm run db:studio` | Bazani brauzerda ko'rish (Prisma Studio) |
| `npm run db:migrate` | Migratsiyalarni bazaga qo'llash |
| `npm run db:seed` | Boshlang'ich menyu (faqat baza bo'sh bo'lsa yozadi) |

Sozlamalarni o'zgartirish uchun `backend/.env` faylini Notepad'da oching (yoki uni o'chirib, `npm run setup` ni qayta ishga tushiring).

## 8. Muammolar

| Belgi | Yechim |
|---|---|
| `Ulanib bo'lmadi` / `Can't reach database` | Internetni va `backend/.env` dagi `DATABASE_URL` ni tekshiring |
| `BOT_TOKEN noto'g'ri` | BotFather'dan tokenni qayta nusxalang |
| `Bot boshqa joyda ham ishga tushirilgan` | Faqat bitta `npm start` oynasi ochiq qolsin |
| Menyu tugmasi chiqmayapti | 2-oynada `ngrok http 3000` ishlayotganini tekshiring, botga `/start` yozing |
| `Printer: ulanmagan` (yon panelda qizil) | Printer yoqilganini, kabelni va IP manzilni tekshiring |
| USB printerda chop etish oynasi chiqyapti | Admin panelni `--kiosk-printing` yorlig'i orqali oching (5-bo'lim) |
| Lokatsiya aniqlanmayapti | Telefonda Telegram'ga joylashuv ruxsatini bering yoki manzilni qo'lda yozing |

## Loyiha tuzilishi

```
madi-sushi/
├── backend/                 # Node.js: Bot + API (Express, grammY, Prisma)
│   ├── src/
│   │   ├── config/default.js
│   │   ├── core/bot.js, webapp.js
│   │   ├── database/connection.js
│   │   ├── models/User.js, Product.js, Order.js, Settings.js
│   │   ├── controllers/botController.js, cartController.js, adminController.js
│   │   ├── routes/bot.routes.js, client.routes.js, admin.routes.js
│   │   ├── middlewares/auth.middleware.js
│   │   ├── services/geocode.js, maps.js, format.js, receipt.js, printer.js, printQueue.js
│   │   └── index.js
│   ├── prisma/schema.prisma, migrations/, seed.js
│   └── public/products/     # menyu rasmlari
├── miniapp/                 # React: mijozlar uchun Mini App
├── admin/                   # React: admin panel
└── scripts/setup.js         # bir buyruqli o'rnatish
```
