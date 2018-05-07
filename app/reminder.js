const https            = require('https');
const uniqid           = require('uniqid');
const Extra            = require('telegraf/extra');
const { prependZero, parseDate, validateDate, validateTime }  = require('./helpers');

function Reminder(dialogflow, database) {
  this.dialogflow = dialogflow;
  this.database = database;
  this.action = '';
  this.record = {
    id: '',
    from_id: '',
    date: '',
    time: '',
    text: ''
  };
}

Reminder.prototype.setAction = function(action) {
  this.action = action;
}

Reminder.prototype.getAction = function() {
  return this.action;
}

Reminder.prototype.clearAction = function() {
  this.action = '';
}

Reminder.prototype.parse = function(ctx) {
  switch (this.action) {
    case 'create-date':
      this.createDate(ctx);
      break;
    case 'create-time':
      this.createTime(ctx);
      break;
    case 'create-text':
      this.createText(ctx);
      break;
    case 'update-date':
      this.updateDate(ctx);
      break;
    case 'update-time':
      this.updateTime(ctx);
      break;
    case 'cancel':
      this.cancel(ctx);
      break;
    default:
    ctx.reply('Sorry, no actions for reminder!');
  }
}

Reminder.prototype.createDate = function(ctx) {
  if (ctx.update.message.text !== undefined && ctx.update.message.text !== '') {
    this.record.from_id = ctx.update.message.from.id;
    if (validateDate(ctx.update.message.text)) {
      this.record.date = ctx.update.message.text;
      this.setAction('create-time');
      ctx.reply('Please, enter time in format: hh:mm');
    } else {
      ctx.reply('Invalid date value, please type again.');
    }
  }
}

Reminder.prototype.createTime = function(ctx) {
  if (ctx.update.message.text !== undefined && ctx.update.message.text !== '') {
    if (validateTime(ctx.update.message.text)) {
      this.record.time = ctx.update.message.text;
      this.setAction('create-text');
      this.request(ctx, 'create-text');
    } else {
      this.request(ctx, 'invalid-time');
    }
  }
}

Reminder.prototype.createText = function(ctx) {
  if (ctx.update.message.text !== undefined && ctx.update.message.text !== '') {
    this.record.text = ctx.update.message.text;
    this.clearAction();
    this.save(ctx);
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
Reminder.prototype.save = function(ctx) {
  let sql = 'INSERT INTO `reminders` ('
          + '`from_id`, `alert_date`, `alert_time`, `content`'
          + ') VALUES (?, ?, ?, ?)';
  this.database.connection.query(
    sql, [
      this.record.from_id,
      this.record.date,
      this.record.time,
      this.record.text
    ], (err, res) => {
      if (res.affectedRows > 0) {
        ctx.reply('Your reminder was successfully saved!');
      }

      if (err !== null) {
        console.log(err);
      }
    }
  );
}

Reminder.prototype.listAll = function(ctx) {
  let now   = new Date();
  let today = parseDate(now);
  let ctime = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

  let query = 'SELECT * FROM `reminders`  '
            + 'WHERE `from_id` = ? AND `confirmed` = 0 '
            + 'AND `alert_date` >= ? '
            + 'ORDER BY `alert_date`, `alert_time`';
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
  this.record.id = reminderId;
  this.record.from_id = fromId;
  this.setAction('update-date');
  ctx.reply('Please, type new date in format: yyyy-mm-dd');
}

Reminder.prototype.updateDate = function(ctx) {
  if (ctx.update.message.text !== undefined && ctx.update.message.text !== '') {
    if (validateDate(ctx.update.message.text)) {
      this.record.date = ctx.update.message.text;
      this.setAction('update-time');
      ctx.reply('Please, type new time in format: hh:mm');
    } else {
      ctx.reply('Invalid date value, please try again.');
    }
  }

}

Reminder.prototype.updateTime = function(ctx) {
  if (ctx.update.message.text !== undefined && ctx.update.message.text !== '') {
    if (validateTime(ctx.update.message.text)) {
      this.record.time = ctx.update.message.text;
      this.clearAction();
      this.update(ctx);
    } else {
      this.request(ctx, 'invalid-time');
    }
  }
}

/**
 * Method updates the reminder date and time.
 *
 * @param {object} ctx Message context
 */
Reminder.prototype.update = function(ctx) {
  let sql = 'UPDATE `reminders` SET `alert_date` = ?, `alert_time` = ? WHERE `id` = ?';
  this.database.connection.query(sql, [this.record.date, this.record.time, this.record.id], (err, res) => {
    if (res.affectedRows > 0) {
      ctx.reply('Your reminder was successfully snoozed!');
    }

    if (err !== null) {
      console.log(err);
    }
  });
}

Reminder.prototype.cancel = function(ctx) {
  this.clearAction();
  ctx.reply('Your action was canceled.');
}

Reminder.prototype.start = function(config) {
  this.alertTimer = setInterval(() => {
    let now   = new Date();
    let today = parseDate(now);
    let ctime = now.getHours() + ':' + now.getMinutes() + ':00';
    let sql   = 'SELECT * FROM `reminders` '
              + 'WHERE `alert_date` = ? AND `alert_time` = ? AND `confirmed` = false';
    this.database.connection.query(sql, [today, ctime], (err, res) => {
      this.alert(config, res);
      if (err !== null) {
        console.log(err);
      }
    });
  }, 60000);
}

Reminder.prototype.alert = function(config, reminders) {
  if (reminders.length === 0) {
    return false;
  }

  for (let i = 0; i < reminders.length; i++) {

    let reply_markup = JSON.stringify({
      inline_keyboard: [
        [{ text: 'Confirm', callback_data: 'confirm:' + reminders[i].id }, { text: 'Snooze', callback_data: 'snooze:' + reminders[i].id }]
      ]
    });

    https.get('https://api.telegram.org/bot' + config.telegram.token + '/sendmessage?chat_id=' + reminders[i].from_id + '&text=' + reminders[i].content + '&reply_markup=' + reply_markup, (res) => {
      console.log('Sent!');
    });
  }
}

Reminder.prototype.request = function(ctx, text) {
  var request = this.dialogflow.textRequest(text, {
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

module.exports = Reminder;
