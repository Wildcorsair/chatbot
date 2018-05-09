const https            = require('https');
const uniqid           = require('uniqid');
const Extra            = require('telegraf/extra');
const { prependZero, parseDate, validateDate, validateTime }  = require('./helpers');

/**
 * Class contains functionality for work with reminders:
 * - create reminder
 * - confirm reminder
 * - snooze reminder
 * - list all reminders for certain user
 * - list reminders for today for certain user
 */
class Reminder {

  /**
   * Create the Reminder.
   *
   * @param {object} dialogflow - Instance of Dialogflow class
   * @param {object} database - Instance of Database class
   */
  constructor(dialogflow, database) {
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

  /**
   * Set action name for reminder.
   *
   * @param {string} action - Action name
   */
  setAction(action) {
    this.action = action;
  }

  /**
   * Get current action name for reminder.
   *
   * @return {string} action - Action name
   */
  getAction() {
    return this.action;
  }

  /**
   * Clear action name for reminder.
   *
   * @param {string} action - Action name
   */
  clearAction() {
    this.action = '';
  }

  /**
   * Method parses current action name and fires
   * certain action method for reminder.
   *
   * @param {object} ctx - Chat message context
   */
  parse(ctx) {
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

  /**
   * Method caches date from the user message and set next action name.
   *
   * @param {object} ctx - Chat message context
   */
  createDate(ctx) {
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

  /**
   * Method caches time from the user message and set next action name.
   *
   * @param {object} ctx - Chat message context
   */
  createTime(ctx) {
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

  /**
   * Method gets text from the user message and saves all data into the store.
   *
   * @param {object} ctx - Chat message context
   */
  createText(ctx) {
    if (ctx.update.message.text !== undefined && ctx.update.message.text !== '') {
      this.record.text = ctx.update.message.text;
      this.clearAction();
      this.save(ctx);
    }
  }

  /**
   * Method saves the new reminder into the store.
   *
   * @param {object} ctx - Chat message context
   */
  save(ctx) {
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

  /**
   * Method gets all reminders for certain user and displays their.
   *
   * @param {object} ctx - Chat message context
   */
  listAll(ctx) {
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

  /**
   * Method gets today's reminders for certain user and displays their.
   *
   * @param {object} ctx - Chat message context
   */
  listToday(ctx) {
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

  /**
   * Method gets today's reminders for certain user and displays their.
   *
   * @param {object} ctx - Chat message context
   * @param {array} reminders - Array with reminders data
   */
  display(ctx, reminders) {
    if (reminders.length === 0) {
      this.request(ctx, 'no-reminders');
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

  /**
   * Method fires certain action method.
   *
   * @param {object} ctx - Chat message context
   */
  actionRoute(ctx) {
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
  confirm(ctx, fromId, reminderId) {
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
  snooze(ctx, fromId, reminderId) {
    this.record.id = reminderId;
    this.record.from_id = fromId;
    this.setAction('update-date');
    ctx.reply('Please, type new date in format: yyyy-mm-dd');
  }

  /**
   * Update date for current reminder when user snoozes it.
   *
   * @param {object} ctx - Chat message context
   */
  updateDate(ctx) {
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

  /**
   * Update time for current reminder when user snoozes it.
   *
   * @param {object} ctx - Chat message context
   */
  updateTime(ctx) {
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
   * Method updates the reminder date and time in the store.
   *
   * @param {object} ctx Message context
   */
  update(ctx) {
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

  /**
   * Method cancels current action.
   *
   * @param {object} ctx Message context
   */
  cancel(ctx) {
    this.clearAction();
    ctx.reply('Your action was canceled.');
  }

  /**
   * Start the alerts mechanizm.
   *
   * @param {object} config Object with application configuration
   */
  start(config) {
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

  /**
   * Execute an alert.
   *
   * @param {object} config Object with application configuration
   * @param {array} reminders Array of reminders
   */
  alert(config, reminders) {
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

  /**
   * Method makes request to Diqlogflow API.
   *
   * @param {object} ctx Message context
   * @param {array} reminders Array of reminders
   */
  request(ctx, text) {
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

}

module.exports = Reminder;
