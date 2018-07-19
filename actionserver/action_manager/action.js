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

"use strict";

const Promise = require("bluebird");
const VError = require("verror");

const errors = require("./errors");

//
// Action
//

class Action {
  constructor(name, version, actionPath) {
    this.name = name;
    this.version = version;
    this.action = null;

    let module = null;
    try {
      module = require(actionPath);
      if (module[name]) {
        this.action = module[name];
      } else {
        throw new errors.ActionConfigError(`Action does not have method named ${name}`);
      }
    } catch(e) {
      throw new VError(e, `Unable to load action '${name}' at path '${actionPath}'`);
    }
  }

  run(...args) {
    return Promise.resolve(this.action(...args));
  }
}

module.exports = Action;
