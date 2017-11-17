#!/usr/bin/env node
"use strict";

const argParser = require("./args");
const grpc = require("grpc");
const path = require("path");
const twinebot = require("twine-protos")("twine_protos/twinebot/action_service.proto").twinebot;
const util = require("util");

const scriptName = path.basename(__filename);

/**
 * Prints usage information then exits.
 */
function usage(exitCode = 0) {
  var help = argParser.help({includeEnv: true}).trimRight();
  console.log("usage: node " + scriptName + " [OPTIONS]\n"
    + "options:\n"
    + help);

  process.exit(exitCode);
}

function main() {
  let args = {};

  try {
    args = argParser.parse(process.argv);
  } catch (e) {
    console.error("%s: error: %s", scriptName, e.message);
    usage(1);
  }

  if (args.help) {
    usage(0);
  }

  if (args.version) {
    const pjson = require("../package.json");
    console.log("%s %s", scriptName, pjson.version);
    process.exit(0);
  }

  const server = new grpc.Server();
  server.addService(twinebot.TwineBotActionService.service, {
    performAction: (req, callback) => {
      console.log("Performing action");
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
    },
  });

  const serverAddress = `0.0.0.0:${args.port}`;
  console.log(`Starting server at ${serverAddress}`);
  server.bind(serverAddress, grpc.ServerCredentials.createInsecure());
  server.start();
}

main();