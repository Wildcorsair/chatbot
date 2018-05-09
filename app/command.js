const uniqid = require('uniqid');
const Extra  = require('telegraf/extra');
const { prependZero } = require('./helpers');

/**
 * Class contains functionality for work with chatbot commands.
 */
class Command {

  /**
   * Create the Command.
   *
   * @param {object} dialogflow - Instance of Dialogflow class
   * @param {object} reminder - Instance of Reminder class
   */
  constructor(dialogflow, reminder) {
    this.dialogflow = dialogflow;
    this.reminder = reminder;
    this.action = '';
  }

  /**
   * Set action name for command.
   *
   * @param {string} action - Action name
   */
  setAction(action) {
    this.action = action;
  }

  /**
   * Get current action name for command.
   *
   * @return {string} action - Action name
   */
  getAction() {
    return this.action;
  }

  /**
   * Clear action name for command.
   *
   * @param {string} action - Action name
   */
  clearAction() {
    this.action = '';
  }

  /**
   * Method parses current command and executes
   * the certain action method for this command.
   *
   * @param {object} ctx - Chat message context
   */
  parse(ctx) {
    let command = ctx.update.message.text;
    this.clearAction();
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
      case '/cancel':
        this.cancel(ctx);
        console.log('Recived command:', command);
        break;
      default:
        this.request(ctx);
    }
  }

  /**
   * Action for /create command.
   *
   * @param {object} ctx - Chat message context
   */
  create(ctx) {
    this.reminder.setAction('create-date');
    this.request(ctx);
  }

  /**
   * Action for /cancel command.
   *
   * @param {object} ctx - Chat message context
   */
  cancel(ctx) {
    this.reminder.cancel(ctx);
  }

  /**
   * Action for /listAll command.
   *
   * @param {object} ctx - Chat message context
   */
  listAll(ctx) {
    this.reminder.listAll(ctx);
  }

  /**
   * Action for /today command.
   *
   * @param {object} ctx - Chat message context
   */
  today(ctx) {
    this.reminder.listToday(ctx);
  }

  /**
   * Method makes request to Diqlogflow API.
   *
   * @param {object} ctx Message context
   */
  request(ctx) {
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
  }

}

module.exports = Command;
