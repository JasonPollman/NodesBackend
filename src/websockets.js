/**
 * Handles and manages the websocket server.
 * @since 4/10/18
 * @file
 */

import _ from 'lodash';
import debug from 'debug';
import io from 'socket.io';

const log = debug('node-factory:websockets');

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
 * @param {object} options.server The http server to use.
 * @param {function} options.onSocketConnection Called on each new socket connection.
 * @returns {undefined}
 */
export default function serve({
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
