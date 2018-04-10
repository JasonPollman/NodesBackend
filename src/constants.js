/**
 * Application wide constants.
 * @since 4/9/18
 * @file
 */

import _ from 'lodash';
import generateUUIDRegExp from 'uuid-regexp';

const UUIDRegExp = generateUUIDRegExp({ nil: true });

/**
 * Maps node types to their respective validation function.
 * @type {object<function>}
 */
const NODE_TYPE_MAPPING = {
  factory: _.isString,
  default: _.isNumber,
};

/**
 * The prefix to append to all socket event names.
 * If this application we're expanded, this could serve
 * to avoid collisions with other functionality.
 * @type {string}
 */
const SOCKET_EVENT_NAME_PREFIX = '';

export default Object.assign(exports, Object.freeze({
  NODE_ENV: _.get(process.env, 'NODE_ENV', 'production'),
  DEFAULT_PORT: 3000,
  ROOT_NODE_ID: '00000000-0000-0000-0000-000000000000',
  DEFAULT_DB_URL: 'mongodb://localhost:27017',
  DEFAULT_DB_NAME: 'node-factory',
  DEFAULT_DB_COLLECTION: 'nodes',
  SOCKET_EVENTS: {
    ERROR: `${SOCKET_EVENT_NAME_PREFIX}err`,
    HAS_NODE: `${SOCKET_EVENT_NAME_PREFIX}has`,
    GET_NODE: `${SOCKET_EVENT_NAME_PREFIX}get`,
    SET_NODE: `${SOCKET_EVENT_NAME_PREFIX}set`,
    DEL_NODE: `${SOCKET_EVENT_NAME_PREFIX}del`,
  },
  NODE_SCHEMA: {
    id: {
      check: id => UUIDRegExp.test(id),
      message: 'Node "id" property must be a valid v4 UUID.',
    },
    type: {
      check: _.isString,
      message: 'Node "type" property must be a string.',
    },
    parent: {
      check: _.isString,
      message: 'Node "parent" property must be a string.',
    },
    value: {
      check: (value, node) => (NODE_TYPE_MAPPING[node.type] || NODE_TYPE_MAPPING.default)(value),
      message: 'Node "value" property is invalid.',
    },
  },
}));
