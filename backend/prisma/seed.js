// Boshlang'ich ma'lumotlar. Har bir versiya bazaga faqat BIR MARTA yoziladi (Settings.seedVersion),
// shuning uchun admin paneldagi o'zgarishlar qayta yozilmaydi. Qayta ishga tushirish xavfsiz.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const svg = (name) => `/static/products/${name}.svg`;
const photo = (name) => `/static/products/photos/${name}.jpg`;
// Haqiqiy suratlar (Pexels, bepul litsenziya). Chizma (svg) o'rniga ishlatiladi
const img = photo;
const SEED_VERSION = 3;

const ABOUT_UZ =
  "Madi Sushi — Toshkentdagi premium sushi bar. Biz har bir rollni buyurtmadan so'ng yangi tayyorlaymiz: " +
  'sifatli baliq, maxsus sushi guruchi va mualliflik souslari. Shahar bo‘ylab tez yetkazib beramiz.';
const ABOUT_RU =
  'Madi Sushi — премиальный суши-бар в Ташкенте. Каждый ролл готовим сразу после заказа: ' +
  'отборная рыба, специальный рис для суши и авторские соусы. Быстро доставляем по всему городу.';

// "Nigiri" — 1-versiyadagi nom, endi "Sushi" deb ataladi
const CATEGORIES = [
  { nameUz: 'Setlar', nameRu: 'Сеты', imageUrl: photo('cat-sets'), oldImage: svg('madi-premium-set') },
  { nameUz: 'Rollar', nameRu: 'Роллы', imageUrl: photo('cat-rolls'), oldImage: svg('philadelphia') },
  { nameUz: 'Sushi', nameRu: 'Суши', imageUrl: photo('cat-sushi'), oldImage: svg('nigiri-salmon'), oldNames: ['Nigiri'] },
  { nameUz: 'Salatlar', nameRu: 'Салаты', imageUrl: photo('caesar-salmon'), oldImage: svg('chuka-salad') },
  { nameUz: 'Ichimliklar', nameRu: 'Напитки', imageUrl: photo('cat-drinks'), oldImage: svg('coca-cola') },
  { nameUz: 'Souslar', nameRu: 'Соусы', imageUrl: photo('cat-sauces'), oldImage: svg('sauces') },
];

