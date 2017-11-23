#!/usr/bin/env node
"use strict";

const grpc = require("grpc");
const path = require("path");
const twinebot = require("twine-protos")("twine_protos/twinebot/action_service.proto").twinebot;

const flags = require("./flags");
const logging = require("./logging");
const ActionManager = require("./action_manager");
const ActionRPCServer = require("./action_rpc_server");

const scriptName = path.basename(__filename);

function main() {
  /** Prints usage information then exits. */
  function usage(exitCode = 0) {
    var help = flags.help;
    console.log("usage: node " + scriptName + " [OPTIONS]\n"
      + "options:\n"
      + help);

    process.exit(exitCode);
  }

  let opts = {};

  try {
    opts = flags.parse(process.argv);
  } catch (e) {
    console.error("%s: error: %s", scriptName, e.message);
    usage(1);
  }

  logging.setupLogging(opts);
  const logger = logging.logger;

  logger.debug("Command line args", opts);

  if (opts.help) {
    usage(0);
  }

  if (opts.version) {
    const pjson = require("./package.json");
    console.log("%s %s", scriptName, pjson.version);
    process.exit(0);
  }

  const actionDir = opts.action_dir;
  process.chdir(actionDir);

  const grpcServer = new grpc.Server();
  const actionManager = new ActionManager(actionDir);

  const rpcServer = new ActionRPCServer(actionManager);
  grpcServer.addService(twinebot.TwineBotActionService.service, rpcServer);

  const serverAddress = `0.0.0.0:${opts.port}`;
  logger.info(`Starting server at ${serverAddress}`);
  grpcServer.bind(serverAddress, grpc.ServerCredentials.createInsecure());
  grpcServer.start();
}

main();
