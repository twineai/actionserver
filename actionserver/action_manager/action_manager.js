"use strict";

const Promise = require("bluebird");
const E = require("core-error-predicates");

const fs = Promise.promisifyAll(require("fs"));
const path = require("path");

const errors = require("./errors");
const Action = require("./action");

const logger = require("../logging").logger;

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
        return fileName !== ".git";
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

  _loadAction(actionPath) {
    const json = require(path.join(actionPath, "package.json"));
    const name = json.name;
    const version = json.version;

    const action = new Action(name, version, actionPath);
    return action;
  }
}

module.exports = ActionManager;
