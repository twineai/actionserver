"use strict";

const flags = require("./flags");
const winston = require("winston");

const LOG_STYLE_LOCAL = "local";
const LOG_STYLE_GKE = "gke";

//
// Command-line arguments
//

flags.addOptionConfig([
  {
    group: "Logging Options"
  },
  {
    names: ["log-level"],
    env: "LOG_LEVEL",
    type: "category",
    help: "The log level.",
    default: "info",
    options: ["debug", "info", "warning", "error", "critical"],
  },
  {
    names: ["log-style"],
    env: "LOG_STYLE",
    type: "category",
    help: "Style of logging.",
    default: LOG_STYLE_LOCAL,
    options: [LOG_STYLE_LOCAL, LOG_STYLE_GKE],
  },
]);

//
// Logger
//

let logger = new winston.Logger({
  levels: {
    debug: 5,
    info: 4,
    warning: 3,
    error: 2,
    critical: 1
  },
  colors: {
    debug: "blue",
    info: "green",
    warning: "yellow",
    error: "red",
    critical: "red",
  }
});

function addLocalTransport(logger, opts) {
  logger.add(winston.transports.Console, {
    timestamp: true,
    prettyPrint: true,
    stderrLevels: ["critical", "error"],
    colorize: true,
    name: "local",
  });
}

function addGKETransport(logger, opts) {
  const pjson = require("../package.json");

  logger.add(winston.transports.Console, {
    stderrLevels: ["critical", "error"],
    name: "gke",
    formatter: (options) => {
      return JSON.stringify(
        Object.assign(
          options.meta && Object.keys(options.meta).length ? {meta: options.meta} : {},
          {
            severity: options.level.toUpperCase(),
            message: options.message,
            serviceContext: {
              service: pjson.name,
              version: pjson.version,
            },
          }
        )
      ).trim();
    }
  });
}

module.exports.setupLogging = (opts) => {
  // if (logger) {
  //   throw new Error("Cannot set up logging more than once");
  // }

  logger.level = opts.log_level;

  switch (opts.log_style) {
    case LOG_STYLE_LOCAL:
      addLocalTransport(logger, opts);
      break;
    case LOG_STYLE_GKE:
      addGKETransport(logger, opts);
      break;
    default:
      throw new Error(`unknown log style: ${opts.log_style}`);
  }

  return logger;
};

module.exports.logger = logger;
