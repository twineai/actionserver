"use strict";

const path = require("path");
const dashdash = require("dashdash");

dashdash.addOptionType({
  name: "category",
  takesArg: true,
  helpArg: "ARG",
  parseArg: (option, optstr, arg) => {
    if (option.options.includes(arg)) {
      return arg;
    } else {
      throw new Error(`arg for "${optstr}" must be one of [${option.options.join(", ")}]`);
    }
  },
});

class Args {
  constructor(startingOptions) {
    this.config = startingOptions || [];
    this.parseCtx = null;
  }

  addOptionConfig(toAdd) {
    if (Array.isArray(toAdd)) {
      toAdd.forEach((e) => this.config.push(e));
    } else {
      this.config.push(toAdd);
    }
  }

  parse(input) {
    if (this.parseCtx) {
      throw new Error("Cannot parse arguments multiple times");
    }

    const parser = dashdash.createParser({options: this.config});

    // Save the parser always.
    this.parseCtx = {
      parser: parser,
    };

    this.parseCtx.opts = parser.parse(input);

    return this.parseCtx.opts;
  }

  get opts() {
    this._checkParsed();

    return this.parseCtx.opts;
  }

  get help() {
    const parser = this.parseCtx.parser;
    return parser.help({includeEnv: true, includeDefault: true}).trimRight();
  }

  _checkParsed() {
    if (!this.parseCtx) {
      throw new Error("Args must first be processed by calling `parse()`.");
    }
  }
}

const globalConfig = [
  {
    group: "Global Options"
  },
  {
    names: ["help", "h"],
    type: "bool",
    help: "Print this help and exit.",
  },
  {
    names: ["version"],
    type: "bool",
    help: "Print the version number and exit.",
  },
  {
    names: ["port", "p"],
    env: "PORT",
    type: "positiveInteger",
    help: "The port to run on",
    default: 8080,
  },
  {
    group: "Action Options"
  },
  {
    names: ["action-dir"],
    env: "ACTION_DIR",
    type: "string",
    help: "Path to the directory containing actions (or where actions should be downloaded)",
    default: "/user_code",
  },
  {
    group: "MongoDB Options"
  },
  {
    names: ["mongo-uri"],
    env: "MONGO_URI",
    type: "string",
    help: "The URI to use when connecting to MonboDB.",
    default: "mongodb://mongodb/twine",
  },
];

const defaultArgs = new Args(globalConfig);
module.exports = defaultArgs;
