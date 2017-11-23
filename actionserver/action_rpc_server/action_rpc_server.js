"use strict";

const grpc = require("grpc");
const Promise = require("bluebird");

const actionErrors = require("../action_manager/errors");
const errors = require("./errors");
const logger = require("../logging").logger;

class ActionRPCServer {
  constructor(actionManager) {
    this.actionManager = actionManager;
  }

  performAction(...args) {
    this._run(this._performAction.bind(this), ...args);
  }

  _performAction(req, callback) {
    logger.debug("Performing action", req);

    const actionName = req.request.action.trim();

    if (!actionName) {
      return Promise.reject(new errors.RPCError(grpc.status.FAILED_PRECONDITION, "missing action name"));
    }

    return this.actionManager.runAction(actionName)
      .then((response) => {
        logger.debug("Response", response);
        return {
          interactions: [
            {
              speech: response,
            },
          ]
        };
      })
      .catch(actionErrors.ActionMissingError, (e) => {
        throw new errors.RPCError(grpc.status.NOT_FOUND, `unknown action: ${actionName}`);
      });
  }

  _run(fn, req, callback, ...args) {
    Promise.resolve()
      .then(() => {
        return fn(req, callback, ...args);
      })
      .then((response) => {
        callback(null, response);
      })
      .catch(errors.RPCError, (e) => {
        logger.error("IS RPC ERROR");
        callback(e);
      })
      .catch((e) => {
        logger.error("IS NOT RPC ERROR");
        callback({
          code: grpc.status.INTERNAL,
          details: e.message,
        });
      });
  }
}

module.exports = ActionRPCServer;
