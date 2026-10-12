// O'zbek / rus tillaridagi matnlar (mijozga boradigan xabarlar va xatoliklar)
const LANGS = ['uz', 'ru'];

const dict = {
  uz: {
    // Xatoliklar
    errOpenInTelegram: 'Ilovani Telegram bot orqali oching',
    errPhone: "Telefon raqami noto'g'ri. Masalan: +998 90 123 45 67",
    errLocation: "Lokatsiya noto'g'ri",
    errClosed: "Hozir buyurtmalar qabul qilinmayapti. Keyinroq urinib ko'ring",
    errCartEmpty: "Savat bo'sh",
    errCartTooBig: "Savatda mahsulotlar juda ko'p",
    errUnavailable: "Savatdagi ba'zi mahsulotlar hozir mavjud emas. Savatni yangilang",
    errMenuChanged: 'Menyu yangilandi. Savatni tekshirib, qayta tasdiqlang',
    errMinOrder: (sum) => `Minimal buyurtma summasi: ${sum}`,
    errAddress: 'Yetkazib berish manzilini kiriting yoki lokatsiyani yuboring',
    errReview: "Baho 1 dan 5 gacha bo'lishi kerak",
    errNotFound: 'Topilmadi',

    // Bot
    chooseLang: 'Tilni tanlang:',
    langSaved: "✅ Til o'zgartirildi: O'zbekcha",
    welcome: (name, brand) =>
      `<b>Assalomu alaykum, ${name}!</b>\n\n🍣 <b>${brand}</b> — Toshkentdagi premium sushi bar.\n` +
      'Rollar, setlar va sushilarni bir necha bosishda buyurtma qiling.',
    openMenuHint: '👇 Menyuni ochish uchun tugmani bosing',
    menuNotReady: "⏳ Menyu hozircha ishga tushirilmoqda, birozdan so'ng qayta urinib ko'ring.",
    openMenuBtn: '🍣 Menyuni ochish',
    menuButton: '🍣 Menyu',
    phoneSaved: '✅ Raqamingiz saqlandi. Buyurtmani Mini App ichida davom ettiring.',
    helpTail: 'Buyurtma berish uchun pastdagi «🍣 Menyu» tugmasini bosing.',
    orderAccepted: (id) => `✅ <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b>\nBuyurtma raqami: <b>#${id}</b>`,
    courierSoon: "Kuryerimiz tez orada bog'lanadi 🍣",
    pickupSoon: (addr) => `Buyurtma tayyor bo'lganda xabar beramiz.\n📍 Olib ketish manzili: ${addr}`,
    deliveryLine: (fee) => `🚚 Yetkazib berish: ${fee}`,
    totalLine: (sum) => `💰 <b>Jami: ${sum}</b>`,
    payCard: '💳 Karta orqali',
    payCash: '💵 Naqd pul',
    typeDelivery: '🛵 Yetkazib berish',
    typePickup: '🏃 Olib ketish',
    askLocation: '📍 Kuryer manzilingizni aniq topishi uchun <b>lokatsiyangizni yuboring</b> — pastdagi tugmani bosing.',
    sendLocationBtn: '📍 Lokatsiyani yuborish',
    askReceipt: (sum, cards) =>
      `💳 <b>Karta orqali to'lov</b>\n\nIltimos, ${sum} ni quyidagi kartaga o'tkazing:\n${cards}\n\n📸 To'lovni amalga oshirgach, <b>to'lov chekini shu chatga jo'nating</b> — buyurtmangiz darhol tasdiqlanadi.\n\nRahmat! 🙏`,
    askReceiptNoCard: (sum) =>
      `💳 <b>Karta orqali to'lov</b> — ${sum}\n\n📸 To'lovni amalga oshirgach, <b>to'lov chekini shu chatga jo'nating</b> — buyurtmangiz darhol tasdiqlanadi.\n\nRahmat! 🙏`,
    receiptReceived: (id) => `✅ Rahmat, chekingiz qabul qilindi!\nBuyurtma <b>#${id}</b> tez orada tasdiqlanadi va tayyorlashni boshlaymiz 🍣`,
    receiptNoOrder: "🧾 Rahmat! Afsuski, bu chekni biriktirish uchun karta orqali to'lanadigan faol buyurtma topa olmadik. Savollaringiz bo'lsa, biz bilan bog'laning — albatta yordam beramiz.",
    locationNoOrder: '📍 Lokatsiya qabul qilindi. Buyurtma berish uchun «🍣 Menyu» tugmasini bosing.',
    locationAttached: (id) => `✅ Rahmat! Lokatsiya buyurtma #${id} ga biriktirildi.`,
    stAccepted: (id) => `👨‍🍳 Buyurtmangiz <b>#${id}</b> tayyorlanmoqda.`,
    stOnWayDelivery: (id) => `🛵 Buyurtmangiz <b>#${id}</b> yo'lda! Kuryer tez orada yetib boradi.`,
    stOnWayPickup: (id, addr) => `✅ Buyurtmangiz <b>#${id}</b> tayyor!\n📍 ${addr} manzilidan olib ketishingiz mumkin.`,
    stDone: (id, brand) => `🙏 Buyurtma <b>#${id}</b> yakunlandi. Yoqimli ishtaha!\n${brand}ni tanlaganingiz uchun rahmat.`,
    stCancelled: (id) => `❌ Buyurtmangiz <b>#${id}</b> bekor qilindi.`,
    questions: (phone) => `Savollar bo'lsa: ${phone}`,
    reviewThanks: '🙏 Fikringiz uchun rahmat!',
    commandStart: 'Menyuni ochish',
    commandInfo: 'Manzil va aloqa',
    commandLang: 'Tilni o‘zgartirish',
  },
  ru: {
    errOpenInTelegram: 'Откройте приложение через Telegram-бота',
    errPhone: 'Неверный номер телефона. Например: +998 90 123 45 67',
    errLocation: 'Неверная геолокация',
    errClosed: 'Сейчас заказы не принимаются. Попробуйте позже',
    errCartEmpty: 'Корзина пуста',
    errCartTooBig: 'Слишком много товаров в корзине',
    errUnavailable: 'Некоторые товары сейчас недоступны. Обновите корзину',
    errMenuChanged: 'Меню обновилось. Проверьте корзину и подтвердите заказ снова',
    errMinOrder: (sum) => `Минимальная сумма заказа: ${sum}`,
    errAddress: 'Укажите адрес доставки или отправьте геолокацию',
    errReview: 'Оценка должна быть от 1 до 5',
    errNotFound: 'Не найдено',

    chooseLang: 'Выберите язык:',
    langSaved: '✅ Язык изменён: Русский',
    welcome: (name, brand) =>
      `<b>Здравствуйте, ${name}!</b>\n\n🍣 <b>${brand}</b> — премиальный суши-бар в Ташкенте.\n` +
      'Заказывайте роллы, сеты и суши в пару касаний.',
    openMenuHint: '👇 Нажмите кнопку, чтобы открыть меню',
    menuNotReady: '⏳ Меню запускается, попробуйте чуть позже.',
    openMenuBtn: '🍣 Открыть меню',
    menuButton: '🍣 Меню',
    phoneSaved: '✅ Номер сохранён. Продолжите оформление заказа в приложении.',
    helpTail: 'Чтобы сделать заказ, нажмите кнопку «🍣 Меню» внизу.',
    orderAccepted: (id) => `✅ <b>Ваш заказ успешно принят!</b>\nНомер заказа: <b>#${id}</b>`,
    courierSoon: 'Наш курьер скоро свяжется с вами 🍣',
    pickupSoon: (addr) => `Сообщим, когда заказ будет готов.\n📍 Адрес самовывоза: ${addr}`,
    deliveryLine: (fee) => `🚚 Доставка: ${fee}`,
    totalLine: (sum) => `💰 <b>Итого: ${sum}</b>`,
    payCard: '💳 Картой',
    payCash: '💵 Наличными',
    typeDelivery: '🛵 Доставка',
    typePickup: '🏃 Самовывоз',
    askLocation: '📍 Чтобы курьер точно нашёл вас, <b>отправьте геолокацию</b> — нажмите кнопку ниже.',
    sendLocationBtn: '📍 Отправить геолокацию',
    askReceipt: (sum, cards) =>
      `💳 <b>Оплата картой</b>\n\nПожалуйста, переведите ${sum} на карту:\n${cards}\n\n📸 После оплаты, пожалуйста, <b>отправьте чек в этот чат</b> — и мы сразу подтвердим ваш заказ.\n\nСпасибо! 🙏`,
    askReceiptNoCard: (sum) =>
      `💳 <b>Оплата картой</b> — ${sum}\n\n📸 После оплаты, пожалуйста, <b>отправьте чек в этот чат</b> — и мы сразу подтвердим ваш заказ.\n\nСпасибо! 🙏`,
    receiptReceived: (id) => `✅ Спасибо, чек получен!\nЗаказ <b>#${id}</b> скоро будет подтверждён, и мы начнём его готовить 🍣`,
    receiptNoOrder: '🧾 Спасибо! К сожалению, мы не нашли активный заказ с оплатой картой для этого чека. Если есть вопросы — свяжитесь с нами, мы обязательно поможем.',
    locationNoOrder: '📍 Геолокация получена. Чтобы сделать заказ, нажмите «🍣 Меню».',
    locationAttached: (id) => `✅ Спасибо! Геолокация добавлена к заказу #${id}.`,
    stAccepted: (id) => `👨‍🍳 Ваш заказ <b>#${id}</b> готовится.`,
    stOnWayDelivery: (id) => `🛵 Ваш заказ <b>#${id}</b> в пути! Курьер скоро будет у вас.`,
    stOnWayPickup: (id, addr) => `✅ Ваш заказ <b>#${id}</b> готов!\n📍 Заберите его по адресу: ${addr}.`,
    stDone: (id, brand) => `🙏 Заказ <b>#${id}</b> завершён. Приятного аппетита!\nСпасибо, что выбрали ${brand}.`,
    stCancelled: (id) => `❌ Ваш заказ <b>#${id}</b> отменён.`,
    questions: (phone) => `Если есть вопросы: ${phone}`,
    reviewThanks: '🙏 Спасибо за отзыв!',
    commandStart: 'Открыть меню',
    commandInfo: 'Адрес и контакты',
    commandLang: 'Сменить язык',
  },
};

const normLang = (lang) => (LANGS.includes(lang) ? lang : 'uz');

// Telegram tilidan taxmin: rus/ukrain/qozoq va h.k. — ruscha, qolganlari — o'zbekcha
const guessLang = (code) => (/^(ru|uk|be|kk|ky|tg)/.test(String(code || '')) ? 'ru' : 'uz');

function t(lang, key, ...args) {
  const value = dict[normLang(lang)][key] ?? dict.uz[key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
}

module.exports = { LANGS, t, normLang, guessLang };
