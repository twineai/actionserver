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
    default: LOG_STYLE_GKE,
    options: [LOG_STYLE_LOCAL, LOG_STYLE_GKE],
  },
]);

//
// Logger
//

const levelConfig = {
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
  },
};

winston.addColors(levelConfig);

const container = new winston.Container();
const transports = {
  console: new winston.transports.Console({
    stderrLevels: ["critical", "error"]
  }),
};

let localFormatters = null;
let gkeFormatters = null;
let defaultFormatters = null;
let config = {
  levels: levelConfig.levels,
  transports: [
    transports.console,
  ],
};

function getDevelopmentFormatters() {
  if (!localFormatters) {
    const lineformat = winston.format.printf(info => {
      return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    });

    localFormatters = [
      winston.format.splat(),
      winston.format.timestamp(),
      winston.format.simple(),
      winston.format.colorize(),
      winston.format.prettyPrint(),
      lineformat,
    ];
  }

  return localFormatters;
}

function getGKEFormatters() {
  if (!gkeFormatters) {
    const pjson = require("./package.json");

    const lineformat = winston.format.printf(item => {
      return JSON.stringify(
        Object.assign(
          item.meta && Object.keys(item.meta).length ? {meta: item.meta} : {},
          {
            severity: item.level.toUpperCase(),
            message: item.message,
            serviceContext: {
              service: pjson.name,
              version: pjson.version,
              component: item.label,
            },
          }
        )
      ).trim();
    });

    gkeFormatters = [
      winston.format.splat(),
      lineformat,
    ];
  }

  return gkeFormatters;
}

function getLogger(name) {
  let localConfig = Object.assign({}, config);
  localConfig.format = winston.format.combine(
    winston.format.label({ label: name }),
    ...defaultFormatters
  );

  let logger = container.add(name, localConfig);
  return logger;
}

module.exports.setupLogging = (opts) => {
  if (defaultFormatters) {
    throw new Error("Cannot set up logging more than once");
  }

  transports.console.level = opts.log_level;

  switch (opts.log_style) {
    case LOG_STYLE_LOCAL:
      defaultFormatters = getDevelopmentFormatters();
      break;
    case LOG_STYLE_GKE:
      defaultFormatters = getGKEFormatters();
      break;
    default:
      throw new Error(`unknown log style: ${opts.log_style}`);
  }
};

module.exports.getLogger = getLogger;