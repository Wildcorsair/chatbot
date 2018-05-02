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
  this.action = 'create';
  this.request(ctx);
};

Command.prototype.delete = function(ctx) {
  this.action = 'delete';
  this.request(ctx);
};

Command.prototype.listAll = function(ctx) {
  let isExist = false;
  let reminders = this.reminder.load(ctx.update.message.from.id);

  for (let i = 0; i < reminders.length; i++) {
    const contextMenu = Extra
      .markdown()
      .markup((m) => m.inlineKeyboard([
        m.callbackButton('Confirm', 'confirm:' + reminders[i].id),
        m.callbackButton('Snooze', 'snooze:' + reminders[i].id)
      ]));

    if (reminders[i].confirmed == 'false') {
      let resultText = reminders[i].date + ': ' + reminders[i].text + "\n";
      ctx.reply(resultText, contextMenu);
      isExist = true;
    }
  }

  if (!isExist) {
    ctx.reply('Looks like I don\'t have any reminders for you.');
  }

};

Command.prototype.today = function(ctx) {
  let today = new Date();
  let isExist = false;
  let reminders = this.reminder.load(ctx.update.message.from.id);

  today = today.getFullYear() + '-' + prependZero(today.getMonth() + 1) + '-' + prependZero(today.getDate());

  for (let i = 0; i < reminders.length; i++) {
      const contextMenu = Extra
          .markdown()
          .markup((m) => m.inlineKeyboard([
            m.callbackButton('Confirm', 'confirm:' + reminders[i].id),
            m.callbackButton('Snooze', 'snooze:' + reminders[i].id)
          ]));

      if (reminders[i].date == today && reminders[i].confirmed == 'false') {
        let resultText = reminders[i].date + ': ' + reminders[i].text + "\n";
        ctx.reply(resultText, contextMenu);
        isExist = true;
      }
  }

  if (!isExist) {
    ctx.reply('You don\'t have any reminders for today.');
  }
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
