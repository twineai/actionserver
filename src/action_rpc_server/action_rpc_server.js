"use strict";

const grpc = require("grpc");
const Promise = require("bluebird");

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
    logger.debug("this", this);

    const actionName = req.request.action.trim();

    if (!actionName) {
      return Promise.reject(new errors.RPCError(grpc.status.FAILED_PRECONDITION, "missing action name"));
    }

    if (actionName !== this.actionManager.actionName) {
      return Promise.reject(new errors.RPCError(grpc.status.NOT_FOUND, `unknown action: ${actionName}`));
    }

    return this.actionManager.run(null)
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
      .catch((e) => {
        logger.error("Error running action '%s'", actionName, e);
        callback(e);
      });
  }

  _run(fn, req, callback, ...args) {
    Promise.resolve()
      .then(() => {
        logger.info("this", this);
        return fn(req, callback, ...args);
      })
      .then((response) => {
        callback(null, response);
      })
      .catch((e) => {
        logger.error("Error running method '%s'", fn.name, e);

        if (e instanceof errors.RPCError) {
          logger.error("IS RPC ERROR");
          callback(e);
        } else {
          logger.error("IS NOT RPC ERROR");
          callback({
            code: grpc.status.INTERNAL,
            details: e.message,
          });
        }
      });
  }
}

module.exports = ActionRPCServer;
