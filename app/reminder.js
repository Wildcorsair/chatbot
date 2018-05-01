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

  console.log('DATA:', this.data);
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

    this[action](fromId, reminderId);
  }
};

Reminder.prototype.confirm = function(fromId, reminderId) {
  let remindersList = this.load(fromId);
  for (let i = 0; i < remindersList.length - 1; i++) {
    if (remindersList[i].id == reminderId) {
      remindersList[i].confirmed = true;
    }
  }
}

Reminder.prototype.snooze = function(fromId, reminderId) {
  console.log(fromId);
  console.log(reminderId);
}

module.exports = Reminder;
