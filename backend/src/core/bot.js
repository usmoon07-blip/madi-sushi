const { Bot } = require('grammy');
const config = require('../config/default');

const bot = config.botToken ? new Bot(config.botToken) : null;

bot?.catch((err) => {
  console.error('[bot] Xato:', err.error?.message || err.message);
});

module.exports = { bot };
