const { InlineKeyboard } = require('grammy');
const config = require('../config/default');
const { bot } = require('../core/bot');
const webapp = require('../core/webapp');
const User = require('../models/User');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { money, escapeHtml, normalizePhone } = require('../services/format');
const { yandexRouteUrl, yandexGoUrl } = require('../services/maps');
const { reverseGeocode } = require('../services/geocode');
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

const isAdmin = (id) => config.adminIds.includes(String(id));
const coordsLabel = (lat, lon) => `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

// Lokatsiya keldi: admin bo'lsa — filial nuqtasini saqlashni taklif qilamiz; mijoz bo'lsa — buyurtmaga biriktiramiz
async function onLocation(ctx) {
  if (!ctx.from) return;
  const { latitude: lat, longitude: lon } = ctx.message.location;
  const user = await User.upsertFromTelegram(ctx.from);
  const order = await Order.findAwaitingLocation(user.id);

  if (isAdmin(ctx.from.id)) {
    const kb = new InlineKeyboard().text('🏠 Filial lokatsiyasi qilib saqlash', `shop:${lat.toFixed(6)},${lon.toFixed(6)}`);
    if (order) kb.row().text(`📦 Buyurtma #${order.id} ga biriktirish`, `loc:${order.id}:${lat.toFixed(6)},${lon.toFixed(6)}`);
    await ctx.reply(`📍 ${coordsLabel(lat, lon)}\nBu lokatsiyani nima qilay?`, { reply_markup: kb });
    return;
  }

  if (!order) {
    await ctx.reply('📍 Lokatsiya qabul qilindi. Buyurtma berish uchun «🍣 Menyu» tugmasini bosing.', {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }
  await attachLocation(ctx, order, user, lat, lon);
}

async function attachLocation(ctx, order, user, lat, lon) {
  const data = { lat, lon };
  if (!order.address) data.address = (await reverseGeocode(lat, lon)).address;
  const updated = await Order.setLocation(order.id, data);
  await User.update(user.id, { lastLat: lat, lastLon: lon }).catch(() => {});
  await ctx.reply(`✅ Rahmat! Lokatsiya buyurtma #${order.id} ga biriktirildi.`, { reply_markup: { remove_keyboard: true } });
  const settings = await Settings.get();
  await notifyAdmins(updated, settings, { title: `📍 <b>Buyurtma #${order.id}: lokatsiya biriktirildi</b>` });
}

// Admin tugmani bosdi
async function onCallback(ctx) {
  const data = ctx.callbackQuery.data || '';
  if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();

  const shop = data.match(/^shop:(-?\d+\.\d+),(-?\d+\.\d+)$/);
  if (shop) {
    const [lat, lon] = [Number(shop[1]), Number(shop[2])];
    await Settings.update({ shopLat: lat, shopLon: lon });
    await ctx.answerCallbackQuery({ text: 'Saqlandi ✅' });
    await ctx.editMessageText(
      `✅ <b>Filial lokatsiyasi saqlandi</b>\n📍 ${coordsLabel(lat, lon)}\n\nEndi Yandex Go'da «Qayerdan» maydoniga shu nuqta qo'yiladi.`,
      {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard().url('🗺 Xaritada tekshirish', `https://yandex.uz/maps/?pt=${lon},${lat}&z=18`),
      }
    );
    return undefined;
  }

  const loc = data.match(/^loc:(\d+):(-?\d+\.\d+),(-?\d+\.\d+)$/);
  if (loc) {
    const user = await User.upsertFromTelegram(ctx.from);
    const order = await Order.findAwaitingLocation(user.id);
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => {});
    if (order && order.id === Number(loc[1])) await attachLocation(ctx, order, user, Number(loc[2]), Number(loc[3]));
    return undefined;
  }
  return ctx.answerCallbackQuery();
}

// Admin uchun: /filial — filial lokatsiyasini o'rnatish yo'riqnomasi
async function onShopCommand(ctx) {
  if (!ctx.from || !isAdmin(ctx.from.id)) return onHelp(ctx);
  const settings = await Settings.get();
  const current =
    settings.shopLat != null ? `Hozirgi nuqta: ${coordsLabel(settings.shopLat, settings.shopLon)}` : 'Hozircha filial nuqtasi saqlanmagan.';
  return ctx.reply(
    `🏠 <b>Filial lokatsiyasi</b>\n${current}\n\nRestoranda turib pastdagi tugmani bosing — lokatsiyangiz yuboriladi, keyin «Filial lokatsiyasi qilib saqlash» ni tanlang.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [[{ text: '📍 Restoran lokatsiyasini yuborish', request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
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

  // Lokatsiya yuborilmagan bo'lsa — mijozdan so'raymiz (kuryer aniq topishi uchun)
  if (isDelivery && !hasCoords(order)) await askLocation(order);

  await notifyAdmins(order, settings);
}

const hasCoords = (o) => Number.isFinite(o.lat) && Number.isFinite(o.lon);

async function askLocation(order) {
  await safeSend(
    order.user.telegramId,
    `📍 Kuryer manzilingizni aniq topishi uchun <b>lokatsiyangizni yuboring</b> — pastdagi tugmani bosing.`,
    {
      reply_markup: {
        keyboard: [[{ text: '📍 Lokatsiyani yuborish', request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
}

function adminKeyboard(order, settings) {
  if (order.deliveryType !== 'DELIVERY') return undefined;
  const goUrl = yandexGoUrl(order, settings);
  const mapUrl = yandexRouteUrl(order);
  if (!goUrl && !mapUrl) return undefined;
  const kb = new InlineKeyboard();
  if (goUrl) kb.url('🚕 Yandex Go — dostavka', goUrl).row();
  if (mapUrl) kb.url('🗺 Yandex Maps', mapUrl);
  return kb;
}

async function notifyAdmins(order, settings, { title } = {}) {
  if (!config.adminIds.length) return;
  const isDelivery = order.deliveryType === 'DELIVERY';
  const text = [
    title || `🆕 <b>Yangi buyurtma #${order.id}</b>`,
    '',
    `👤 ${escapeHtml(order.customerName)}${order.user.username ? ` (@${escapeHtml(order.user.username)})` : ''}`,
    `📞 ${escapeHtml(order.phone)}`,
    isDelivery ? `📍 ${escapeHtml(order.address || 'Lokatsiya bo‘yicha')}` : '🏃 Mijoz o‘zi olib ketadi',
    isDelivery && !hasCoords(order) ? '⚠️ <b>Lokatsiya yo‘q</b> — mijozdan so‘raldi, kelsa alohida xabar beriladi' : null,
    order.addressNote ? `🏠 ${escapeHtml(order.addressNote)}` : null,
    order.comment ? `💬 ${escapeHtml(order.comment)}` : null,
    '',
    orderSummary(order),
  ]
    .filter((l) => l !== null)
    .join('\n');
  const keyboard = adminKeyboard(order, settings);

  for (const adminId of config.adminIds) {
    await safeSend(adminId, text, { reply_markup: keyboard });
    if (isDelivery && hasCoords(order)) {
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

module.exports = { onStart, onContact, onLocation, onCallback, onShopCommand, onHelp, notifyNewOrder, notifyStatus };
