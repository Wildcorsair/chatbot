var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var TelegramBot = require('node-telegram-bot-api');

var token = 'ТУТ_ВСТАВЛЯЕМ_ТОКЕН';
var bot = new TelegramBot(token, {polling: true});

var app = express();

app.set('port', process.env.PORT || 3001);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('Hello world!!!');
});

app.listen(app.get('port'), function() {
  console.log('Server was started on the port: ' + app.get('port'));
});
