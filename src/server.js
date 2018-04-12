/**
 * Handles and manages the websocket server.
 * @since 4/10/18
 * @file
 */

import _ from 'lodash';
import cors from 'cors';
import http from 'http';
import debug from 'debug';
import io from 'socket.io';
import express from 'express';

import {
  DEFAULT_PORT,
  SERVE_STATIC_DIRECTORY,
} from './constants';

const log = debug('node-factory:websockets');

/**
 * Creates a default HHTP server if the user doesn't supply one to `serve`.
 * All standard HTTP requests will send back 401—except the frontend static content.
 * @returns {http.Server} An http server instance.
 * @export
 */
export function createDefaultServer({
  port = DEFAULT_PORT,
  staticSourcepath = SERVE_STATIC_DIRECTORY,
} = {}) {
  const app = express();
  const server = http.Server(app);

  app.use(cors());
  app.use(express.static(staticSourcepath));
  app.use((request, response) => response.status(401).send('Unauthorized'));

  return Object.assign(server, {
    start: () => new Promise((resolve, reject) => {
      const onServerListening = () => {
        const info = server.address();
        log(`Server listening @ ${info.address}:${info.port}`);
        resolve(server);
      };

      return server
        .on('error', reject)
        .on('listening', onServerListening)
        .listen(port);
    }),
  });
}

/**
 * Called when a new socket connects.
 * @param {object} socket The socket handle that's just connected.
 * @returns {undefined}
 */
export function onNewSocketConnection(socket) {
  log('New socket connected', _.get(socket, 'handshake.address'));
}

/**
 * Starts the websockets server.
 * @param {object} options Server options.
 * @param {object} options.server The http server to use. If unsupplied, one will be created.
 * @param {number} options.port The port to start the server on.
 * @param {function} options.onSocketConnection Called on each new socket connection.
 * @returns {undefined}
 */
export default async function serve({
  httpServer,
  onSocketConnection = _.noop,
} = {}) {
  if (!httpServer) {
    throw new TypeError('Cannot serve sockets, no http server supplied');
  }

  const websockets = io(httpServer);
  websockets.on('connection', onNewSocketConnection);
  websockets.on('connection', _.partial(onSocketConnection, websockets, _));
}
