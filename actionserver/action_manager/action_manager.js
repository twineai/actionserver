"use strict";

const path = require("path");
const Promise = require("bluebird");
const E = require("core-error-predicates");

const errors = require("./errors");
const logger = require("../logging").logger;
const Action = require("./action");

const fs = Promise.promisifyAll(require("fs"));

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
