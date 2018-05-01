const uniqid = require('uniqid');

function Reminder() {
  this.action = '';
  this.data = new Object;
  this.data['414245057'] = [
    { id: '3lnqwz0bhjjgnloty1', date: '2018-05-14', text: 'Lorem ipsum set dolor', confirmed: 'false' },
    { id: '3lnqwz0bhjjgnlperp', date: '2018-05-01', text: 'Post the new information', confirmed: 'false' },
    { id: '3lnqwz0bhjjgnlq95t', date: '2018-05-02', text: 'Remind me about my Birthday', confirmed: 'false' }
  ];
};

Reminder.prototype.setAction = function(action) {
  this.action = action;
};

Reminder.prototype.parse = function(ctx) {
  switch (this.action) {
    case 'create':
      this.create(ctx);
      break;
    default:
    ctx.reply('Sorry, no actions for reminder!');
  }
};

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
  }
};

Reminder.prototype.delete = function(ctx) {
  this.action = action;
};

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
};

Reminder.prototype.load = function(id) {
  // console.log('DATA:', this.data);
  if (id in this.data) {
    return this.data[id];
  }
};

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
};

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
  let remindersList = this.load(fromId);

  for (let i = 0; i < remindersList.length; i++) {
    if (remindersList[i].id == reminderId) {
      remindersList[i].confirmed = true;
      ctx.answerCbQuery('Your reminder was successfully confirmed!');
      ctx.tg.deleteMessage(chatId, messageId);
    }
  }
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
      console.log('snooze');
      let incDate = this.increaseOneDay(remindersList[i].date);
      remindersList[i].date = incDate;
      ctx.answerCbQuery('Your reminder was successfully snoozed on one day!');
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
  let month = this.prependZero(reminderDate.getMonth() + 1);
  let day   = this.prependZero(reminderDate.getDate());
  return year + "-" + month + "-" + day;
}

Reminder.prototype.prependZero = function(value) {
  if (value < 10) {
    return '0' + value;
  } else {
    return value;
  }
}

module.exports = Reminder;
