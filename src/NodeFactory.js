/**
 * Creates instances of "node operations".
 * These are agnostic of the provided store, but utliitze the store
 * via dependency injection. The default export provides partials bound
 * to the provided store itself.
 * @since 4/9/18
 * @file
 */

import _ from 'lodash';
import debug from 'debug';
import uuid from 'uuid/v4';
import assert from 'assert';

import {
  NODE_SCHEMA,
  ROOT_NODE_ID,
} from './constants';

const log = debug('node-factory:operations');

/**
 * The fields from a node we actually care about.
 * Any other junk passed through the socket will be ignored.
 * @type {Array<string>}
 */
const NODE_VALID_FIELDS = _.keys(NODE_SCHEMA);

/**
 * Validates a node by checking the required properties, per NODE_SCHEMA, and also
 * omits any extraneous node properties send over the socket we don't care about.
 * @param {*} node The node to validate.
 */
function validateNode(node) {
  const truncatedNode = _.pick(node, NODE_VALID_FIELDS);
  _.each(NODE_SCHEMA, ({ check, message }, key) => assert(check(node[key], node), message));
  return truncatedNode;
}

/**
 * Sets a new node.
 * @param {object} factoryOptions Options used to create this operations instance.
 * @param {object} data The node data to store in the database.
 * @returns {Promise} Resolves once the node has been created.
 * @export
 */
export async function set({ store }, {
  id = uuid(),
  type,
  value,
  parent = null,
} = {}) {
  const node = validateNode({
    id,
    type,
    value,
    parent,
  });

  // Validate that the parent node exists (if not attaching to the root node).
  // If the parent node doesn't exist, we cannot upsert.
  // Use id: constants.ROOT_NODE_ID for the root node.
  const hasParentNode = parent === ROOT_NODE_ID || await store.has(node.parent);
  if (!hasParentNode) throw new Error("Cannot upsert node, since its parent node doesn't exist.");


  // Only update the node if something about it has changed.
  // This will do a deep compare on the nodes, but in our case
  // the data store is so small this is much more efficient
  // than making an upsert request to the DB as a noop.
  const isExistingNode = await store.get(id);
  const shouldUpsertNode = isExistingNode ? !_.isEqual(isExistingNode, node) : true;

  if (shouldUpsertNode) {
    await store.set(id, node);
    log('Upserted node with id', id);

    return {
      node,
      broadcast: true,
    };
  }

  log(`No changes to node with id ${id}, soft aborting upsert.`);

  return {
    node,
    broadcast: false,
  };
}

/**
 * Deletes a new node.
 * This will soft fail if the node to delete doesn't exist.
 * @param {object} factoryOptions Options used to create this operations instance.
 * @param {object} data The node data to use to delete the node, `id` is required.
 * @returns {Promise} Resolves once the node has been deleted.
 * @export
 */
export async function del({ store }, { id } = {}) {
  const node = await store.get(id);

  if (node) {
    await store.del(node.id);
    log('Deleted node with id', id);
  }

  return {
    node,
    broadcast: Boolean(node),
  };
}

/**
 * Gets a node by id.
 * Deliberately made this method async, so it's the same as the rest (since it simply uses a map).
 * @param {object} factoryOptions Options used to create this operations instance.
 * @param {object} data The node data to use to fetch the node, `id` is required.
 * @returns {Promise} Resolves with the node with the given id, or null if it doesn't exist.
 * @export
 */
export async function get({ store }, { id } = {}) {
  const node = await store.get(id) || null;
  log('Fetched node:', node);

  return {
    node,
    broadcast: false,
  };
}

/**
 * Exports all nodes.
 * @param {object} factoryOptions Options used to create this operations instance.
 */
export function all({ store }) {
  return store.data;
}

/**
 * Creates a new "node operations" instance, given factory options.
 * @param {object} factoryOptions Options used to create this operations instance.
 * @returns {object} Each of the get, set, and del node operations bound to "factoryOptions".
 */
export default function NodeFactory(factoryOptions) {
  const operations = {
    get,
    set,
    del,
    all,
  };

  return _.mapValues(operations, action => _.partial(action, factoryOptions));
}
