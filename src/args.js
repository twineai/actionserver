"use strict";

const dashdash = require("dashdash");
const options = [
  {
    names: ["port", "p"],
    type: "positiveInteger",
    env: "PORT",
    help: "The port to run on",
    default: 8080,
  },
  {
    names: ["help", "h"],
    type: "bool",
    help: "Print this help and exit."
  },
  {
    names: ["version"],
    type: "bool",
    help: "Print the version number and exit."
  },
];

const parser = dashdash.createParser({options: options});

module.exports = parser;
