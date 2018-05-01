const http     = require('http');
const apiai    = require('apiai');
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup   = require('telegraf/markup');
const config   = require('./config/config');

const bot = new Telegraf(config.telegram.token);
const app = apiai(config.apiai.token);

let flag = 'nowait';

bot.start((ctx) => ctx.reply('Welcome to chat with JohnSilverBot!'));
// bot.help((ctx) => ctx.reply('Send me a sticker'));
// bot.on('sticker', (ctx) => ctx.reply('👍'));
// bot.hears('hi', (ctx) => ctx.reply('Hey there'));
// bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy'));
// bot.hears(/setivent/i, (ctx) => {
//     ctx.reply(ctx.from.id);
// });

bot.command('menu', (ctx) => {
  return ctx.reply('You can handle your reminders by my menu.', Extra.markup(
    Markup.keyboard(['/create', '/delete', '/listall', '/today'], {
      wrap: (btn, index, currentRow) => currentRow.length >= 2
    })
  ))
})

// bot.command('pyramid', (ctx) => {
//   return ctx.reply('Keyboard wrap', Extra.markup(
//     Markup.keyboard(['create', 'delete', 'three', 'four', 'five', 'six'], {
//       wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
//     })
//   ));
// });

bot.hears(/(.*)/i, (ctx, msg) => {

  if (flag === 'wait') {
    console.log(ctx.update.message.text);
    flag = 'nowait';
  }

  if (ctx.update.message.text === '/create') {
    flag = 'wait';
    console.log(flag);
  }

  var request = app.textRequest(ctx.update.message.text, {
    sessionId: '321456789'
  });

  request.on('response', function(response) {
    ctx.reply(response.result.fulfillment.speech);
  });

  request.on('error', function(error) {
    console.log(error);
  });

  request.end();
});

bot.startPolling()
