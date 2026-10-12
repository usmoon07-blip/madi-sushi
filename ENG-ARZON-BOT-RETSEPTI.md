# 🍣 ENG ARZON BOTIM RETSEPTI

> **Qanday ishlatiladi:** yangi chatda shu faylni yuboring (yoki shu omborni ulang) va
> **«eng arzon botim retsepti»** deb yozing. Claude quyidagi funksiyali botni noldan,
> to'liq ishlaydigan holda yasab, bepul serverga joylashtiradi.
>
> Pastdagi `[...]` qavslardagi joylarni har yangi biznes uchun almashtiring.
> **Maxfiy ma'lumotlar (token, parol, baza havolasi) bu faylga YOZILMAYDI** — ular faqat chatda
> beriladi va faqat Render sozlamalariga (Environment) qo'yiladi.

---

## 0. Har safar men beradigan ma'lumotlar

| Nima | Misol |
|---|---|
| Brend nomi | `[Madi Sushi]` |
| Logo (rasm) | chatga yuboraman |
| Asosiy filial manzili | `[Toshkent, Foziltepa ko'chasi, 40]` |
| Bot tokeni (BotFather) | chatda beraman — **gitga yozilmasin** |
| Admin Telegram ID | chatda beraman — **gitga yozilmasin** |
| Admin panel paroli | chatda beraman — **gitga yozilmasin** |
| Neon baza havolasi | chatda beraman — **gitga yozilmasin** |
| Dizayn ranglari | `[qora + qizil]` |
| Yetkazish narxi | `[15 000 so'm]` |

Agar biror narsa berilmasa — o'zing oqilona tanla va davom et, keyin menga ayt.

---

## 1. Umumiy talab

