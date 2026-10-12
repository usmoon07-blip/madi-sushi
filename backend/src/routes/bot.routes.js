const botController = require('../controllers/botController');

function registerBotRoutes(bot) {
  bot.command('start', botController.onStart);
  bot.command(['help', 'info'], botController.onHelp);
  bot.command(['lang', 'til', 'language'], botController.onLangCommand);
  bot.on('callback_query:data', botController.onCallback);
  bot.on('message:contact', botController.onContact);
  bot.on('message:location', botController.onLocation);
  bot.on(['message:photo', 'message:document'], botController.onReceipt);
  bot.on('message', botController.onHelp);
}

module.exports = { registerBotRoutes };
