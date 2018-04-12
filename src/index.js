/**
 * Starts the Node Factory application if started directly.
 * Otherwise it creates and exports a reuable NodeFactory
 * instance.
 * @since 4/10/18
 * @file
 */

import debug from 'debug';
import LRUCache from 'lru-cache';

import events from './events';
import stores from './stores';

import NodeFactory from './NodeFactory';
import serve, { createDefaultServer } from './server';

import {
  NODE_ENV,
  DEFAULT_STORE,
  CACHE_MAX_ITEMS,
} from './constants';

const log = debug('node-factory:index');

/**
 * Serves the Node Factory backend.
 * @param {object} options Node Factory options.
 * @returns {undefined}
 */
async function start({
  store: dataStore,
  cache: dataCache,
  ...options
} = {}) {
  const cache = dataCache || new LRUCache({ max: CACHE_MAX_ITEMS });
  const store = dataStore || await stores[DEFAULT_STORE](options);

  return serve({
    onSocketConnection: events(NodeFactory({ store, cache, ...options })),
    ...options,
  });
}

/**
 * Only kicks off the socket servie if this file was called directly.
 * @returns {Promise} Resolves once the socket server is ready and listening.
 */
async function main() {
  if (module !== require.main) return;

  log(`NODE_ENV is ${NODE_ENV}`);
  const httpServer = createDefaultServer();

  await start({ httpServer });
  await httpServer.start();
}

main().catch(e => process.nextTick(() => { throw e; }));

export default start;
export stores from './stores';
export NodeFactory from './NodeFactory';
