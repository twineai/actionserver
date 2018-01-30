#!/usr/bin/env node
"use strict";

const elasticsearch = require('elasticsearch');
const grpc = require("grpc");
const mongoose = require('mongoose');
const path = require("path");
const protos = require("twine-protos");
const Promise = require("bluebird");

const logging = require("./logging");
const ActionManager = require("./action_manager");
const ActionRPCServer = require("./action_rpc_server");
const Database = require("./database");

const logger = logging.getLogger("Server");

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

function run(opts) {
  const actionDir = opts.action_dir;
  try {
    process.chdir(actionDir);

    const grpcServer = new grpc.Server();
    const actionManager = new ActionManager(actionDir);

    // Kick off a database connection.
    const conn = mongoose.createConnection(opts.mongo_uri, { useMongoClient: true, autoIndex: false });
    const db = new Database(conn);

    const elasticsearchClient = new elasticsearch.Client({
      host: opts.elasticsearch_uri,
      log: 'trace'
    });

    const rpcServer = new ActionRPCServer(actionManager, db, elasticsearchClient);
    grpcServer.addService(TwineBotActionService.service, rpcServer);

    const serverAddress = `0.0.0.0:${opts.port}`;
    logger.info(`Starting server at ${serverAddress}`);
    grpcServer.bind(serverAddress, grpc.ServerCredentials.createInsecure());
    grpcServer.start();
  } catch (e) {
    logger.error("Unable to start server: %s", e);
  }
}

module.exports = run;
