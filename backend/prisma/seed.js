// Boshlang'ich ma'lumotlar. Har bir versiya bazaga faqat BIR MARTA yoziladi (Settings.seedVersion),
// shuning uchun admin paneldagi o'zgarishlar qayta yozilmaydi. Qayta ishga tushirish xavfsiz.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
// Menyu suratlari — mijozning menyu plakatidan kesib, sifati oshirilgan
const img = (name) => `/static/products/menu-v3/${name}.jpg`;
// 4-versiya: menyu mijozning plakatiga to'liq almashtirildi
// 5-versiya: Burger set — sushi-burger surati; setlarning yig'ma (kollaj) rasmlari olib tashlandi
// 6-versiya: uchala set uchun buyurtmachi bergan professional suratlar
// 9-versiya: Instagram — sushi_madi
// 8-versiya: rollar ostidagi qora soya olib tashlandi (menu-v3)
// 7-versiya: barcha suratlar Real-ESRGAN bilan tiniqlashtirildi (yangi papka — telefon keshi eskisini ko'rsatmasin)
const SEED_VERSION = 9;

const ABOUT_UZ =
  "Madi Sushi — Toshkentdagi premium sushi bar. Biz har bir rollni buyurtmadan so'ng yangi tayyorlaymiz: " +
  'sifatli baliq, maxsus sushi guruchi va mualliflik souslari. Shahar bo‘ylab tez yetkazib beramiz.';
const ABOUT_RU =
  'Madi Sushi — премиальный суши-бар в Ташкенте. Каждый ролл готовим сразу после заказа: ' +
  'отборная рыба, специальный рис для суши и авторские соусы. Быстро доставляем по всему городу.';

const CATEGORIES = [
  { nameUz: 'Setlar', nameRu: 'Сеты', imageUrl: img('family-set') },
  { nameUz: 'Rollar', nameRu: 'Роллы', imageUrl: img('filadelfiya-klassika') },
  { nameUz: "Qo'shimchalar", nameRu: 'Добавки', imageUrl: img('wasabi') },
  { nameUz: 'Ichimliklar', nameRu: 'Напитки', imageUrl: img('cola') },
];

