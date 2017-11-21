"use strict";

const flags = require("../flags");
const path = require("path");
const Action = require("./action");

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

    const actionName = opts.action_name;
    const actionPath = path.join(opts.action_dir, opts.action_name);

    this.actionName = actionName;
    this.action = new Action(actionName, actionPath)
  }

  run(...args) {
    return this.action.run(...args);
  }
}

module.exports = ActionManager;
