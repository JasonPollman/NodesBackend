/**
 * A small interactive CLI to test backend functionality without a front-end.
 * Requires dev dependencies to be installed and run via babel-node (or transpiled).
 * This is for debugging purposes only.
 * @since 4/9/18
 * @file
 */

/* eslint-disable import/no-extraneous-dependencies, no-console */

import _ from 'lodash';
import util from 'util';
import minimist from 'minimist';
import readline from 'readline';
import io from 'socket.io-client';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const client = io(`http://localhost:${_.get(process.env, 'PORT', 3000)}`);

const inspect = value => console.log(util.inspect(value, { colors: true, depth: 10 }));

/**
 * Attempts to parse the input as JSON and returns the
 * original value if parsing failed.
 * @param {any} input The input to attempt to parse.
 * @returns {any} The parsed or original value.
 */
function tryJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch (e) {
    return input;
  }
}

/**
 * A mapping of commands to their respective actions.
 * @type {object<function>}
 */
const COMMAND_MAPPING = {
  listen: ({ event }) => client.on(event, inspect),
  emit: ({ event, data }) => client.emit(event, data),
  default: ({ command }) => inspect(`No command ${command} exists.`),
};

/**
 * Process an input command.
 * @param {string} input The input command to process.
 * @returns {undefined}
 */
function processCommand(input) {
  const options = _.mapValues(minimist(input.split(/\s+/g)), tryJsonParse);
  const command = _.first(options._);
  return _.get(COMMAND_MAPPING, command, 'default')({ ...options, command });
}

(function prompt() {
  rl.question('> ', input => Promise.resolve(input)
    .then(processCommand)
    .catch(inspect)
    .finally(prompt),
  );
}());
