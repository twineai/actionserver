const mongoose = require("mongoose");

class Database {
  constructor(mongooseConn) {
    this.mongooseConn = mongooseConn;
  }

  model(name, schema) {
    return this.mongooseConn.model(name, schema);
  }
}

module.exports = Database;