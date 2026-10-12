const { Bot } = require('grammy');
const crypto = require('crypto');
const config = require('../config/default');
const { errText } = require('../services/redact');

// TELEGRAM_API_ROOT — ixtiyoriy (o'z Bot API serveri yoki sinov uchun)
const apiRoot = (process.env.TELEGRAM_API_ROOT || '').trim();
const bot = config.botToken ? new Bot(config.botToken, apiRoot ? { client: { apiRoot } } : undefined) : null;

bot?.catch((err) => {
  console.error('[bot] Xato:', errText(err.error || err));
});

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Webhook manzili va maxfiy kaliti tokendan yasaladi — token manzilda ko'rinmaydi
const webhook = config.botToken
  ? {
      path: `/telegram/${sha256(config.botToken).slice(0, 32)}`,
      secretToken: sha256(`${config.botToken}:webhook`).slice(0, 48),
    }
  : null;

module.exports = { bot, webhook };
