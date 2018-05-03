const https           = require('https');
const uniqid          = require('uniqid');
const Extra           = require('telegraf/extra');
const { prependZero } = require('./helpers');
const { parseDate }   = require('./helpers');

function Reminder(database) {
  this.database = database;
  this.action = '';
  // this.data = new Object;
  // this.data['414245057'] = [
  //   { id: '3lnqwz0bhjjgnloty1', date: '2018-05-14 15:45:50', text: 'Lorem ipsum set dolor', confirmed: 'false' },
  //   { id: '3lnqwz0bhjjgnlperp', date: '2018-05-01 18:40:50', text: 'Post the new information', confirmed: 'false' },
  //   { id: '3lnqwz0bhjjgnlq95t', date: '2018-05-02 09:48:50', text: 'Remind me about my Birthday', confirmed: 'false' }
  // ];
}

Reminder.prototype.setAction = function(action) {
  this.action = action;
}

Reminder.prototype.parse = function(ctx) {
  switch (this.action) {
    case 'create-date':
      this.create(ctx);
      break;
    default:
    ctx.reply('Sorry, no actions for reminder!');
  }
}

Reminder.prototype.create = function(ctx) {
  if (ctx.update.message.text !== undefined && ctx.update.message.text !== '') {
    let parts = ctx.update.message.text.split(':');
    let record = {
      id: uniqid(),
      date: parts[0],
      text: parts[1],
      confirmed: 'false'
    };
    this.save(ctx.update.message.from.id, record);
    this.action = '';
    ctx.reply('Your reminder was successfully created.');
  }
}

Reminder.prototype.delete = function(ctx) {
  // TODO: Delete reminder functionality
}

/**
 * Method saves the new reminder into the store.
 *
 * @param {int} id User identifier
 * @param {object} record Data with reminder
 */
Reminder.prototype.save = function(id, record) {
  if (id in this.data) {
    this.data[id].push(record);
  } else {
    this.data[id] = [];
    this.data[id].push(record);
  }
}

Reminder.prototype.listAll = function(ctx) {
  let now   = new Date();
  let today = parseDate(now);
  let ctime = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

  let query = 'SELECT * FROM `reminders`  '
            + 'WHERE `from_id` = ? AND `confirmed` = 0 AND `alert_date` >= ? AND `alert_time` >= ?';
  this.database.connection.query(query, [ctx.update.message.from.id, today, ctime], (err, res) => {
    this.display(ctx, res);
    if (err !== null) {
      console.log(err);
    }
  });
}

Reminder.prototype.listToday = function(ctx) {
  let now   = new Date();
  let today = parseDate(now);
  let ctime = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

  let query = 'SELECT * FROM `reminders` '
            + 'WHERE `from_id` = ? AND `confirmed` = 0 AND `alert_date` = ? AND `alert_time` >= ? ORDER BY `alert_time`';
  this.database.connection.query(query, [ctx.update.message.from.id, today, ctime], (err, res) => {
    this.display(ctx, res);
    if (err !== null) {
      console.log(err);
    }
  });
}

Reminder.prototype.display = function(ctx, reminders) {
  if (reminders.length === 0) {
    ctx.reply('Looks like I don\'t have any reminders for you.');
    return false;
  }

  for (let i = 0; i < reminders.length; i++) {
    const contextMenu = Extra
    .markdown()
    .markup((m) => m.inlineKeyboard([
      m.callbackButton('Confirm', 'confirm:' + reminders[i].id),
      m.callbackButton('Snooze', 'snooze:' + reminders[i].id)
    ]));

    let resultText = parseDate(reminders[i].alert_date) + ' ' + reminders[i].alert_time + ': ' + reminders[i].content + "\n";
    ctx.reply(resultText, contextMenu);
  }
}

Reminder.prototype.actionRoute = function(ctx) {
  let data = ctx.update.callback_query.data;
  let fromId = ctx.update.callback_query.from.id;

  if (data !== undefined) {
    let parts = data.split(':');
    // For a better understanding of the code
    let action = parts[0];
    let reminderId = parts[1];

    this[action](ctx, fromId, reminderId);
  }
}

/**
 * Method marks selected reminder as confirmed.
 *
 * @param {object} ctx Message context
 * @param {integer} fromId Telegram user identifier
 * @param {string} reminderId Reminder identifier
 */
Reminder.prototype.confirm = function(ctx, fromId, reminderId) {
  let messageId = ctx.update.callback_query.message.message_id;
  let chatId = ctx.update.callback_query.message.chat.id;

  let query = 'UPDATE `reminders` SET `confirmed` = true WHERE `id` = ?';
  this.database.connection.query(query, reminderId, (err, res) => {
    if (res.affectedRows > 0) {
      ctx.answerCbQuery('Your reminder was successfully confirmed!');
      ctx.tg.deleteMessage(chatId, messageId);
    }

    if (err !== null) {
      console.log(err);
    }
  });
}

/**
 * Method snoozes selected reminder to one day.
 *
 * @param {object} ctx Message context
 * @param {integer} fromId Telegram user identifier
 * @param {string} reminderId Reminder identifier
 */
Reminder.prototype.snooze = function(ctx, fromId, reminderId) {
  let remindersList = this.load(fromId);

  for (let i = 0; i < remindersList.length; i++) {
    if (remindersList[i].id == reminderId) {
      let incDate = this.increaseOneDay(remindersList[i].date);
      remindersList[i].date = incDate;
      ctx.answerCbQuery('Your reminder was successfully snoozed on one day!');

      const contextMenu = Extra
        .markdown()
        .markup((m) => m.inlineKeyboard([
          m.callbackButton('Confirm', 'confirm:' + remindersList[i].id),
          m.callbackButton('Snooze', 'snooze:' + remindersList[i].id)
        ]));
      let updatedText = remindersList[i].date + ': ' + remindersList[i].text;
      ctx.editMessageText(updatedText, contextMenu);
    }
  }
}

/**
 * Method increases the granted date to one day.
 *
 * @param {string} oldDate Date in string format
 */
Reminder.prototype.increaseOneDay = function(oldDate) {
  let reminderDate = new Date(oldDate);
  reminderDate.setDate(reminderDate.getDate() + 1);
  let year  = reminderDate.getFullYear();
  let month = prependZero(reminderDate.getMonth() + 1);
  let day   = prependZero(reminderDate.getDate());
  return year + "-" + month + "-" + day;
}

Reminder.prototype.start = function(config) {
  this.alertTimer = setInterval(() => {
    for (let reminders in this.data) {
      let list = this.data[reminders];

      for (let i = 0; i < list.lenght; i++) {
        console.log(list[i].text);
      }

    }
    // https.get('https://api.telegram.org/bot' + config.telegram.token + '/sendmessage?chat_id=414245057&text=Test+Message', (res) => {
    // });
  }, 3000);
}

module.exports = Reminder;
