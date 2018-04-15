/**
 * Application wide constants.
 * This will make a shallow copy of process.env,
 * with the below values added on if not specified.
 * @since 4/10/18
 * @file
 */

import _ from 'lodash';
import path from 'path';
import generateUUIDRegExp from 'uuid-regexp';

const NODE_TYPE_OPTIONS = {
  root: {
    isLeaf: false,
    validate: _.isString,
  },
  factory: {
    isLeaf: false,
    validate: _.isString,
  },
  number: {
    isLeaf: true,
    validate: _.isNumber,
  },
};

const NODE_TYPES = _.keys(NODE_TYPE_OPTIONS);
const UUIDRegExp = generateUUIDRegExp({ nil: true });

export default Object.assign(exports, _.defaults({}, process.env, {
  // The runtime environment, defaults to production
  NODE_ENV: 'production',
  // The default port to run the socket server on
  PORT: 3000,
  // The path to server static content from
  SERVE_STATIC_DIRECTORY: path.join(__dirname, '..', '..', 'frontend', 'dist'),
  // The default store to use if the user doesn't supply one
  DEFAULT_STORE: 'mongo',
  // Set to false to disable LRU caching.
  CACHE_ENABLED: true,
  // The maximum nodes to store in the node cache.
  // The average node size will be around 200 bytes.
  // So, lets no be greedy and cause memory issues.
  // This will max out the cache at around 50 mb.
  // Which equates to 250,000 nodes.
  CACHE_MAX_ITEMS: (1e6 * 50) / 200,
  // The id of the root node (this is the "null" UUIDv4)
  ROOT_NODE_ID: '00000000-0000-0000-0000-000000000000',
  // The default database connection string
  DEFAULT_DB_URL: 'mongodb://localhost:27017',
  // The default database name
  DEFAULT_DB_NAME: 'node-factory',
  // The default database collection
  DEFAULT_DB_COLLECTION: 'nodes',
  // The various socket events that are emitted
  // or listened to by the socket server
  SOCKET_EVENTS: {
    DUMP: 'nodeDump',
    INIT: 'nodeInitialize',
    ERROR: 'nodeError',
    NODE_WAS_UPDATED: 'nodeWasUpdated',
  },
  // The available node types
  NODE_TYPES,
  // Maps node types to their respective validation function.
  NODE_TYPE_OPTIONS,
  // The set of nodes that can have children
  // The schema that is checked when a node is upserted.
  NODE_SCHEMA: {
    id: {
      check: id => UUIDRegExp.test(id),
      message: 'Node "id" property must be a valid v4 UUID.',
    },
    type: {
      check: value => _.includes(NODE_TYPES, value),
      message: `Node "type" property must be one of [${NODE_TYPES.join(', ')}].`,
    },
    parent: {
      check: id => UUIDRegExp.test(id),
      message: 'Node "parent" property must be a valid v4 UUID.',
    },
    value: {
      check: (value, node) => _.get(NODE_TYPE_OPTIONS, `${node.type}.validate`, _.stubFalse)(value),
      message: 'Node "value" property is invalid.',
    },
  },
}));
