const mysql = require('mysql');

/**
 * Class implements database connection.
 */
class Database {
  constructor(config) {
    this.connection = mysql.createConnection({
      host     : config.database.host,
      user     : config.database.user,
      password : config.database.password,
      database : config.database.database
    });
  }
}

module.exports = Database;
