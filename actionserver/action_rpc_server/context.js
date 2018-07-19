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

const util = require("util");
const protos = require("twine-protos");

const logging = require("../logging");

protos.loadSync("twine_protos/twinebot/action_service.proto");
const CommandEvent = protos.lookupType("twinebot.CommandEvent");
const Event = protos.lookupType("twinebot.Event");
const Interaction = protos.lookupType("twinebot.Interaction");
const PerformActionResponse = protos.lookupType("twinebot.PerformActionResponse");
const SetSlotEvent = protos.lookupType("twinebot.SetSlotEvent");

class ActionContext {
  constructor(actionName, call, db, elasticsearchClient) {
    this.actionName = actionName;
    this.call = call;
    this.db = db;
    this._elasticsearchClient = elasticsearchClient;
    this._logger = logging.getLogger(actionName);
    this._models = db.models;
  }

  speak(text, freeform=false) {
    let interaction = freeform ? { speech: text} : { utteranceId: text };

    let response = PerformActionResponse.fromObject({
      interactions: [interaction],
    });

    this.logger.debug("SPEAK: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }

  connectToHuman() {
    let response = PerformActionResponse.fromObject({
      interactions: [{
        command: Interaction.Command.CONNECT_TO_HUMAN,
      }],
    });

    this.logger.debug("Sending to human: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }

  disconnect() {
    let response = PerformActionResponse.fromObject({
      interactions: [{
        command: Interaction.Command.DISCONNECT,
      }],
    });

    this.logger.debug("Disconnecting: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }

  setSlot(key, value) {
    const event = Event.fromObject({
      setSlot: {
        name: key,
        value: value,
      },
    });

    this._event(event);
  }

  resetAllSlots() {
    const event = Event.fromObject({
      command: {
        commandType: CommandEvent.CommandType.RESET_SLOTS,
      },
    });

    this._event(event);
  }

  restart() {
    const event = Event.fromObject({
      command: {
        commandType: CommandEvent.CommandType.RESTART,
      },
    });

    this._event(event);
  }

  revertUtterance() {
    this.logger.debug("CMD: %s", util.inspect(CommandEvent.CommandType, { showHidden: true, depth: null }));
    const event = Event.fromObject({
      command: {
        commandType: CommandEvent.CommandType.REVERT_UTTERANCE,
      },
    });

    this._event(event);
  }

  get database() {
    return this.db;
  }

  get models() {
    return this._models;
  }

  get logger() {
    return this._logger;
  }

  get elasticsearchClient() {
    return this._elasticsearchClient;
  }

  _event(evt) {
    let response = PerformActionResponse.fromObject({
      events: [ evt ],
    });

    this.logger.debug("EVENT: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }
}

module.exports = ActionContext;