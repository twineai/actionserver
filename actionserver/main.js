#!/usr/bin/env node
"use strict";

const grpc = require("grpc");
const mongoose = require('mongoose');
const path = require("path");
const Promise = require("bluebird");

const flags = require("./flags");
const logging = require("./logging");

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
  const logger = logging.getLogger("main");

  logger.debug("Command line args", opts);

  if (opts.help) {
    usage(0);
  }

  if (opts.version) {
    const pjson = require("./package.json");
    console.log("%s %s", scriptName, pjson.version);
    process.exit(0);
  }

  const actionServer = require("./actionserver");
  actionServer(opts);
}

main();
