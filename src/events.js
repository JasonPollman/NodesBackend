/**
 * Exports a function that takes in a NodeFactory instance and returns a method that
 * can be passed to the websockets manager's `onSocketConnection` callback.
 * This binds all the socket events to the given NodeFactory instance.
 * @since 4/10/18
 * @file
 */

import _ from 'lodash';
import fp from 'lodash/fp';
import util from 'util';
import debug from 'debug';

import {
  NODE_ENV,
  ROOT_NODE_ID,
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
 * @returns {undefined}
 * @export
 */
export function handleNodeEventError(socket, event, error) {
  log(`Socket Handler Error "${event}":`, error);
  socket.emit(SOCKET_EVENTS.ERROR, { event, error: error.message });
}

/**
 * Broadcasts the update message to all clients.
 * @param {object} websockets The socket.io instance.
 * @param {object} socket The socket connection handler.
 * @param {object} nodes The NodeFactory instance to operate using.
 * @param {object} results The result of the upsert/delete operation.
 * @returns {undefined}
 */
export async function broadcastNodeUpdateEvent(websockets, socket, nodes, results) {
  const parentNodeIDs = _.uniq(_.map(results, fp.get('parent')));

  await Promise.map(parentNodeIDs, async (id) => {
    const node = id === ROOT_NODE_ID
      ? await nodes.getExpandedRootNode(id)
      : await nodes.getExpandedNodeWithId(id);

    const key = `${SOCKET_EVENTS.NODE_WAS_UPDATED}:${node.id}`;
    log(`Broadcasting Update Event "${key}":`);
    websockets.emit(key, node);
  });
}

/**
 * Prepares an incoming socket event handler by wrapping the event handler to call the respective
 * node broadcast operation, broadcast the event to all connected users, and and emit
 * the SOCKET_EVENTS.ERROR event if the handler throws.
 *
 * It also limits the interface of each node operation to receive only a single object (by design).
 * @param {object} nodes The NodeFactory instance to operate using.
 * @param {object} websockets The socket.io instance.
 * @param {object} socket The socket connection handler associated with the given socket `handler`.
 * @param {function} handler The event handler that will be invoked on "event".
 * @param {string} event The name of the event that handler will be bound to.
 * @returns {function} The wrapped socket event handler.
 * @export
 */
export function createBroadcastHandler(nodes, websockets, socket, handler, event) {
  return (data) => {
    log(`Incoming Socket Event "${event}":`, data);

    return Promise.resolve()
      .then(() => handler(data))
      .then(node => broadcastNodeUpdateEvent(websockets, socket, nodes, node))
      .catch(e => handleNodeEventError(socket, event, e));
  };
}

/**
 * Sets up frontend initialization socket events.
 * @param {object} socket The socket connection object.
 * @param {object} nodes The NodeFactory instance to operate using.
 * @returns {undefined}
 * @export
 */
export function initializeSocket(socket, nodes) {
  socket.on(SOCKET_EVENTS.INIT, async () => {
    socket.emit(SOCKET_EVENTS.INIT, await nodes.getExpandedRootNode());
  });
}

/**
 * Returns a function that can be passed to the websocket's `onSocketConnection`
 * callback, provided a NodeFactory instance. This will setup the necessary socket
 * event handlers for each of the corresponding node factory CRUD methods and automatically
 * broadcast the events to all other connected clients.
 * @param {object} nodes The NodeFactory to operate against and to bind to the socket connection.
 * @returns {function} A callback for websockets.onSocketConnection.
 * @export
 */
export default function setupWebsocketEvents(nodes) {
  return (websockets, socket) => {
    initializeSocket(socket, nodes);

    if (NODE_ENV !== 'production') {
      // Convenience to dump the store's data for debugging purposes.
      socket.on(SOCKET_EVENTS.DUMP, () => inspect(nodes.getAllNodes()));
    }

    const broadcastEvents = _.pick(nodes, ['upsertNodes', 'deleteNodes', 'compositeAction']);

    _.each(broadcastEvents, (handler, event) => {
      socket.on(event, createBroadcastHandler(nodes, websockets, socket, handler, event));
    });
  };
}
