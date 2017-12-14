#!/usr/bin/env node
"use strict";

const grpc = require("grpc");
const mongoose = require('mongoose');
const path = require("path");
const protos = require("twine-protos");
const util = require("util");
const Promise = require("bluebird");

const flags = require("./flags");
const logging = require("./logging");
const ActionManager = require("./action_manager");
const ActionRPCServer = require("./action_rpc_server");
const Database = require("./database");

//
// Proto Loading
//
protos.loadSync("twine_protos/twinebot/action_service.proto");
const TwineBotActionService = grpc.loadObject(protos.lookupService("twinebot.TwineBotActionService"));

//
// Mongoose Global Config
//
mongoose.Promise = Promise;

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
  try {
    process.chdir(actionDir);

    const grpcServer = new grpc.Server();
    const actionManager = new ActionManager(actionDir);

    // Kick off a database connection.
    const conn = mongoose.createConnection(opts.mongo_uri, { useMongoClient: true, autoIndex: false });
    const db = new Database(conn);

    const rpcServer = new ActionRPCServer(actionManager, db);
    grpcServer.addService(TwineBotActionService.service, rpcServer);

    const serverAddress = `0.0.0.0:${opts.port}`;
    logger.info(`Starting server at ${serverAddress}`);
    grpcServer.bind(serverAddress, grpc.ServerCredentials.createInsecure());
    grpcServer.start();
  } catch (e) {
    logger.error("Unable to start server: ", e);
  }
}

main();
