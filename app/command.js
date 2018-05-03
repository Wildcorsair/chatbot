const uniqid = require('uniqid');
const Extra  = require('telegraf/extra');
const { prependZero } = require('./helpers');

function Command(dialogflow, reminder) {
  this.dialogflow = dialogflow;
  this.reminder = reminder;
  this.action = '';
};

Command.prototype.parse = function(ctx) {
  let command = ctx.update.message.text;
  switch (command) {
    case '/create':
      console.log('Recived command:', command);
      this.create(ctx);
      break;
    case '/listAll':
      this.listAll(ctx);
      console.log('Recived command:', command);
      break;
    case '/today':
      this.today(ctx);
      console.log('Recived command:', command);
      break;
    default:
      this.request(ctx);
  }
};

Command.prototype.create = function(ctx) {
  this.action = 'create-date';
  this.request(ctx);
};

Command.prototype.delete = function(ctx) {
  this.action = 'delete';
  this.request(ctx);
};

Command.prototype.listAll = function(ctx) {
  this.reminder.listAll(ctx);
};

Command.prototype.today = function(ctx) {
  this.reminder.listToday(ctx);
};

Command.prototype.request = function(ctx) {
  var request = this.dialogflow.textRequest(ctx.update.message.text, {
    sessionId: uniqid()
  });

  request.on('response', function(response) {
    ctx.reply(response.result.fulfillment.speech);
  });

  request.on('error', function(error) {
    console.log(error);
  });

  request.end();
};

module.exports = Command;
