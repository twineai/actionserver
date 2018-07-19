/*
 * Twine - The Twine Platform
 *
 * Copyright 2018 The Twine Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const grpc = require("grpc");
const Promise = require("bluebird");

const actionErrors = require("../action_manager/errors");
const errors = require("./errors");
const logging = require("../logging");
const ActionContext = require("./context");

const logger = logging.getLogger("RPCServer");

class ActionRPCServer {
  constructor(actionManager, db, elasticsearchClient) {
    this.actionManager = actionManager;
    this.db = db;
    this.elasticsearchClient = elasticsearchClient;
  }

  performAction(call) {
    this._run(this._performAction.bind(this), call);
  }

  _performAction(call) {
    logger.debug("Performing action: %j", call.request);

    const actionName = call.request.action.trim();

    if (!actionName) {
      return Promise.reject(new errors.RPCError(grpc.status.FAILED_PRECONDITION, "missing action name"));
    }

    const ctx = new ActionContext(actionName, call, this.db, this.elasticsearchClient);
    const req = Object.assign({}, call.request);
    if (!req.slots) { req.slots = {}; }

    return this.actionManager.runAction(actionName, ctx, req)
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
