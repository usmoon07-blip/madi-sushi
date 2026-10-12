const { InlineKeyboard } = require('grammy');
const config = require('../config/default');
const { bot } = require('../core/bot');
const webapp = require('../core/webapp');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { money, escapeHtml, normalizePhone } = require('../services/format');
const { yandexRouteUrl } = require('../services/maps');
const { errText } = require('../services/redact');

const menuKeyboard = () => {
  const url = webapp.getUrl();
  return url ? new InlineKeyboard().webApp('🍣 Menyuni ochish', url) : undefined;
};

async function onStart(ctx) {
  if (!ctx.from) return;
  await User.upsertFromTelegram(ctx.from);
  const name = escapeHtml(ctx.from.first_name || '');
  const keyboard = menuKeyboard();
  const text =
    `<b>Assalomu alaykum, ${name}!</b>\n\n` +
    `🍣 <b>${config.brand.name}</b> — Toshkentdagi premium sushi bar.\n` +
    `Rollar, setlar va nigirilarni bir necha bosishda buyurtma qiling.\n\n` +
    (keyboard ? '👇 Menyuni ochish uchun tugmani bosing' : '⏳ Menyu hozircha ishga tushirilmoqda, birozdan so‘ng qayta urinib ko‘ring.');
  await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
}

async function onContact(ctx) {
  const contact = ctx.message.contact;
  if (!ctx.from || contact.user_id !== ctx.from.id) return;
  const phone = normalizePhone(contact.phone_number);
  if (phone) await User.setPhoneByTelegramId(ctx.from.id, phone);
  await ctx.reply('✅ Raqamingiz saqlandi. Buyurtmani Mini App ichida davom ettiring.', {
    reply_markup: { remove_keyboard: true },
  });
}

async function onHelp(ctx) {
  const settings = await Settings.get();
  const lines = [
    `<b>${config.brand.name}</b>`,
    `📍 ${escapeHtml(settings.pickupAddress)}`,
    settings.contactPhone ? `📞 ${escapeHtml(settings.contactPhone)}` : null,
    '',
    'Buyurtma berish uchun pastdagi «🍣 Menyu» tugmasini bosing.',
  ].filter((l) => l !== null);
  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML', reply_markup: menuKeyboard() });
}

// ---------- Xabarnomalar ----------

function itemsText(items) {
  return items.map((i) => `• ${escapeHtml(i.name)} × ${i.qty} — ${money(i.price * i.qty)}`).join('\n');
}

function orderSummary(order) {
  const isDelivery = order.deliveryType === 'DELIVERY';
  const lines = [
    itemsText(order.items),
    '',
    order.deliveryFee ? `🚚 Yetkazib berish: ${money(order.deliveryFee)}` : null,
    `💰 <b>Jami: ${money(order.total)}</b>`,
    `${order.paymentType === 'CARD' ? '💳 Karta orqali' : '💵 Naqd pul'} · ${isDelivery ? '🛵 Yetkazib berish' : '🏃 Olib ketish'}`,
  ];
  return lines.filter((l) => l !== null).join('\n');
}

async function safeSend(chatId, text, extra = {}) {
  if (!bot) return;
  try {
    await bot.api.sendMessage(chatId, text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...extra });
  } catch (err) {
    console.warn(`[bot] ${chatId} ga xabar yuborilmadi:`, errText(err));
  }
}

async function notifyNewOrder(order) {
  const settings = await Settings.get();
  const isDelivery = order.deliveryType === 'DELIVERY';

  // Mijozga
  const tail = isDelivery
    ? 'Kuryerimiz tez orada bog‘lanadi 🍣'
    : `Buyurtma tayyor bo‘lganda xabar beramiz.\n📍 Olib ketish manzili: ${escapeHtml(settings.pickupAddress)}`;
  await safeSend(
    order.user.telegramId,
    `✅ <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b>\nBuyurtma raqami: <b>#${order.id}</b>\n\n${orderSummary(order)}\n\n${tail}`
  );

  // Adminlarga
  if (!config.adminIds.length) return;
  const mapUrl = isDelivery ? yandexRouteUrl(order) : null;
  const text = [
    `🆕 <b>Yangi buyurtma #${order.id}</b>`,
    '',
    `👤 ${escapeHtml(order.customerName)}${order.user.username ? ` (@${escapeHtml(order.user.username)})` : ''}`,
    `📞 ${escapeHtml(order.phone)}`,
    isDelivery ? `📍 ${escapeHtml(order.address || 'Lokatsiya bo‘yicha')}` : '🏃 Mijoz o‘zi olib ketadi',
    order.addressNote ? `🏠 ${escapeHtml(order.addressNote)}` : null,
    order.comment ? `💬 ${escapeHtml(order.comment)}` : null,
    '',
    orderSummary(order),
  ]
    .filter((l) => l !== null)
    .join('\n');
  const keyboard = mapUrl ? new InlineKeyboard().url('🗺 Yandex Maps’da ochish', mapUrl) : undefined;

  for (const adminId of config.adminIds) {
    await safeSend(adminId, text, { reply_markup: keyboard });
    if (isDelivery && Number.isFinite(order.lat) && Number.isFinite(order.lon)) {
      try {
        await bot.api.sendLocation(adminId, order.lat, order.lon);
      } catch (err) {
        console.warn('[bot] Lokatsiya yuborilmadi:', errText(err));
      }
    }
  }
}

async function notifyStatus(order) {
  const settings = await Settings.get();
  const isDelivery = order.deliveryType === 'DELIVERY';
  const messages = {
    ACCEPTED: `👨‍🍳 Buyurtmangiz <b>#${order.id}</b> tayyorlanmoqda.`,
    ON_WAY: isDelivery
      ? `🛵 Buyurtmangiz <b>#${order.id}</b> yo‘lda! Kuryer tez orada yetib boradi.`
      : `✅ Buyurtmangiz <b>#${order.id}</b> tayyor!\n📍 ${escapeHtml(settings.pickupAddress)} manzilidan olib ketishingiz mumkin.`,
    DONE: `🙏 Buyurtma <b>#${order.id}</b> yakunlandi. Yoqimli ishtaha!\n${config.brand.name}ni tanlaganingiz uchun rahmat.`,
    CANCELLED: `❌ Buyurtmangiz <b>#${order.id}</b> bekor qilindi.${settings.contactPhone ? `\nSavollar bo‘lsa: ${escapeHtml(settings.contactPhone)}` : ''}`,
  };
  const text = messages[order.status];
  if (text) await safeSend(order.user.telegramId, text, { reply_markup: order.status === 'DONE' ? menuKeyboard() : undefined });
}

module.exports = { onStart, onContact, onHelp, notifyNewOrder, notifyStatus };
