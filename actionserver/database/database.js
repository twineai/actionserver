/*
 * Twine - The Twine Platform
 *
 * Copyright 2018 The Twine Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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