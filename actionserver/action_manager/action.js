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
