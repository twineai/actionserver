const util = require("util");
const protos = require("twine-protos");

const logger = require("../logging").logger;

protos.loadSync("twine_protos/twinebot/action_service.proto");
const CommandEvent = protos.lookupType("twinebot.CommandEvent");
const Event = protos.lookupType("twinebot.Event");
const Interaction = protos.lookupType("twinebot.Interaction");
const PerformActionResponse = protos.lookupType("twinebot.PerformActionResponse");
const SetSlotEvent = protos.lookupType("twinebot.SetSlotEvent");

class ActionContext {
  constructor(call, db) {
    this.call = call;
    this.db = db;
  }

  speak(text, freeform=false) {
    let interaction = freeform ? { speech: text} : { utteranceId: text };

    let response = PerformActionResponse.create({
      interactions: [interaction],
    });

    logger.debug("SPEAK: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }

  connectToHuman() {
    let response = PerformActionResponse.create({
      interactions: [{
        command: Interaction.Command.CONNECT_TO_HUMAN,
      }],
    });

    logger.debug("Sending to human: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }

  disconnect() {
    let response = PerformActionResponse.create({
      interactions: [{
        command: Interaction.Command.DISCONNECT,
      }],
    });

    logger.debug("Disconnecting: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }

  setSlot(key, value) {
    const event = Event.create({
      setSlot: SetSlotEvent.create({
        name: key,
        value: value,
      }),
    });

    this._event(event);
  }

  resetAllSlots() {
    const event = Event.create({
      command: {
        commandType: CommandEvent.CommandType.RESET_SLOTS,
      },
    });

    this._event(event);
  }

  restart() {
    const event = Event.create({
      command: {
        commandType: CommandEvent.CommandType.RESTART,
      },
    });

    this._event(event);
  }

  get database() {
    return this.db;
  }

  _event(evt) {
    let response = PerformActionResponse.create({
      events: [ evt ],
    });

    logger.debug("EVENT: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }
}

module.exports = ActionContext;