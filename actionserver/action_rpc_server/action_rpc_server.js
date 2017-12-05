"use strict";

const grpc = require("grpc");
const Promise = require("bluebird");

const actionErrors = require("../action_manager/errors");
const errors = require("./errors");
const logger = require("../logging").logger;
const ActionContext = require("./context");

class ActionRPCServer {
  constructor(actionManager) {
    this.actionManager = actionManager;
  }

  performAction(call) {
    this._run(this._performAction.bind(this), call);
  }

  _performAction(call) {
    logger.debug("Performing action", call.request);

    const actionName = call.request.action.trim();

    if (!actionName) {
      return Promise.reject(new errors.RPCError(grpc.status.FAILED_PRECONDITION, "missing action name"));
    }

    const ctx = new ActionContext(call);
    return this.actionManager.runAction(actionName, ctx, call.request)
      .catch(actionErrors.ActionMissingError, (e) => {
        throw new errors.RPCError(grpc.status.NOT_FOUND, `unknown action: ${actionName}`);
      });
  }

  _run(fn, call, ...args) {
    Promise.resolve()
      .then(() => {
        return fn(call);
      })
      .then(() => {
        call.end();
      })
      .catch(errors.RPCError, (e) => {
        logger.error(e.stack);
        call.emit("error", e);
      })
      .catch((e) => {
        logger.error(e.stack);
        call.emit("error", {
          code: grpc.status.INTERNAL,
          details: e.message,
        });
      });
  }
}

module.exports = ActionRPCServer;
