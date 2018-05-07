const http     = require('http');
const apiai    = require('apiai');
const Telegraf = require('telegraf');
const Extra    = require('telegraf/extra');
const Markup   = require('telegraf/markup');
const config   = require('./config/config');
const Database = require('./app/database');
const Command  = require('./app/command');
const Reminder = require('./app/reminder');

const bot = new Telegraf(config.telegram.token);
const app = apiai(config.apiai.token);
const database = new Database();

let reminder      = new Reminder(app, database);
let commandRouter = new Command(app, reminder);

bot.start((ctx) => ctx.reply('Welcome to chat with JohnSilverBot!\nType /menu to see my actions.'));
reminder.start(config);

bot.command('menu', (ctx) => {
  let menu = "<b>Reminders Menu</b>\n/create - Create new reminder\n/listAll - Display all reminders\n/today - Display reminders for today";

  return ctx.replyWithHTML(menu, Extra.markup(
    Markup.keyboard(['/create', '/listAll', '/today'], {
      wrap: (btn, index, currentRow) => currentRow.length >= 3
    }).resize()
  ))
})

bot.hears(/(.*)/i, (ctx) => {

  if (commandRouter.action == '' && reminder.getAction() == '') {
    commandRouter.parse(ctx);
  } else if (commandRouter.action != '' && reminder.getAction() == '') {
    reminder.setAction(commandRouter.action);
    reminder.parse(ctx);
    commandRouter.action = reminder.getAction();
  } else {
    reminder.parse(ctx);
  }

});

bot.action(/(.*)/i, (ctx) => {
  reminder.actionRoute(ctx);
});

bot.startPolling();
