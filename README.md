# 🍣 Madi Sushi — Telegram Mini App + Bot + Admin panel

Toshkentdagi premium sushi bar uchun buyurtma tizimi. Qora-qizil dizaynda.

| Qism | Manzil | Vazifasi |
|---|---|---|
| **Mini App** (mijoz) | Telegram bot ichida | Menyu · Savat · Profil |
| **Admin panel** | http://localhost:3000/admin | Buyurtmalar, mahsulotlar, kartalar, sozlamalar |
| **Bot + API** | `backend/` | Buyurtmalarni qabul qiladi, mijoz va adminga xabar yuboradi |

---

## 1. Kompyuterga kerakli dasturlar (bir marta)

1. **Node.js** (LTS versiya): https://nodejs.org → yashil **LTS** tugmasi → o'rnating (hammasiga *Next*).
2. **Git**: https://git-scm.com/download/win → o'rnating.
3. **ngrok**: https://ngrok.com → *Sign up* → ro'yxatdan o'ting → *Download* → Windows uchun yuklab o'rnating.
   Saytdagi **Your Authtoken** sahifasidagi buyruqni terminalga bir marta kiriting:
   ```
   ngrok config add-authtoken SIZNING_TOKENINGIZ
   ```

## 2. Loyihani yuklab olish va o'rnatish

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

## 3. Har kuni ishga tushirish

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
- **Sozlamalar**: karta raqamlari (Uzcard/Humo), yetkazib berish narxi, bepul yetkazish chegarasi, minimal summa, filial manzili, telefon, buyurtma qabul qilishni to'xtatish.

Yangi buyurtma kelganda, adminning Telegramiga ham xabar, Yandex tugmasi va xaritadagi nuqta (lokatsiya) yuboriladi.

## 5. Foydali buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm start` | Serverni ishga tushirish |
| `npm run build` | Mini App/Admin kodi o'zgarsa, qayta yig'ish |
| `npm run db:studio` | Bazani brauzerda ko'rish (Prisma Studio) |
| `npm run db:migrate` | Migratsiyalarni bazaga qo'llash |
| `npm run db:seed` | Boshlang'ich menyu (faqat baza bo'sh bo'lsa yozadi) |

Sozlamalarni o'zgartirish uchun `backend/.env` faylini Notepad'da oching (yoki uni o'chirib, `npm run setup` ni qayta ishga tushiring).

## 6. Muammolar

| Belgi | Yechim |
|---|---|
| `Ulanib bo'lmadi` / `Can't reach database` | Internetni va `backend/.env` dagi `DATABASE_URL` ni tekshiring |
| `BOT_TOKEN noto'g'ri` | BotFather'dan tokenni qayta nusxalang |
| `Bot boshqa joyda ham ishga tushirilgan` | Faqat bitta `npm start` oynasi ochiq qolsin |
| Menyu tugmasi chiqmayapti | 2-oynada `ngrok http 3000` ishlayotganini tekshiring, botga `/start` yozing |
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
│   │   ├── services/geocode.js, maps.js, format.js
│   │   └── index.js
│   ├── prisma/schema.prisma, migrations/, seed.js
│   └── public/products/     # menyu rasmlari
├── miniapp/                 # React: mijozlar uchun Mini App
├── admin/                   # React: admin panel
└── scripts/setup.js         # bir buyruqli o'rnatish
```
