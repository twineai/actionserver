"use strict";

const flags = require("../flags");
const path = require("path");
const GCSLoader = require("./gcs_loader");
const LocalLoader = require("./local_loader");

const ACTION_SOURCE_GCS = "gcs";
const ACTION_SOURCE_LOCAL = "local";

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
    names: ["action-source"],
    env: "ACTION_SOURCE",
    type: "category",
    help: "Source of actions. For anything other than 'local', actions will be downloaded.",
    default: ACTION_SOURCE_GCS,
    options: [ACTION_SOURCE_LOCAL, ACTION_SOURCE_GCS],
  },
  {
    names: ["action-root"],
    env: "ACTION_ROOT",
    type: "string",
    help: "Path to the directory containing actions (or where actions should be downloaded)",
    default: path.resolve(__dirname + "/../actions"),
  },
]);

//
// Action Manager
//

class ActionManager {
  constructor(opts) {
    this.loaded = false;
    this.actionName = opts.action_name;

    switch(opts.action_source) {
      case ACTION_SOURCE_GCS:
        this.loader = new GCSLoader(opts);
        break;
      case ACTION_SOURCE_LOCAL:
        this.loader = new LocalLoader(opts);
        break;
      default:
        throw new Error(`Unknown action source: ${opts.action_source}`);
    }
  }
}

module.exports = ActionManager;
