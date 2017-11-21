"use strict";

const Promise = require("bluebird");
const VError = require("verror");

const errors = require("./errors");

//
// Action
//

class Action {
  constructor(actionName, actionPath) {
    this.actionName = actionName;
    this.action = null;

    let module = null;
    try {
      module = require(actionPath);
      if (module[actionName]) {
        this.action = module[actionName];
      } else {
        throw new errors.ActionConfigError(`Action does not have method named ${actionName}`);
      }
    } catch(e) {
      throw new VError(e, `Unable to load action '${actionName}' at path '${actionPath}'`);
    }
  }

  run(...args) {
    return Promise.resolve(this.action(...args));
  }
}

module.exports = Action;
