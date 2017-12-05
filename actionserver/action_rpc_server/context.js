const util = require("util");
const protos = require("twine-protos");

const logger = require("../logging").logger;

protos.loadSync("twine_protos/twinebot/action_service.proto");
const PerformActionResponse = protos.lookupType("twinebot.PerformActionResponse");
const Event = protos.lookupType("twinebot.Event");
const SetSlotEvent = protos.lookupType("twinebot.SetSlotEvent");
const CommandEvent = protos.lookupType("twinebot.CommandEvent");

class ActionContext {
  constructor(call) {
    this.call = call;
  }

  speak(text) {
    let response = PerformActionResponse.create({
      interactions: [
        {
          speech: text,
        }
      ],
    });

    logger.debug("SPEAK: %s", util.inspect(response, { showHidden: true, depth: null }));
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

  _event(evt) {
    let response = PerformActionResponse.create({
      events: [ evt ],
    });

    logger.debug("EVENT: %s", util.inspect(response, { showHidden: true, depth: null }));
    this.call.write(response);
  }
}

module.exports = ActionContext;