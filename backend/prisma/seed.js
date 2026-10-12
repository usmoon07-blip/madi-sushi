// Baza bo'sh bo'lsa, boshlang'ich menyuni yozadi. Qayta ishga tushirish xavfsiz.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const img = (name) => `/static/products/${name}.svg`;

const products = [
  {
    name: 'Filadelfiya',
    category: 'Rollar',
    description: "Eng mashhur roll: yangi norvej losos, yumshoq krem-pishloq va bodring.",
    ingredients: ['Norvej losos', 'Krem-pishloq', 'Bodring', 'Guruch', 'Nori'],
    oldPrice: 99000,
    price: 89000,
    imageUrl: img('philadelphia'),
  },
  {
    name: 'Kaliforniya',
    category: 'Rollar',
    description: "Klassik Kaliforniya: qisqichbaqa, avokado va to'q sariq masago ikrasi.",
    ingredients: ['Qisqichbaqa', 'Avokado', 'Bodring', 'Masago ikrasi', 'Yapon mayonezi'],
    price: 75000,
    imageUrl: img('california'),
  },
  {
    name: 'Ajdaho (Dragon)',
    category: 'Rollar',
    description: "Avokado bilan qoplangan, ichida dudlangan ugor va unagi sousi.",
    ingredients: ['Dudlangan ugor', 'Avokado', 'Krem-pishloq', 'Bodring', 'Unagi sousi', 'Kunjut'],
    oldPrice: 110000,
    price: 95000,
    imageUrl: img('dragon'),
  },
  {
    name: 'Qora samuray',
    category: 'Rollar',
    description: "Tempura krevetka, losos va krem-pishloq. Qarsildoq va to'yimli.",
    ingredients: ['Tempura krevetka', 'Losos', 'Krem-pishloq', 'Qora kunjut', 'Nori'],
    price: 85000,
    imageUrl: img('black-samurai'),
  },
  {
    name: 'Spicy Tuna',
    category: 'Rollar',
    description: "O'tkir sousdagi tunets va bodring — achchiq yoqtiruvchilar uchun.",
    ingredients: ['Tunets', 'Spicy sous', 'Bodring', 'Guruch', 'Nori'],
    price: 79000,
    imageUrl: img('spicy-tuna'),
  },
  {
    name: 'Madi Premium set',
    category: 'Setlar',
    description: "32 dona: Filadelfiya, Kaliforniya, Ajdaho va Qora samuray. 3–4 kishilik.",
    ingredients: ['Filadelfiya — 8 dona', 'Kaliforniya — 8 dona', 'Ajdaho — 8 dona', 'Qora samuray — 8 dona', 'Imbir, vasabi, soya sousi'],
    oldPrice: 329000,
    price: 289000,
    imageUrl: img('madi-premium-set'),
  },
  {
    name: 'Filadelfiya set',
    category: 'Setlar',
    description: "24 dona Filadelfiya: klassik, kunjutli va kuydirilgan losos bilan.",
    ingredients: ['Filadelfiya klassik — 8 dona', 'Filadelfiya kunjutli — 8 dona', 'Filadelfiya flambe — 8 dona', 'Imbir, vasabi, soya sousi'],
    oldPrice: 259000,
    price: 239000,
    imageUrl: img('philadelphia-set'),
  },
  {
    name: 'Nigiri losos',
    category: 'Nigiri',
    description: '2 dona. Guruch ustida yangi losos bo‘lagi.',
    ingredients: ['Norvej losos', 'Sushi guruchi', 'Vasabi'],
    price: 39000,
    imageUrl: img('nigiri-salmon'),
  },
  {
    name: 'Nigiri ugor',
    category: 'Nigiri',
    description: '2 dona. Dudlangan ugor, unagi sousi va kunjut.',
    ingredients: ['Dudlangan ugor', 'Sushi guruchi', 'Unagi sousi', 'Kunjut'],
    price: 45000,
    imageUrl: img('nigiri-eel'),
  },
  {
    name: 'Coca-Cola 0.5',
    category: 'Ichimliklar',
    description: 'Muzdek Coca-Cola, 0.5 l.',
    ingredients: [],
    price: 12000,
    imageUrl: img('coca-cola'),
  },
  {
    name: "Yashil choy",
    category: 'Ichimliklar',
    description: 'Yapon yashil choyi, 0.4 l.',
    ingredients: [],
    price: 15000,
    imageUrl: img('green-tea'),
  },
];

async function main() {
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const count = await prisma.product.count();
  if (count > 0) {
    console.log(`Bazada allaqachon ${count} ta mahsulot bor — seed o'tkazib yuborildi.`);
    return;
  }
  await prisma.product.createMany({
    data: products.map((p, i) => ({ ...p, sortOrder: i + 1 })),
  });
  console.log(`✅ ${products.length} ta mahsulot bazaga yozildi.`);
}

main()
  .catch((err) => {
    console.error('Seed xatosi:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