const PRODUCTS = [
  {
    category: 'Rollar',
    name: 'Filadelfiya',
    nameRu: 'Филадельфия',
    description: 'Eng mashhur roll: yangi norvej losos, yumshoq krem-pishloq va bodring.',
    descriptionRu: 'Самый популярный ролл: свежий норвежский лосось, нежный сливочный сыр и огурец.',
    ingredients: ['Norvej losos', 'Krem-pishloq', 'Bodring', 'Guruch', 'Nori'],
    ingredientsRu: ['Норвежский лосось', 'Сливочный сыр', 'Огурец', 'Рис', 'Нори'],
    oldPrice: 99000,
    price: 89000,
    imageUrl: img('philadelphia'),
    isHit: true,
  },
  {
    category: 'Rollar',
    name: 'Kaliforniya',
    nameRu: 'Калифорния',
    description: "Klassik Kaliforniya: qisqichbaqa, avokado va to'q sariq masago ikrasi.",
    descriptionRu: 'Классическая Калифорния: краб, авокадо и икра масаго.',
    ingredients: ['Qisqichbaqa', 'Avokado', 'Bodring', 'Masago ikrasi', 'Yapon mayonezi'],
    ingredientsRu: ['Краб', 'Авокадо', 'Огурец', 'Икра масаго', 'Японский майонез'],
    price: 75000,
    imageUrl: img('california'),
    isHit: true,
  },
  {
    category: 'Rollar',
    name: 'Ajdaho (Dragon)',
    nameRu: 'Дракон',
    description: 'Avokado bilan qoplangan, ichida dudlangan ugor va unagi sousi.',
    descriptionRu: 'Покрыт авокадо, внутри копчёный угорь и соус унаги.',
    ingredients: ['Dudlangan ugor', 'Avokado', 'Krem-pishloq', 'Bodring', 'Unagi sousi', 'Kunjut'],
    ingredientsRu: ['Копчёный угорь', 'Авокадо', 'Сливочный сыр', 'Огурец', 'Соус унаги', 'Кунжут'],
    oldPrice: 110000,
    price: 95000,
    imageUrl: img('dragon'),
    isHit: true,
  },
  {
    category: 'Rollar',
    name: 'Qora samuray',
    nameRu: 'Чёрный самурай',
    description: "Tempura krevetka, losos va krem-pishloq. Qarsildoq va to'yimli.",
    descriptionRu: 'Креветка темпура, лосось и сливочный сыр. Хрустящий и сытный.',
    ingredients: ['Tempura krevetka', 'Losos', 'Krem-pishloq', 'Qora kunjut', 'Nori'],
    ingredientsRu: ['Креветка темпура', 'Лосось', 'Сливочный сыр', 'Чёрный кунжут', 'Нори'],
    price: 85000,
    imageUrl: img('black-samurai'),
  },
  {
    category: 'Rollar',
    name: 'Spicy Tuna',
    nameRu: 'Спайси тунец',
    description: "O'tkir sousdagi tunets va bodring — achchiq yoqtiruvchilar uchun.",
    descriptionRu: 'Тунец в остром соусе и огурец — для любителей острого.',
    ingredients: ['Tunets', 'Spicy sous', 'Bodring', 'Guruch', 'Nori'],
    ingredientsRu: ['Тунец', 'Соус спайси', 'Огурец', 'Рис', 'Нори'],
    price: 79000,
    imageUrl: img('spicy-tuna'),
  },
  {
    category: 'Setlar',
    name: 'Madi Premium set',
    nameRu: 'Сет Madi Premium',
    description: '32 dona: Filadelfiya, Kaliforniya, Ajdaho va Qora samuray. 3–4 kishilik.',
    descriptionRu: '32 штуки: Филадельфия, Калифорния, Дракон и Чёрный самурай. На 3–4 персоны.',
    ingredients: ['Filadelfiya — 8 dona', 'Kaliforniya — 8 dona', 'Ajdaho — 8 dona', 'Qora samuray — 8 dona', 'Imbir, vasabi, soya sousi'],
    ingredientsRu: ['Филадельфия — 8 шт', 'Калифорния — 8 шт', 'Дракон — 8 шт', 'Чёрный самурай — 8 шт', 'Имбирь, васаби, соевый соус'],
    oldPrice: 329000,
    price: 289000,
    imageUrl: img('madi-premium-set'),
    isHit: true,
  },
  {
    category: 'Setlar',
    name: 'Filadelfiya set',
    nameRu: 'Сет Филадельфия',
    description: '24 dona Filadelfiya: klassik, kunjutli va kuydirilgan losos bilan.',
    descriptionRu: '24 штуки Филадельфии: классическая, с кунжутом и с опалённым лососем.',
    ingredients: ['Filadelfiya klassik — 8 dona', 'Filadelfiya kunjutli — 8 dona', 'Filadelfiya flambe — 8 dona', 'Imbir, vasabi, soya sousi'],
    ingredientsRu: ['Филадельфия классика — 8 шт', 'Филадельфия с кунжутом — 8 шт', 'Филадельфия фламбе — 8 шт', 'Имбирь, васаби, соевый соус'],
    oldPrice: 259000,
    price: 239000,
    imageUrl: img('philadelphia-set'),
  },
  {
    category: 'Sushi',
    name: 'Nigiri losos',
    nameRu: 'Нигири лосось',
    description: '2 dona. Guruch ustida yangi losos bo‘lagi.',
    descriptionRu: '2 штуки. Свежий лосось на рисе.',
    ingredients: ['Norvej losos', 'Sushi guruchi', 'Vasabi'],
    ingredientsRu: ['Норвежский лосось', 'Рис для суши', 'Васаби'],
    price: 39000,
    imageUrl: img('nigiri-salmon'),
  },
  {
    category: 'Sushi',
    name: 'Nigiri ugor',
    nameRu: 'Нигири угорь',
    description: '2 dona. Dudlangan ugor, unagi sousi va kunjut.',
    descriptionRu: '2 штуки. Копчёный угорь, соус унаги и кунжут.',
    ingredients: ['Dudlangan ugor', 'Sushi guruchi', 'Unagi sousi', 'Kunjut'],
    ingredientsRu: ['Копчёный угорь', 'Рис для суши', 'Соус унаги', 'Кунжут'],
    price: 45000,
    imageUrl: img('nigiri-eel'),
  },
  {
    category: 'Salatlar',
    name: 'Chuka salat',
    nameRu: 'Салат Чука',
    description: "Dengiz o'tlari, yong'oq sousi va kunjut.",
    descriptionRu: 'Морские водоросли, ореховый соус и кунжут.',
    ingredients: ["Chuka dengiz o'ti", "Yong'oq sousi", 'Kunjut', 'Limon'],
    ingredientsRu: ['Водоросли чука', 'Ореховый соус', 'Кунжут', 'Лимон'],
    price: 35000,
    imageUrl: img('chuka-salad'),
  },
  {
    category: 'Salatlar',
    name: 'Sezar losos bilan',
    nameRu: 'Цезарь с лососем',
    description: 'Aysberg salati, losos, parmezan, kruton va Sezar sousi.',
    descriptionRu: 'Салат айсберг, лосось, пармезан, крутоны и соус Цезарь.',
    ingredients: ['Aysberg salati', 'Losos', 'Parmezan', 'Kruton', 'Bedana tuxumi', 'Sezar sousi'],
    ingredientsRu: ['Салат айсберг', 'Лосось', 'Пармезан', 'Крутоны', 'Перепелиное яйцо', 'Соус Цезарь'],
    price: 59000,
    imageUrl: img('caesar-salmon'),
  },
  {
    category: 'Ichimliklar',
    name: 'Coca-Cola 0.5',
    nameRu: 'Coca-Cola 0.5',
    description: 'Muzdek Coca-Cola, 0.5 l.',
    descriptionRu: 'Холодная Coca-Cola, 0,5 л.',
    ingredients: [],
    ingredientsRu: [],
    price: 12000,
    imageUrl: img('coca-cola'),
  },
  {
    category: 'Ichimliklar',
    name: 'Yashil choy',
    nameRu: 'Зелёный чай',
    description: 'Yapon yashil choyi, 0.4 l.',
    descriptionRu: 'Японский зелёный чай, 0,4 л.',
    ingredients: [],
    ingredientsRu: [],
    price: 15000,
    imageUrl: img('green-tea'),
  },
  {
    category: 'Souslar',
    name: 'Soya sousi',
    nameRu: 'Соевый соус',
    description: '40 ml.',
    descriptionRu: '40 мл.',
    ingredients: [],
    ingredientsRu: [],
    price: 4000,
    imageUrl: img('soy-sauce'),
  },
  {
    category: 'Souslar',
    name: 'Spicy sous',
    nameRu: 'Соус спайси',
    description: "O'tkir yapon sousi, 40 ml.",
    descriptionRu: 'Острый японский соус, 40 мл.',
    ingredients: [],
    ingredientsRu: [],
    price: 5000,
    imageUrl: img('spicy-sauce'),
  },
  {
    category: 'Souslar',
    name: 'Unagi sousi',
    nameRu: 'Соус унаги',
    description: 'Shirin-sho‘r ugor sousi, 40 ml.',
    descriptionRu: 'Сладко-солёный соус для угря, 40 мл.',
    ingredients: [],
    ingredientsRu: [],
    price: 5000,
    imageUrl: img('unagi-sauce'),
  },
];

