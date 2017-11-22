"use strict";

const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

const errors = require("./errors");
const flags = require("../flags");
const Action = require("./action");

const logger = require("../logging").logger;

//
// Command-line arguments
//

flags.addOptionConfig([
  {
    group: "Action Options"
  },
  {
    names: ["action-name"],
    env: "ACTION_NAME",
    type: "string",
    help: "The name of the action which should be served.",
  },
  {
    names: ["action-dir"],
    env: "ACTION_DIR",
    type: "string",
    help: "Path to the directory containing actions (or where actions should be downloaded)",
    default: path.resolve(__dirname + "/../../actions"),
  },
]);

//
// Action Manager
//

class ActionManager {
  constructor(opts) {
    if (!opts.action_name) {
      throw new Error("Missing action name");
    }

    this.actionLoadPromise = Promise.promisify(fs.readdir)(opts.action_dir)
      .then((items) => {
        const actions = {};
        items.forEach((item) => {
          const actionPath = path.join(opts.action_dir, item);
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
