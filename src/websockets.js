/**
 * Handles and manages the websocket connection.
 * @since 4/9/18
 * @file
 */

import _ from 'lodash';
import http from 'http';
import debug from 'debug';
import io from 'socket.io';
import express from 'express';
import { DEFAULT_PORT } from './constants';

const log = debug('node-factory:websockets');

/**
 * Invokes once the default server is listening.
 * @param {object} data Data containing the server and the server's resolution method.
 * @returns {undefined}
 */
const onServerListening = ({ server, resolve }) => () => {
  const { port, address } = server.address();
  log(`Server listening @ ${address}:${port}`);
  resolve(server);
};

/**
 * Creates a default server if the user doesn't supply one to index.js.
 * All standard HTTP requests will send back 401.
 * @returns {http.Server} An http server instance.
 * @export
 */
export function defaultServer({ port = DEFAULT_PORT } = {}) {
  return new Promise((resolve, reject) => {
    const app = express();
    const server = http.Server(app);

    app.use((request, response) => response.status(401).send('Unauthorized'));

    server
      .on('error', reject)
      .on('listening', onServerListening({ server, resolve }))
      .listen(port);
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
export default async function serveWebsockets({
  httpServer,
  onSocketConnection = _.noop,
  ...options
} = {}) {
  const server = httpServer || await defaultServer(options);
  const websockets = io(server);

  websockets.on('connection', onNewSocketConnection);
  websockets.on('connection', _.partial(onSocketConnection, websockets, _));

  return {
    server,
    websockets,
  };
}