// Kategoriyalarni yaratadi yoki eskisini topib, ruscha nomi va rasmini to'ldiradi
async function ensureCategories() {
  const byName = new Map();
  for (const [i, c] of CATEGORIES.entries()) {
    const names = [c.nameUz, ...(c.oldNames || [])];
    let cat = await prisma.category.findFirst({ where: { nameUz: { in: names } } });
    if (cat) {
      cat = await prisma.category.update({
        where: { id: cat.id },
        data: {
          nameUz: c.oldNames?.includes(cat.nameUz) ? c.nameUz : cat.nameUz,
          nameRu: cat.nameRu || c.nameRu,
          // Bo'sh yoki eski chizma bo'lsa — surat qo'yamiz; admin yuklagan rasmga tegmaymiz
          imageUrl: !cat.imageUrl || cat.imageUrl === c.oldImage ? c.imageUrl : cat.imageUrl,
          sortOrder: i + 1,
        },
      });
    } else {
      cat = await prisma.category.create({ data: { nameUz: c.nameUz, nameRu: c.nameRu, imageUrl: c.imageUrl, sortOrder: i + 1 } });
    }
    byName.set(c.nameUz, cat);
  }
  return byName;
}

async function main() {
  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  if (settings.seedVersion >= SEED_VERSION) {
    console.log("Boshlang'ich ma'lumotlar allaqachon yozilgan — o'tkazib yuborildi.");
    return;
  }

  // Yangi bazada birinchi filial — olib ketish manzilidan
  if ((await prisma.branch.count()) === 0 && settings.pickupAddress) {
    await prisma.branch.create({
      data: { name: 'Foziltepa', nameRu: 'Фозилтепа', address: settings.pickupAddress, phone: settings.contactPhone, workHours: settings.workHours },
    });
  }

  const categories = await ensureCategories();
  const existing = await prisma.product.findMany();
  const existingByName = new Map(existing.map((p) => [p.name, p]));
  const anyHit = existing.some((p) => p.isHit);
  let created = 0;
  let updated = 0;

  for (const [i, p] of PRODUCTS.entries()) {
    const { category, isHit, ...data } = p;
    const categoryId = categories.get(category).id;
    const old = existingByName.get(p.name);
    if (old) {
      // Mavjud mahsulot: faqat bo'sh ruscha maydonlarni to'ldiramiz, narx va boshqalarga tegmaymiz
      await prisma.product.update({
        where: { id: old.id },
        data: {
          nameRu: old.nameRu || p.nameRu,
          descriptionRu: old.descriptionRu || p.descriptionRu,
          ingredientsRu: old.ingredientsRu?.length ? old.ingredientsRu : p.ingredientsRu,
          isHit: anyHit ? old.isHit : Boolean(isHit),
          categoryId: old.categoryId ?? categoryId,
          imageUrl: !old.imageUrl || /^\/static\/products\/[a-z-]+\.svg$/.test(old.imageUrl) ? p.imageUrl : old.imageUrl,
        },
      });
      updated += 1;
    } else if (!existing.length || ['Salatlar', 'Souslar'].includes(category)) {
      // Bo'sh baza — hammasi; eski baza — faqat yangi kategoriyalar mahsulotlari
      await prisma.product.create({ data: { ...data, categoryId, isHit: Boolean(isHit), sortOrder: i + 1 } });
      created += 1;
    }
  }

  await prisma.settings.update({
    where: { id: 1 },
    data: {
      seedVersion: SEED_VERSION,
      aboutUz: settings.aboutUz || ABOUT_UZ,
      aboutRu: settings.aboutRu || ABOUT_RU,
    },
  });
  console.log(`✅ Kategoriyalar: ${categories.size}, yangi mahsulotlar: ${created}, yangilangan: ${updated}`);
}

main()
  .catch((err) => {
    console.error('Seed xatosi:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
