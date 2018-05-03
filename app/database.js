const mysql = require('mysql');

class Database {
  constructor() {
    this.connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'root',
      password : '123321',
      database : 'chatbot'
    });
  }
}

module.exports = Database;
