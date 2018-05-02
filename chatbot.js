const http     = require('http');
const apiai    = require('apiai');
const Telegraf = require('telegraf');
const Extra    = require('telegraf/extra');
const Markup   = require('telegraf/markup');
const config   = require('./config/config');
const Command  = require('./app/command');
const Reminder = require('./app/reminder');

const bot = new Telegraf(config.telegram.token);
const app = apiai(config.apiai.token);

let reminder      = new Reminder();
let commandRouter = new Command(app, reminder);

bot.start((ctx) => ctx.reply('Welcome to chat with JohnSilverBot!\nType /menu to see my actions.'));

bot.command('menu', (ctx) => {
  let menu = "<b>Reminders Menu</b>\n/create - Create new reminder\n/listAll - Display all reminders\n/today - Display reminders for today";

  return ctx.replyWithHTML(menu, Extra.markup(
    Markup.keyboard(['/create', '/listAll', '/today'], {
      wrap: (btn, index, currentRow) => currentRow.length >= 3
    }).resize()
  ))
})

bot.hears(/(.*)/i, (ctx, msg) => {

  if (commandRouter.action == '') {
    commandRouter.parse(ctx);
  } else {
    reminder.setAction(commandRouter.action);
    reminder.parse(ctx);
    commandRouter.action = '';
  }

});

bot.action(/(.*)/i, (ctx) => {
  reminder.actionRoute(ctx);
});

bot.startPolling();
