const mongoose = require("mongoose");

class Database {
  constructor(mongooseConn) {
    this.mongooseConn = mongooseConn;
    this.models = {};
  }

  loadModel(name, schema) {
    if (this.models[name]) {
      return this.models[name];
    }

    this.models[name] = this.mongooseConn.model(name, schema);
    return this.models[name];
  }
}

module.exports = Database;