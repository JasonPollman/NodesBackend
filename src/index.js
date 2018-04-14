/**
 * Starts the Node Factory application if started directly.
 * Otherwise it creates and exports a reuable NodeFactory
 * instance.
 * @since 4/10/18
 * @file
 */

import debug from 'debug';
import LRUCache from 'lru-cache';

import cors from 'cors';
import http from 'http';
import express from 'express';

import events from './events';
import stores from './stores';

import NodeFactory from './NodeFactory';
import setupSocketServer from './websockets';

import {
  PORT,
  NODE_ENV,
  DEFAULT_STORE,
  CACHE_MAX_ITEMS,
  SERVE_STATIC_DIRECTORY,
} from './constants';

const log = debug('node-factory:index');

/**
 * Serves the Node Factory backend.
 * @param {object} options Node Factory options.
 * @returns {undefined}
 */
async function setupNodeFactory({
  store: dataStore,
  cache: dataCache,
  ...options
} = {}) {
  const cache = dataCache || new LRUCache({ max: CACHE_MAX_ITEMS });
  const store = dataStore || await stores[DEFAULT_STORE](options);

  return setupSocketServer({
    onSocketConnection: events(NodeFactory({ store, cache, ...options })),
    ...options,
  });
}

/**
 * Only kicks off the socket servie if this file was called directly.
 * @returns {Promise} Resolves once the socket server is ready and listening.
 */
async function main() {
  if (module !== require.main) return null;
  process.title = 'Node Factory';

  log(`NODE_ENV is ${NODE_ENV}`);

  const app = express();
  const httpServer = http.Server(app);

  app.use(cors());
  app.use(express.static(SERVE_STATIC_DIRECTORY));
  app.use((request, response) => response.status(401).send('Unauthorized'));

  await setupNodeFactory({ httpServer });
  return httpServer.listen(PORT);
}

main().catch(e => process.nextTick(() => { throw e; }));

export default setupNodeFactory;
export stores from './stores';
export NodeFactory from './NodeFactory';
