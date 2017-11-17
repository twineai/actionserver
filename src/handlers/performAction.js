"use strict";

const actionpb = require("twine-protos/generated/node/twine_protos/twinebot/action_service_pb");

module.exports = (call, callback) => {
  const reply = new actionpb.PerformActionResponse();
  reply.setMessage('Hello ' + call.request.getName());
  callback(null, reply);
};
