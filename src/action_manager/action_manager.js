"use strict";

const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

const errors = require("./errors");
const Action = require("./action");

const logger = require("../logging").logger;

//
// Action Manager
//

class ActionManager {
  constructor(actionDir) {
    this.actionDir = actionDir;
    this.actionLoadPromise = Promise.promisify(fs.readdir)(actionDir)
      .then((items) => {
        const actions = {};
        items.forEach((item) => {
          const actionPath = path.join(actionDir, item);
          const json = require(path.join(actionPath, "package.json"));
          const actionName = json.name;

          actions[actionName] = new Action(actionName, actionPath);
          logger.info("Loaded action: %s v%s", actionName, json.version);
        });

        return actions;
      });
  }

  runAction(actionName, ...args) {
    return this.actionLoadPromise
      .then((actions) => {
        const action = actions[actionName];
        if (action) {
          return action.run(...args);
        } else {
          throw new errors.ActionMissingError(`missing action '${actionName}`);
        }
      });
  }
}

module.exports = ActionManager;