Toshkentdagi `[sushi bar]` uchun **premium Telegram bot + Mini App + Admin panel**.
Til: **o'zbek va rus** (hamma joyda: bot xabarlari, Mini App, buyruqlar). Admin panel — o'zbekcha.
Dizayn: `[qora fon, qizil aksent]`, zamonaviy, telefon va planshetda chiroyli.
Men dasturchi emasman (iPad va Windows'da ishlayman) — **hammasini o'zing qil**, menga faqat
oddiy tilda qadam-baqadam nima bosishni ayt.

Uch qism:
1. **Backend + bot** (Node.js) — bitta serverda, webhook rejimida.
2. **Mini App** (mijozlar uchun, React).
3. **Admin panel** (`/admin`, React) — shu serverning o'zida.

---

## 2. Bot (Telegram)

- `/start`: birinchi marta — til tanlash (🇺🇿 / 🇷🇺 tugmalari). Keyin **logo rasmi bilan**
  salomlashish xabari va «🍣 Menyuni ochish» (web_app) tugmasi.
- Chat menyusidagi tugma: «🍣 Menyu» (Mini App ochadi).
- Buyruqlar (uz/ru): `/start` — menyu, `/info` — filiallar, manzil, telefon, ish vaqti, `/lang` — til.
- **Mijozga xabarlar (o'z tilida):**
  - Buyurtma qabul qilindi + tarkibi + summa.
  - Lokatsiya kelmagan bo'lsa — «📍 Lokatsiyani yuborish» tugmasi bilan so'rash; kelsa buyurtmaga biriktiriladi.
  - **Karta to'lovi:** karta raqami(lar)i + muloyim matn: *«To'lovni amalga oshirgach, to'lov
    chekini shu chatga jo'nating — buyurtmangiz tez orada tasdiqlanadi. Rahmat! 🙏»*
  - Chek (rasm yoki PDF) kelganda: *«✅ Rahmat, chekingiz qabul qilindi! 🔎 Chek tekshirilmoqda…»*
  - Admin tasdiqlasa: *«✅ To'lovingiz tasdiqlandi! Buyurtma #N tasdiqlandi va tayyorlanmoqda»*
    (buyurtma o'zi «Tayyorlanmoqda»ga o'tadi). Rad etsa — chekni qayta jo'natishni muloyim so'raydi.
  - Holat o'zgarishlari: tayyorlanmoqda / yo'lda (olib ketishda «tayyor, … filialidan oling») /
    yakunlandi / bekor qilindi (+ aloqa telefoni).
- **Adminga xabarlar (o'zbekcha):**
  - Yangi buyurtma: mijoz, telefon, manzil, podyezd/qavat/xonadon/domofon, izoh, tarkib, to'lov,
    chek holati; tugmalar **«🚕 Yandex Go — dostavka»** va «🗺 Yandex Maps» + lokatsiya pini.
  - Mijoz chek yuborsa — chek rasmi va ostida **«✅ Tasdiqlash» / «❌ Rad etish»** tugmalari
    (faqat admin bosa oladi).
  - Lokatsiya keyin kelsa — alohida xabar. Yangi otziv — alohida xabar.
  - Admin botga lokatsiya yuborsa (buyurtmasiz) — bot koordinatani nusxalanadigan matn qilib qaytaradi.

### BotFather'da (menga qadam-baqadam ayt)
- `/mybots` → bot → Bot Settings → **Configure Mini App → Enable Mini App** → server havolasi
  (chatlar ro'yxatida **«OCHISH»** tugmasi chiqadi), Launch mode: **Fullscreen**.
- `/setuserpic` — logodan tayyorlangan kvadrat rasm (men tayyorlab beraman).

---

## 3. Mini App (mijoz)

**Umumiy:** telefon va planshetda **butun ekranga** ochiladi (`requestFullscreen`, Telegram
safe-area hisobga olinadi). Brend logosi: tepada, yuklanish va «Biz haqimizda»da. Pastki panel:
**Bosh sahifa · Savat · Buyurtmalar · Profil**.

1. **Birinchi ekran (har kirganda, mijoz tanlamaguncha turadi):** logo, til almashtirgich,
   - saqlangan manzil bo'lsa — «Shu manzilga yetkazib berish» (bir bosishda);
   - «🗺 Manzilni xaritadan tanlash»;
   - «🏃 Olib ketaman — o'zim boraman».
2. **Xaritadan manzil tanlash (Yaponamama uslubida):** tepada «Manzilni kiriting» qidiruvi
   (Toshkent bo'yicha), o'rtada xarita va markazda qizil pin, «Joylashuvni aniqlash» tugmasi,
   pastda pin ostidagi manzil va «Davom etish». Keyingi qadam: **Podyezd, Qavat, Xonadon,
   Domofon kodi** (+ manzil matnini tuzatish). Xarita: Leaflet + OpenStreetMap (bepul, kalitsiz).
3. **Bosh sahifa:** logo + «Salom, Ism», manzil va «Kuryer orqali / Olib ketish» tanlovi;
   qizil **«Menyu» bloki** — kategoriyalar rasmli **slayd: ekranda doim aniq 3 ta, o'zi bittadan
   suriladi, nuqtalarsiz**; «Menyuga o'tish»; pastda faqat **«Xit savdo ⭐»** mahsulotlar.
4. **Menyu:** tepada yopishqoq kategoriya plitkalari, pastda bo'limlar bo'yicha mahsulotlar
   (rasm, narx, eski narx/chegirma, ❤️ yoqtirish). Mahsulot oynasi: tavsif, tarkib, soni.
5. **Savat:**
   - mahsulotlar, ichimlik taklifi;
   - yetkazish usuli vaqti bilan: **Kuryer — ⏱ 90–100 daqiqa**, **Olib ketish — ⏱ 30–40 daqiqa**;
   - kuryerda: manzil kartasi (podyezd/qavat/xonadon/domofon bilan), «Kuryer uchun izoh»;
   - olib ketishda: **filial tanlash** (bir nechta filial bo'lsa);
   - telefon (Telegram'dagi raqamni so'rash tugmasi);
   - to'lov: **naqd yoki karta**; kartada karta raqamlari (nusxalash tugmasi) va chek haqida eslatma;
   - izoh, jami summa (yetkazish narxi doim qo'shiladi — **bepul yetkazish YO'Q**), minimal summa.
6. **Buyurtma qabul qilindi ekrani:** raqam, summa; karta bo'lsa — «To'lov chekini botga
   jo'nating» qutisi va «📸 Chekni botga jo'natish» tugmasi (o'zi yopilmaydi).
7. **Buyurtmalar:** holatlar rangli (Qabul qilindi / Tayyorlanmoqda / Yo'lda / Yakunlandi /
   Bekor qilindi), sahifa ochiq turganda **har 15 soniyada o'zi yangilanadi**, karta to'lovi
   holati (chek kutilmoqda / tekshirilmoqda / tasdiqlangan), «Qayta buyurtma».
8. **Profil — faqat ro'yxat:** Yoqtirilganlar, Menyu, **Filiallar** (hammasi: manzil, ish vaqti,
   xaritada ochish, qo'ng'iroq), Kontaktlar, Biz haqimizda, Otziv qoldirish (yulduzcha + matn), Til.

---

## 4. Admin panel (`/admin`, parol bilan)

- Kirish: parol; 8 marta xato — 15 daqiqa blok.
- **Buyurtmalar:** bugungi statistika, yangi buyurtmada ovoz, holatni o'zgartirish
  (Qabul qilindi → Tayyorlanmoqda → Yo'lda → Yakunlandi / Bekor qilindi), manzil,
  podyezd/qavat/xonadon, **🚕 Yandex Go tugmasi** — Yandex Go «Dostavka» bo'limini ochadi va
  **faqat «Qayerga» = mijoz lokatsiyasi** to'ldiriladi («Qayerdan»ni dispetcher o'zi tanlaydi);
  kompyuterda QR-kod (telefon bilan skanerlash), telefonda to'g'ridan-to'g'ri ochiladi;
  Yandex Maps / Navigator. Karta buyurtmalarida: «⏳ Chek kutilmoqda» yoki
  **«🔎 Chekni tekshirish»** → chek rasmi + «✅ To'lovni tasdiqlash» / «❌ Rad etish».
- **Oshxona cheki avtomatik chiqadi:** oshxona kompyuterida admin panel ochiq turadi
  (Chrome `--kiosk-printing`), yangi buyurtma kelishi bilan chek printerga ketadi; har chek
  faqat bir marta (atomar band qilish). Mahalliy rejimda tarmoq printeri (ESC/POS, 9100-port) ham.
- **Mahsulotlar:** qo'shish/tahrirlash/o'chirish, faol/nofaol, uz+ru nom/tavsif/tarkib,
  kategoriya, «Xit» belgisi, narx/eski narx, rasm yuklash (brauzerda WEBP ga siqiladi).
- **Kategoriyalar:** rasm bilan, tartib, faol/nofaol.
- **Filiallar:** **«+ Filial qo'shish»**, nom (uz/ru), manzil, **lokatsiya xaritadan bosib
  tanlanadi** (yoki koordinata / Yandex·Google havolasi, qisqa havola ham), telefon, ish vaqti.
- **Otzivlar** ro'yxati.
- **Sozlamalar:** karta raqamlari, yetkazish narxi, minimal buyurtma, aloqa telefoni, ish vaqti,
  Instagram, «Biz haqimizda» (uz/ru), qabul ochiq/yopiq, printer sozlamalari.
- Telefonda ham qulay (moslashuvchan dizayn).

---

## 5. Texnologiya

- Node 22, Express, **grammY** (webhook), **Prisma + PostgreSQL (Neon, bepul)**.
- React 18 + Vite: `miniapp` va `admin` — ikkalasi backend serverning o'zidan beriladi
  (`/` va `/admin`), alohida hosting kerak emas.
- Mini App so'rovlari Telegram `initData` imzosi bilan tekshiriladi; admin — HMAC token.
- Yuklangan rasmlar **bazada** saqlanadi (bepul serverning diski vaqtinchalik).
- Manzil aniqlash/qidirish: Nominatim (bepul), Yandex Geocoder kaliti bo'lsa — Yandex.
- Ma'lumotlar bazasi o'zgarishlari faqat Prisma migratsiyalari bilan; boshlang'ich menyu `seed`
  (versiyali — bir marta yoziladi, admin o'zgartirganini buzmaydi).
- Mahsulot/kategoriya rasmlari — litsenziyasi toza bepul fotolar (Pexels), Pinterest emas.

---

## 6. Server retsepti — BEPUL, TEZ OCHILADI, UXLAMAYDI

1. **Kod GitHub'da** (ombor ochiq bo'lishi mumkin — shuning uchun maxfiy ma'lumot gitga
   **hech qachon** yozilmaydi; har commitdan oldin tekshiriladi).
2. **Neon** (bepul Postgres): `DATABASE_URL` — *pooled* havola (`-pooler`,
   `pgbouncer=true&connect_timeout=15`), `DIRECT_URL` — oddiy havola (migratsiyalar uchun).
3. **Render** (bepul, Frankfurt) — `render.yaml` Blueprint bilan:
   - build: `npm install --include=dev` (backend, admin, miniapp) + `vite build`;
   - start: `prisma migrate deploy && node prisma/seed.js && node src/index.js`;
   - `healthCheckPath: /api/health`, `autoDeploy: true` (gitga push → o'zi yangilanadi);
   - Environment'ga faqat Render'da kiritiladi: `BOT_TOKEN`, `ADMIN_IDS`, `ADMIN_PASSWORD`,
     `DATABASE_URL`, `DIRECT_URL` (`APP_SECRET` o'zi yaratiladi).
   - Server `RENDER_EXTERNAL_URL`ni o'zi oladi → webhook va Mini App havolasini o'zi o'rnatadi.
4. **Uxlamasligi uchun:** GitHub Actions `keep-alive.yml` — ish vaqtida **har 10 daqiqada**
   `/api/health`ga turtki (`*/10 4-21 * * *` UTC = Toshkent 09:00–02:00, oyiga ~540 soat —
   Render'ning bepul 750 soatiga sig'adi). Xato bo'lsa ham workflow qizarmaydi.
5. **Tez ochilishi uchun:**
   - server porti darhol ochiladi (baza ulanishini kutmaydi);
   - Mini App ichiga **menyu nusxasi (snapshot)** joylangan — ekran darhol chiqadi, yangi
     ma'lumot orqadan jimgina yuklanadi; server uyg'onguncha qayta urinadi;
   - rasmlar siqilgan (WEBP), statik fayllar keshlanadi, xarita kodi faqat kerak bo'lganda yuklanadi.
6. **Tekshiruv:** `site-check.yml` (qo'lda) — saytda qaysi versiya turganini ko'rsatadi.
7. Webhook manzili tokendan yasalgan maxfiy yo'l + `secret_token`; token loglarda yashiriladi.

---

## 7. Ish tartibi (Claude uchun)

- Hammasini o'zing qil; har bosqich oxirida menga **oddiy o'zbek tilida** nima o'zgarganini va
  nima bosishim kerakligini ayt (texnik so'zlarsiz).
- Har o'zgarishni build qilib, brauzerda (Playwright) skrinshot bilan tekshir; Telegram'ning
  o'zida sinab bo'lmasa — ochiq ayt.
- Gitga push qilishdan oldin maxfiy ma'lumotlar yo'qligini tekshir.
- Mening xabarlarimga muloyim, qisqa va tushunarli javob ber.
