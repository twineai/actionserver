"use strict";

const util = require("util");

const ActionManager = require("../action_manager");

class ActionRPCServer {
  constructor(actionManager) {
    this.actionManager = actionManager;
  }

  performAction(req, callback) {
    console.log("Performing action");
    console.log(this.actionManager);
    console.log(util.inspect(req, { showHidden: true, depth: null }));
    callback(null, {
      interactions: [
        {
          speech: "Hello there"
        },
        {
          speech: "Party time"
        }
      ]
    });
  }
}

module.exports = ActionRPCServer;
