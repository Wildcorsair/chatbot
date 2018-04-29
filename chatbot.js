const http = require('http');
const config = require('./config/config');
const Telegraf = require('telegraf');

const bot = new Telegraf(config.token);

bot.start((ctx) => ctx.reply('Welcome!'));
// bot.help((ctx) => ctx.reply('Send me a sticker'));
// bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy'));
bot.hears(/setivent/i, (ctx) => {
    ctx.reply(ctx.from.id);
});

bot.hears(/request/i, (ctx) => {
    console.log('fuck');
    const options = {
        host: 'https://api.dialogflow.com/v1/query?v=20150910&contexts=shop&lang=en&query=apple&sessionId=12345&timezone=America/New_York',
        port: 80,
        path: '/',
        headers: {
            'Authorization': 'Bearer bab92c34ca564b8abe278ad8fbfaa511'
        },
        method: 'GET'
    };

    let req = http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          console.log('BODY: ' + chunk);
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.end();
});

bot.startPolling()
