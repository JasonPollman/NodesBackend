/**
 * Starts the Node Factory socket server.
 * @since 4/9/18
 * @file
 */

import debug from 'debug';
import events from './events';
import MongoMemoryStore from './MongoMemoryStore';
import NodeFactory from './NodeFactory';
import serveWebsockets from './websockets';
import { NODE_ENV } from './constants';

const log = debug('node-factory:index');

/**
 * Serves the Node Factory backend.
 * @param {object} options Node Factory options.
 * @returns {undefined}
 */
async function start({ dataStore, ...options } = {}) {
  const store = dataStore || await MongoMemoryStore();

  return serveWebsockets({
    onSocketConnection: events(NodeFactory({ store, ...options })),
    ...options,
  });
}

// Only kick off the server if this file was called directly,
// Otherwise, defer execution to the requiring module.
if (module === require.main) {
  log(`NODE_ENV is ${NODE_ENV}`);
  start().catch(e => process.nextTick(() => { throw e; }));
}

export default start;
