const botController = require('../controllers/botController');

function registerBotRoutes(bot) {
  bot.command('start', botController.onStart);
  bot.command(['help', 'info'], botController.onHelp);
  bot.on('message:contact', botController.onContact);
  bot.on('message:location', botController.onLocation);
  bot.on('message', botController.onHelp);
}

module.exports = { registerBotRoutes };