const PRODUCTS = [
  {
    category: 'Setlar',
    name: 'Family set',
    nameRu: 'Family сет',
    description: "Butun oila uchun ideal tanlov! 44 dona roll + bonus: sarimsoqli non va Coca-Cola 2 L.",
    descriptionRu: 'Идеальный выбор для всей семьи! 44 штуки роллов + бонус: чесночный хлеб и Coca-Cola 2 л.',
    ingredients: ['Filadelfiya klassika — 8 dona', 'Tempura kuriniy — 8 dona', 'Kaliforniya — 8 dona', 'Kraboviy zapechyonniy — 10 dona', 'Zapechyonniy tovuqli — 10 dona', '🎁 Bonus: sarimsoqli non', '🎁 Bonus: Coca-Cola 2 L'],
    ingredientsRu: ['Филадельфия классика — 8 шт', 'Темпура куриный — 8 шт', 'Калифорния — 8 шт', 'Крабовый запечённый — 10 шт', 'Запечённый с курицей — 10 шт', '🎁 Бонус: чесночный хлеб', '🎁 Бонус: Coca-Cola 2 л'],
    price: 260000,
    imageUrl: img('family-set'),
    isHit: true,
  },
  {
    category: 'Setlar',
    name: 'Burger set',
    nameRu: 'Бургер сет',
    description: "Sushi-burger va 4 xil roll (34 dona) + bonus: Coca-Cola 1,5 L va tartar non.",
    descriptionRu: 'Суши-бургер и 4 вида роллов (34 шт) + бонус: Coca-Cola 1,5 л и тартар хлеб.',
    ingredients: ['Sushi-burger kuriniy — 1 dona', 'Kurini zapechyonniy roll — 10 dona', 'Kraboviy zapechyonniy roll — 10 dona', 'Chiz sezar roll — 8 dona', 'Maki agurets roll — 6 dona', '🎁 Bonus: Coca-Cola 1,5 L', '🎁 Bonus: tartar non'],
    ingredientsRu: ['Суши-бургер куриный — 1 шт', 'Ролл куриный запечённый — 10 шт', 'Ролл крабовый запечённый — 10 шт', 'Ролл чиз цезарь — 8 шт', 'Маки огурец — 6 шт', '🎁 Бонус: Coca-Cola 1,5 л', '🎁 Бонус: тартар хлеб'],
    price: 240000,
    imageUrl: img('burger-set'),
    isHit: true,
  },
  {
    category: 'Setlar',
    name: 'Jarini set',
    nameRu: 'Жареный сет',
    description: "Issiq va tempura rollar to'plami (32 dona) + bonus: Coca-Cola 1,5 L va tartar non.",
    descriptionRu: 'Сет из запечённых и темпура роллов (32 шт) + бонус: Coca-Cola 1,5 л и тартар хлеб.',
    ingredients: ['Zapechyonniy losos roll — 10 dona', 'Sezar roll — 8 dona', 'Tempura losos roll — 8 dona', 'Maki losos roll — 6 dona', '🎁 Bonus: Coca-Cola 1,5 L', '🎁 Bonus: tartar non'],
    ingredientsRu: ['Ролл запечённый лосось — 10 шт', 'Ролл цезарь — 8 шт', 'Ролл темпура лосось — 8 шт', 'Маки лосось — 6 шт', '🎁 Бонус: Coca-Cola 1,5 л', '🎁 Бонус: тартар хлеб'],
    price: 200000,
    imageUrl: img('jarini-set'),
    isHit: true,
  },
  { category: 'Rollar', name: 'Karamelniy ugor', nameRu: 'Карамельный угорь', description: '8 dona', descriptionRu: '8 шт', price: 100000, imageUrl: img('karamel-ugor'), isHit: true },
  { category: 'Rollar', name: 'Filadelfiya klassika', nameRu: 'Филадельфия классика', description: '8 dona', descriptionRu: '8 шт', price: 88000, imageUrl: img('filadelfiya-klassika'), isHit: true },
  { category: 'Rollar', name: 'Fila layt', nameRu: 'Фила лайт', description: '8 dona', descriptionRu: '8 шт', price: 73000, imageUrl: img('fila-layt') },
  { category: 'Rollar', name: 'Tempura kuriniy', nameRu: 'Темпура куриный', description: '8 dona', descriptionRu: '8 шт', price: 85000, imageUrl: img('tempura-kuriniy') },
  { category: 'Rollar', name: 'Tempura losos', nameRu: 'Темпура лосось', description: '8 dona', descriptionRu: '8 шт', price: 90000, imageUrl: img('tempura-losos'), isHit: true },
  { category: 'Rollar', name: 'Chiz roll', nameRu: 'Чиз ролл', description: '8 dona', descriptionRu: '8 шт', price: 75000, imageUrl: img('chiz-roll') },
  { category: 'Rollar', name: 'Dabl chiz', nameRu: 'Дабл чиз', description: '8 dona', descriptionRu: '8 шт', price: 85000, imageUrl: img('dabl-chiz') },
  { category: 'Rollar', name: 'Chiz sezar', nameRu: 'Чиз цезарь', description: '8 dona', descriptionRu: '8 шт', price: 70000, imageUrl: img('chiz-sezar') },
  { category: 'Rollar', name: 'Chiz sezar 2×2', nameRu: 'Чиз цезарь 2×2', description: '8 dona', descriptionRu: '8 шт', price: 80000, imageUrl: img('chiz-2x2') },
  { category: 'Rollar', name: 'Kaliforniya kunjutli', nameRu: 'Калифорния в кунжуте', description: '8 dona', descriptionRu: '8 шт', price: 70000, imageUrl: img('kaliforniya-kunjut') },
  { category: 'Rollar', name: 'Kaliforniya', nameRu: 'Калифорния', description: '8 dona', descriptionRu: '8 шт', price: 75000, imageUrl: img('kaliforniya'), isHit: true },
  { category: 'Rollar', name: 'Zapechyonniy tovuqli', nameRu: 'Запечённый с курицей', description: '10 dona', descriptionRu: '10 шт', price: 68000, imageUrl: img('zapechyon-tovuq') },
  { category: 'Rollar', name: 'Kurini zapechyonniy', nameRu: 'Куриный запечённый', description: '10 dona', descriptionRu: '10 шт', price: 75000, imageUrl: img('kurini-zapechyon') },
  { category: "Qo'shimchalar", name: 'Soya sousi', nameRu: 'Соевый соус', description: '1 dona', descriptionRu: '1 шт', price: 5000, imageUrl: img('soy') },
  { category: "Qo'shimchalar", name: 'Imbir', nameRu: 'Имбирь', description: '1 dona', descriptionRu: '1 шт', price: 5000, imageUrl: img('ginger') },
  { category: "Qo'shimchalar", name: 'Vasabi', nameRu: 'Васаби', description: '1 dona', descriptionRu: '1 шт', price: 5000, imageUrl: img('wasabi') },
  { category: "Qo'shimchalar", name: 'Tayoqchalar (chop)', nameRu: 'Палочки', description: '1 juft', descriptionRu: '1 пара', price: 5000, imageUrl: img('chop') },
  { category: 'Ichimliklar', name: 'Coca-Cola 1,5 L', nameRu: 'Coca-Cola 1,5 л', description: '1,5 litr', descriptionRu: '1,5 литра', price: 20000, imageUrl: img('cola') },
  { category: 'Ichimliklar', name: 'Coca-Cola 2 L', nameRu: 'Coca-Cola 2 л', description: '2 litr', descriptionRu: '2 литра', price: 25000, imageUrl: img('cola') },
];

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

  if (settings.seedVersion < 4) await replaceMenu();
  else {
    if (settings.seedVersion < 5) await updateSets();
    if (settings.seedVersion < 6) await setSetPhotos();
    await moveImages(['/static/products/menu/', '/static/products/menu-hd/'], '/static/products/menu-v3/');
  }

  await prisma.settings.update({
    where: { id: 1 },
    data: {
      seedVersion: SEED_VERSION,
      instagram: 'sushi_madi',
      aboutUz: settings.aboutUz || ABOUT_UZ,
      aboutRu: settings.aboutRu || ABOUT_RU,
    },
  });
}

