const path = require('path');
const { InlineKeyboard, InputFile } = require('grammy');
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
const { t, normLang } = require('../services/i18n');

const brand = config.brand.name;
const langOf = (user) => normLang(user?.lang);

const menuKeyboard = (lang) => {
  const url = webapp.getUrl();
  return url ? new InlineKeyboard().webApp(t(lang, 'openMenuBtn'), url) : undefined;
};

const langKeyboard = () => new InlineKeyboard().text("🇺🇿 O'zbekcha", 'lang:uz').text('🇷🇺 Русский', 'lang:ru');

const WELCOME_PHOTO = path.join(config.paths.public, 'brand/welcome.jpg');
let welcomePhotoId = null;

async function sendWelcome(ctx, lang) {
  const keyboard = menuKeyboard(lang);
  const text = `${t(lang, 'welcome', escapeHtml(ctx.from.first_name || ''), brand)}\n\n${t(lang, keyboard ? 'openMenuHint' : 'menuNotReady')}`;
  try {
    // Brend logotipi bilan rasm; bir marta yuklangach Telegram file_id qayta ishlatiladi
    const msg = await ctx.replyWithPhoto(welcomePhotoId || new InputFile(WELCOME_PHOTO), {
      caption: text,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    welcomePhotoId = msg.photo?.at(-1)?.file_id || welcomePhotoId;
  } catch {
    welcomePhotoId = null;
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }
}

// /start: til tanlanmagan bo'lsa — avval til so'raladi
async function onStart(ctx) {
  if (!ctx.from) return;
  const user = await User.upsertFromTelegram(ctx.from);
  if (!user.lang) {
    await ctx.reply(`🇺🇿 Tilni tanlang\n🇷🇺 Выберите язык`, { reply_markup: langKeyboard() });
    return;
  }
  await sendWelcome(ctx, langOf(user));
}

async function onLangCommand(ctx) {
  if (!ctx.from) return;
  const user = await User.upsertFromTelegram(ctx.from);
  await ctx.reply(t(langOf(user), 'chooseLang'), { reply_markup: langKeyboard() });
}

async function onCallback(ctx) {
  const data = ctx.callbackQuery.data || '';
  const m = data.match(/^lang:(uz|ru)$/);
  if (!m || !ctx.from) return ctx.answerCallbackQuery();
  const lang = m[1];
  const user = await User.upsertFromTelegram(ctx.from);
  await User.update(user.id, { lang });
  await ctx.answerCallbackQuery({ text: t(lang, 'langSaved') });
  await ctx.editMessageText(t(lang, 'langSaved')).catch(() => {});
  return sendWelcome(ctx, lang);
}

async function onContact(ctx) {
  const contact = ctx.message.contact;
  if (!ctx.from || contact.user_id !== ctx.from.id) return;
  const phone = normalizePhone(contact.phone_number);
  const user = await User.upsertFromTelegram(ctx.from);
  if (phone) await User.setPhoneByTelegramId(ctx.from.id, phone);
  await ctx.reply(t(langOf(user), 'phoneSaved'), { reply_markup: { remove_keyboard: true } });
}

// Mijoz botga lokatsiya yubordi — lokatsiyasiz buyurtmasiga biriktiramiz
async function onLocation(ctx) {
  if (!ctx.from) return;
  const { latitude: lat, longitude: lon } = ctx.message.location;
  const user = await User.upsertFromTelegram(ctx.from);
  const lang = langOf(user);
  const order = await Order.findAwaitingLocation(user.id);
  if (!order) {
    await User.update(user.id, { lastLat: lat, lastLon: lon }).catch(() => {});
    await ctx.reply(t(lang, 'locationNoOrder'), { reply_markup: { remove_keyboard: true } });
    return;
  }
  const data = { lat, lon };
  if (!order.address) data.address = (await reverseGeocode(lat, lon)).address;
  const updated = await Order.setLocation(order.id, data);
  await User.update(user.id, { lastLat: lat, lastLon: lon }).catch(() => {});
  await ctx.reply(t(lang, 'locationAttached', order.id), { reply_markup: { remove_keyboard: true } });
  const settings = await Settings.get();
  await notifyAdmins(updated, settings, { title: `📍 <b>Buyurtma #${order.id}: lokatsiya biriktirildi</b>` });
}

async function onHelp(ctx) {
  if (!ctx.from) return;
  const user = await User.upsertFromTelegram(ctx.from);
  const lang = langOf(user);
  const settings = await Settings.get();
  const lines = [
    `<b>${brand}</b>`,
    `📍 ${escapeHtml(settings.pickupAddress)}`,
    settings.workHours ? `🕒 ${escapeHtml(settings.workHours)}` : null,
    settings.contactPhone ? `📞 ${escapeHtml(settings.contactPhone)}` : null,
    '',
    t(lang, 'helpTail'),
  ].filter((l) => l !== null);
  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML', reply_markup: menuKeyboard(lang) });
}

// ---------- Xabarnomalar ----------

const itemName = (item, lang) => (lang === 'ru' && item.nameRu ? item.nameRu : item.name);

function orderSummary(order, lang) {
  const isDelivery = order.deliveryType === 'DELIVERY';
  const lines = [
    order.items.map((i) => `• ${escapeHtml(itemName(i, lang))} × ${i.qty} — ${money(i.price * i.qty)}`).join('\n'),
    '',
    order.deliveryFee ? t(lang, 'deliveryLine', money(order.deliveryFee)) : null,
    t(lang, 'totalLine', money(order.total)),
    `${t(lang, order.paymentType === 'CARD' ? 'payCard' : 'payCash')} · ${t(lang, isDelivery ? 'typeDelivery' : 'typePickup')}`,
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

const hasCoords = (o) => Number.isFinite(o.lat) && Number.isFinite(o.lon);

async function notifyNewOrder(order) {
  const settings = await Settings.get();
  const lang = langOf(order.user);
  const isDelivery = order.deliveryType === 'DELIVERY';

  // Mijozga — o'z tilida
  const tail = isDelivery ? t(lang, 'courierSoon') : t(lang, 'pickupSoon', escapeHtml(settings.pickupAddress));
  await safeSend(order.user.telegramId, `${t(lang, 'orderAccepted', order.id)}\n\n${orderSummary(order, lang)}\n\n${tail}`);

  // Lokatsiya yuborilmagan bo'lsa — mijozdan so'raymiz (kuryer aniq topishi uchun)
  if (isDelivery && !hasCoords(order)) {
    await safeSend(order.user.telegramId, t(lang, 'askLocation'), {
      reply_markup: {
        keyboard: [[{ text: t(lang, 'sendLocationBtn'), request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  await notifyAdmins(order, settings);
}

function adminKeyboard(order) {
  if (order.deliveryType !== 'DELIVERY') return undefined;
  const goUrl = yandexGoUrl(order);
  const mapUrl = yandexRouteUrl(order);
  if (!goUrl && !mapUrl) return undefined;
  const kb = new InlineKeyboard();
  if (goUrl) kb.url('🚕 Yandex Go — dostavka', goUrl).row();
  if (mapUrl) kb.url('🗺 Yandex Maps', mapUrl);
  return kb;
}

// Adminga — doim o'zbekcha
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
    orderSummary(order, 'uz'),
  ]
    .filter((l) => l !== null)
    .join('\n');
  const keyboard = adminKeyboard(order);

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
  const lang = langOf(order.user);
  const isDelivery = order.deliveryType === 'DELIVERY';
  const addr = escapeHtml(settings.pickupAddress);
  const messages = {
    ACCEPTED: t(lang, 'stAccepted', order.id),
    ON_WAY: isDelivery ? t(lang, 'stOnWayDelivery', order.id) : t(lang, 'stOnWayPickup', order.id, addr),
    DONE: t(lang, 'stDone', order.id, brand),
    CANCELLED:
      t(lang, 'stCancelled', order.id) + (settings.contactPhone ? `\n${t(lang, 'questions', escapeHtml(settings.contactPhone))}` : ''),
  };
  const text = messages[order.status];
  if (text) await safeSend(order.user.telegramId, text, { reply_markup: order.status === 'DONE' ? menuKeyboard(lang) : undefined });
}

async function notifyReview(review) {
  const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const u = review.user;
  const text = [
    `📝 <b>Yangi otziv</b> ${stars}`,
    `👤 ${escapeHtml(u.firstName)}${u.username ? ` (@${escapeHtml(u.username)})` : ''}${u.phone ? ` · ${escapeHtml(u.phone)}` : ''}`,
    review.text ? `\n${escapeHtml(review.text)}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');
  for (const adminId of config.adminIds) await safeSend(adminId, text);
}

module.exports = {
  onStart,
  onLangCommand,
  onCallback,
  onContact,
  onLocation,
  onHelp,
  notifyNewOrder,
  notifyStatus,
  notifyReview,
};
