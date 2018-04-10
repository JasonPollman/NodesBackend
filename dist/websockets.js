'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.
















onNewSocketConnection = onNewSocketConnection;exports.default =













serveWebsockets;var _lodash = require('lodash');var _lodash2 = _interopRequireDefault(_lodash);var _socket = require('socket.io');var _socket2 = _interopRequireDefault(_socket);var _debug = require('debug');var _debug2 = _interopRequireDefault(_debug);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var log = (0, _debug2.default)('node-factory:websockets'); /**
                                                                                                                                                                                                                                                                                                                                                                                                                     * Called when a new socket connects.
                                                                                                                                                                                                                                                                                                                                                                                                                     * @param {object} socket The socket handle that's just connected.
                                                                                                                                                                                                                                                                                                                                                                                                                     * @returns {undefined}
                                                                                                                                                                                                                                                                                                                                                                                                                     */ /**
                                                                                                                                                                                                                                                                                                                                                                                                                         * Handles and manages the websocket connection.
                                                                                                                                                                                                                                                                                                                                                                                                                         * @since 4/9/18
                                                                                                                                                                                                                                                                                                                                                                                                                         * @file
                                                                                                                                                                                                                                                                                                                                                                                                                         */function onNewSocketConnection(socket) {log('New socket connected', _lodash2.default.get(socket, 'handshake.address'));} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * Starts the websockets server.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * This is self contained and does *not* return the socket.io instance.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * This is to keep all socket "management" localized—all socket events
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * should be handled via `onSocketConnection`.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @param {object} options Server options.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @param {number} options.port The port to start the server on.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @param {function} options.onSocketConnection Called on each new socket connection.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     * @returns {undefined}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */function serveWebsockets() {var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},_ref$port = _ref.port,port = _ref$port === undefined ? 3000 : _ref$port,_ref$onSocketConnecti = _ref.onSocketConnection,onSocketConnection = _ref$onSocketConnecti === undefined ? _lodash2.default.noop : _ref$onSocketConnecti;var websockets = (0, _socket2.default)();websockets.on('connection', onNewSocketConnection);websockets.on('connection', _lodash2.default.partial(onSocketConnection, websockets, _lodash2.default));log('Starting websockets server...');websockets.listen(port);}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93ZWJzb2NrZXRzLmpzIl0sIm5hbWVzIjpbIm9uTmV3U29ja2V0Q29ubmVjdGlvbiIsInNlcnZlV2Vic29ja2V0cyIsImxvZyIsInNvY2tldCIsImdldCIsInBvcnQiLCJvblNvY2tldENvbm5lY3Rpb24iLCJub29wIiwid2Vic29ja2V0cyIsIm9uIiwicGFydGlhbCIsImxpc3RlbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQmdCQSxxQixHQUFBQSxxQjs7Ozs7Ozs7Ozs7Ozs7QUFjUUMsZSxDQXpCeEIsZ0MsK0NBQ0EsbUMsK0NBQ0EsOEIsMElBRUEsSUFBTUMsTUFBTSxxQkFBTSx5QkFBTixDQUFaLEMsQ0FFQTs7Ozt3WkFaQTs7OzsyWkFpQk8sU0FBU0YscUJBQVQsQ0FBK0JHLE1BQS9CLEVBQXVDLENBQzVDRCxJQUFJLHNCQUFKLEVBQTRCLGlCQUFFRSxHQUFGLENBQU1ELE1BQU4sRUFBYyxtQkFBZCxDQUE1QixFQUNELEMsQ0FFRDs7Ozs7Ozs7O3VoQkFVZSxTQUFTRixlQUFULEdBQTRFLGdGQUFKLEVBQUksa0JBQWpESSxJQUFpRCxDQUFqREEsSUFBaUQsNkJBQTFDLElBQTBDLDBDQUFwQ0Msa0JBQW9DLENBQXBDQSxrQkFBb0MseUNBQWYsaUJBQUVDLElBQWEseUJBQ3pGLElBQU1DLGFBQWEsdUJBQW5CLENBRUFBLFdBQVdDLEVBQVgsQ0FBYyxZQUFkLEVBQTRCVCxxQkFBNUIsRUFDQVEsV0FBV0MsRUFBWCxDQUFjLFlBQWQsRUFBNEIsaUJBQUVDLE9BQUYsQ0FBVUosa0JBQVYsRUFBOEJFLFVBQTlCLG1CQUE1QixFQUVBTixJQUFJLCtCQUFKLEVBQ0FNLFdBQVdHLE1BQVgsQ0FBa0JOLElBQWxCLEVBQ0QiLCJmaWxlIjoid2Vic29ja2V0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSGFuZGxlcyBhbmQgbWFuYWdlcyB0aGUgd2Vic29ja2V0IGNvbm5lY3Rpb24uXG4gKiBAc2luY2UgNC85LzE4XG4gKiBAZmlsZVxuICovXG5cbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgaW8gZnJvbSAnc29ja2V0LmlvJztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cbmNvbnN0IGxvZyA9IGRlYnVnKCdub2RlLWZhY3Rvcnk6d2Vic29ja2V0cycpO1xuXG4vKipcbiAqIENhbGxlZCB3aGVuIGEgbmV3IHNvY2tldCBjb25uZWN0cy5cbiAqIEBwYXJhbSB7b2JqZWN0fSBzb2NrZXQgVGhlIHNvY2tldCBoYW5kbGUgdGhhdCdzIGp1c3QgY29ubmVjdGVkLlxuICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uTmV3U29ja2V0Q29ubmVjdGlvbihzb2NrZXQpIHtcbiAgbG9nKCdOZXcgc29ja2V0IGNvbm5lY3RlZCcsIF8uZ2V0KHNvY2tldCwgJ2hhbmRzaGFrZS5hZGRyZXNzJykpO1xufVxuXG4vKipcbiAqIFN0YXJ0cyB0aGUgd2Vic29ja2V0cyBzZXJ2ZXIuXG4gKiBUaGlzIGlzIHNlbGYgY29udGFpbmVkIGFuZCBkb2VzICpub3QqIHJldHVybiB0aGUgc29ja2V0LmlvIGluc3RhbmNlLlxuICogVGhpcyBpcyB0byBrZWVwIGFsbCBzb2NrZXQgXCJtYW5hZ2VtZW50XCIgbG9jYWxpemVk4oCUYWxsIHNvY2tldCBldmVudHNcbiAqIHNob3VsZCBiZSBoYW5kbGVkIHZpYSBgb25Tb2NrZXRDb25uZWN0aW9uYC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNlcnZlciBvcHRpb25zLlxuICogQHBhcmFtIHtudW1iZXJ9IG9wdGlvbnMucG9ydCBUaGUgcG9ydCB0byBzdGFydCB0aGUgc2VydmVyIG9uLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gb3B0aW9ucy5vblNvY2tldENvbm5lY3Rpb24gQ2FsbGVkIG9uIGVhY2ggbmV3IHNvY2tldCBjb25uZWN0aW9uLlxuICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2VydmVXZWJzb2NrZXRzKHsgcG9ydCA9IDMwMDAsIG9uU29ja2V0Q29ubmVjdGlvbiA9IF8ubm9vcCB9ID0ge30pIHtcbiAgY29uc3Qgd2Vic29ja2V0cyA9IGlvKCk7XG5cbiAgd2Vic29ja2V0cy5vbignY29ubmVjdGlvbicsIG9uTmV3U29ja2V0Q29ubmVjdGlvbik7XG4gIHdlYnNvY2tldHMub24oJ2Nvbm5lY3Rpb24nLCBfLnBhcnRpYWwob25Tb2NrZXRDb25uZWN0aW9uLCB3ZWJzb2NrZXRzLCBfKSk7XG5cbiAgbG9nKCdTdGFydGluZyB3ZWJzb2NrZXRzIHNlcnZlci4uLicpO1xuICB3ZWJzb2NrZXRzLmxpc3Rlbihwb3J0KTtcbn1cbiJdfQ==