// 7–8-versiya: suratlar yangi papkaga (telefon keshi eskisini ko'rsatmasin; admin yuklaganlariga tegmaydi)
async function moveImages(froms, to) {
  for (const from of froms) {
    for (const p of await prisma.product.findMany({ where: { imageUrl: { startsWith: from } } })) {
      await prisma.product.update({ where: { id: p.id }, data: { imageUrl: p.imageUrl.replace(from, to) } });
    }
    for (const c of await prisma.category.findMany({ where: { imageUrl: { startsWith: from } } })) {
      await prisma.category.update({ where: { id: c.id }, data: { imageUrl: c.imageUrl.replace(from, to) } });
    }
  }
  console.log('✅ Suratlar yangi papkaga o‘tkazildi:', to);
}

// 6-versiya: setlarga yangi suratlar (admin o'zi yuklagan rasm bo'lsa — tegmaymiz)
async function setSetPhotos() {
  const isOurs = (url) => !url || url.startsWith('/static/');
  for (const name of ['Family set', 'Burger set', 'Jarini set']) {
    const p = PRODUCTS.find((x) => x.name === name);
    const old = await prisma.product.findFirst({ where: { name } });
    if (old && isOurs(old.imageUrl)) await prisma.product.update({ where: { id: old.id }, data: { imageUrl: p.imageUrl } });
  }
  const cat = await prisma.category.findFirst({ where: { nameUz: 'Setlar' } });
  if (cat && isOurs(cat.imageUrl)) await prisma.category.update({ where: { id: cat.id }, data: { imageUrl: CATEGORIES[0].imageUrl } });
  console.log('✅ Set suratlari yangilandi');
}

// 5-versiya: faqat Burger set va Jarini set yangilanadi (admin o'zgartirgan rasmga tegmaydi)
async function updateSets() {
  for (const name of ['Burger set', 'Jarini set']) {
    const p = PRODUCTS.find((x) => x.name === name);
    const old = await prisma.product.findFirst({ where: { name } });
    if (!old) continue;
    const keepImage = old.imageUrl && !/\/static\/products\/menu\/(burger|jarini)-set\.jpg$/.test(old.imageUrl);
    await prisma.product.update({
      where: { id: old.id },
      data: {
        description: p.description,
        descriptionRu: p.descriptionRu,
        ingredients: p.ingredients,
        ingredientsRu: p.ingredientsRu,
        ...(keepImage ? {} : { imageUrl: p.imageUrl }),
      },
    });
  }
  console.log('✅ Setlar yangilandi');
}

// Menyu to'liq yangilanadi: eski mahsulot va kategoriyalar o'chiriladi
// (eski buyurtmalar o'chmaydi — tarkibi buyurtmaning o'zida saqlangan)
async function replaceMenu() {
  await prisma.$transaction(async (tx) => {
    await tx.product.deleteMany({});
    await tx.category.deleteMany({});
    const ids = new Map();
    for (const [i, c] of CATEGORIES.entries()) {
      const cat = await tx.category.create({ data: { ...c, sortOrder: i + 1 } });
      ids.set(c.nameUz, cat.id);
    }
    for (const [i, p] of PRODUCTS.entries()) {
      const { category, isHit, ...data } = p;
      await tx.product.create({ data: { ...data, categoryId: ids.get(category), isHit: Boolean(isHit), sortOrder: i + 1 } });
    }
  });
  console.log(`✅ Menyu yangilandi: ${CATEGORIES.length} kategoriya, ${PRODUCTS.length} mahsulot`);
}

main()
  .catch((err) => {
    console.error('Seed xatosi:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
