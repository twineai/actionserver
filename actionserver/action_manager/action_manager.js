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

const path = require("path");
const Promise = require("bluebird");
const E = require("core-error-predicates");

const errors = require("./errors");
const logging = require("../logging");
const Action = require("./action");

const fs = Promise.promisifyAll(require("fs"));

const logger = logging.getLogger("ActionManager");

//
// Action Manager
//

class ActionManager {
  constructor(actionRoot) {
    this.actionRoot = actionRoot;

    const actions = {};
    this.actionLoadPromise = fs.readdirAsync(actionRoot)
      .filter((fileName) => {
        return fs.statAsync(fileName)
          .then((stat) => stat.isDirectory())
          .catch(E.FileAccessError, () => false);
      })
      .filter((fileName) => {
        return this._filter(fileName);
      })
      .each((dirName) => {
        const actionDir = path.join(actionRoot, dirName);
        const action = this._loadAction(actionDir);

        logger.info("Loaded action: %s v%s", action.name, action.version);
        actions[action.name] = action;
      })
      .then(() => {
        return actions;
      });
  }

  runAction(actionName, ctx, req) {
    return this.actionLoadPromise
      .then((actions) => {
        const action = actions[actionName];
        if (action) {
          let result = action.run(ctx, req);
          if (result instanceof Error) {
            throw result;
          } else {
            return result;
          }
        } else {
          throw new errors.ActionMissingError(`missing action '${actionName}`);
        }
      });
  }

  _loadAction(actionPath) {
    const json = require(path.join(actionPath, "package.json"));
    const name = json.name;
    const version = json.version;

    const action = new Action(name, version, actionPath);
    return action;
  }

  _filter(fileName) {
    switch(fileName) {
      case ".git": return false;
      case ".idea": return false;
      default: return true;
    }
  }
}

module.exports = ActionManager;
