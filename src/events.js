/**
 * Exports a function that takes in a NodeFactory instance and returns a method that
 * can be passed to the websockets manager's `onSocketConnection` callback.
 * This binds all the socket events to the given NodeFactory instance.
 * @since 4/9/18
 * @file
 */

import _ from 'lodash';
import util from 'util';
import debug from 'debug';

import {
  NODE_ENV,
  SOCKET_EVENTS,
} from './constants';

const log = debug('node-factory:events');

// eslint-disable-next-line no-console
const inspect = value => console.log(util.inspect(value, { colors: true, depth: 10 }));

/**
 * Dispatches the error event when any incoming message fails to process.
 * This event can be hooked into to "toast" error messages on the front-end.
 * @param {object} socket The socket connection handler in which the error occurred.
 * @param {string} event The name of the event that failed to process.
 * @param {Error} error The error that was thrown by the incoming message handler.
 * @export
 */
export function handleNodeEventError(socket, event, error) {
  log(`Socket Handler Error "${event}":`, error);
  socket.emit(SOCKET_EVENTS.ERROR, { event, error: error.message });
}

/**
 * Broadcasts the message from the user to the rest of the connected clients.
 * This excludes the client who was the original sender (per socket.io docs).
 * @param {object} socket The socket connection handler associated with the callback.
 * @param {string} event The name of the event that callback will be bound to.
 * @param {object} node The data to emit.
 */
export function broadcastChildEvent(socket, event, node) {
  const key = `child-of-${node.parent}-${event}`;

  log(`Broadcasting Socket Event "${key}":`);
  socket.broadcast.emit(key, node);

  log(`Broadcasting Socket Event "${event}":`, node);
  socket.broadcast.emit(event, node);
}

/**
 * Prepares an incoming socket event handler by wrapping the event handler to call the respective
 * node operation, broadcast the event to all connected users, and and emit
 * the SOCKET_EVENTS.ERROR event if the handler throws.
 *
 * It also limits the interface of each partialized node operation
 * to receive only a single object (by design).
 * @param {object} socket The socket connection handler associated with the handler.
 * @param {object} eventSchema Options for this given event.
 * @param {function} eventSchema.handler The event handler that will be invoked on "event".
 * @param {boolean} eventSchema.broadcast If true, the event will be
 * broadcast to all other connected clients.
 * @param {string} event The name of the event that handler will be bound to.
 * @returns {function} The wrapped socket event handler.
 * @export
 */
export function prepareNodeOperation(socket, handler, event) {
  return (data) => {
    log(`Incoming Socket Event "${event}":`, data);

    const maybeBroadcastChildEvent = ({ node, broadcast }) => (
      broadcast ? broadcastChildEvent(socket, event, node) : _.noop
    );

    return Promise.resolve()
      .then(() => handler(data))
      .then(maybeBroadcastChildEvent)
      .catch(e => handleNodeEventError(socket, event, e));
  };
}

/**
 * Returns a function that can be passed to the websocket's `onSocketConnection`
 * callback, provided a NodeFactory instance. This will setup the necessary socket
 * event handlers for each of the corresponding node factory CRUD methods.
 * @param {object} nodes The NodeFactory to operate against and to bind to the socket connection.
 * @returns {function} A callback for websockets.onSocketConnection.
 * @export
 */
export default function setupWebsocketEvents(nodes) {
  return (websocket, socket) => {
    // Convenience to dump the store's data
    // for debugging purposes.
    if (NODE_ENV !== 'production') socket.on('dump', () => inspect(nodes.all()));

    const eventSchema = {
      [SOCKET_EVENTS.HAS_NODE]: nodes.has,
      [SOCKET_EVENTS.GET_NODE]: nodes.get,
      [SOCKET_EVENTS.SET_NODE]: nodes.set,
      [SOCKET_EVENTS.DEL_NODE]: nodes.del,
    };

    _.each(eventSchema, (schema, event) => {
      socket.on(event, prepareNodeOperation(socket, schema, event));
    });
  };
}
