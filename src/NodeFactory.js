/**
 * Exports a factory function that creates instances of "node operations".
 * These are agnostic of the provided store/cache but utliitze the store/cache
 * via dependency injection. The default export provides partials bound
 * to the provided store/cache.
 *
 * A NodeFactory instance provides the following interface:
 * - upsertNodes,
 * - deleteNodes,
 * - getAllNodes,
 * - getExpandedNodeWithId,
 * @since 4/10/18
 * @file
 */

import _ from 'lodash';
import fp from 'lodash/fp';
import debug from 'debug';
import uuid from 'uuid/v4';
import assert from 'assert';

import {
  NODE_SCHEMA,
  ROOT_NODE_ID,
  NODE_TYPE_OPTIONS,
} from './constants';

const log = debug('node-factory:operations');

const getNodeId = fp.get('id');
const formatNode = fp.pick(_.keys(NODE_SCHEMA));

/**
 * @param {object} node The node to assert leafyness.
 * @returns {boolean} True if the node is a leaf node.
 */
const isLeafNode = ({ type }) => _.get(NODE_TYPE_OPTIONS, `${type}.isLeaf`, false);

/**
 * Attempts to get the cached node with the given id
 * and fallsback back to looking up in the store.
 * @param {object} cache The cache.
 * @param {object} store The persistence store.
 * @param {string} id The id of the node to get.
 * @returns {object} The cached or fetched node if it exists.
 */
const getCachedNodeOrFetch = (cache, store, id) => cache.get(id) || store.getNodeWithId(id);

/**
 * Validates a node by checking the required properties, per NODE_SCHEMA.
 * This also omits any extraneous node properties send over the socket we don't care about.
 * @param {object} node The node to validate.
 * @returns {object} The validated and formatted node.
 * @export
 */
export function validateAndFormatNode(node) {
  const formatted = formatNode(node);

  _.each(NODE_SCHEMA, ({ check, message }, key) => {
    assert(check(formatted[key], formatted), message);
  });

  return formatted;
}

/**
 * Prepares a user provided node for upsertion by spreading in existing properties,
 * validating the node and formatting it to omit useless "junk" data.
 * @param {object} factoryOptions Options used to create this NodeFactory instance.
 * @param {object} userNode The input node from the incoming socket message.
 * @returns {object} The validated and formatted node, ready for upsertion.
 * @export
 */
export async function prepareNodeForUpsertion({ store, cache }, userNode) {
  if (!_.isPlainObject(userNode)) throw new TypeError('Upsert expected an object for a node.');

  const existingNode = await getCachedNodeOrFetch(cache, store, userNode.id) || {};
  const id = existingNode.id || uuid();

  const node = validateAndFormatNode({
    ...existingNode,
    ...userNode,
    id,
  });

  // Don't perform upsert if no updates have actually occurred.
  if (_.isEqual(node, formatNode(existingNode))) return null;

  // Validate that the parent node exists (if not attaching to the root node).
  // If the parent node doesn't exist, we cannot upsert. Since the root node
  // is conceptual and never added to the db, we account for that here.
  const hasParentNode = Boolean(
    node.parent === ROOT_NODE_ID || await getCachedNodeOrFetch(cache, store, node.parent),
  );

  if (!hasParentNode) {
    throw new Error("Cannot upsert node, since its parent node doesn't exist.");
  }

  return node;
}

/**
 * Gets an array containing the node and all of its transitive children.
 * @param {object} factoryOptions Options used to create this NodeFactory instance.
 * @param {object} userNode The input node from the incoming socket message.
 * @returns {Promise<Array>} Resolves with an array containing
 * the node and all of its transitive children.
 * @export
 */
export async function getNodeAndTransitiveChildren({ store, cache }, userNode) {
  const cached = cache.get(userNode.id);
  if (cached) return [cached].concat(cached.children);

  const node = await store.getNodeWithId(userNode.id);
  if (!node) return [];

  // Optimization to prevent DB calls on leaf nodes that can't have children.
  if (isLeafNode(node)) return [node];

  // Get all of the node's children and their children recursively.
  const transitiveChildren = await Promise.map(
    await store.getChildrenOfNodeWithId(node.id),
    child => getNodeAndTransitiveChildren({ store, cache }, child.id),
  );

  // This returns a single array with the node first,
  // then all children and grandchildren.
  return [node].concat(_.flatten(transitiveChildren));
}

/**
 * Upserts all of the given nodes to the database.
 * @param {object} factoryOptions Options used to create this NodeFactory instance.
 * @param {Array<object>} nodesToUpsert The set of nodes received from the frontend to upsert.
 * @returns {Promise} Resolves once all of the nodes have been created.
 * @export
 */
export async function upsertNodes({ store, cache }, nodesToUpsert) {
  if (!_.isArray(nodesToUpsert)) {
    throw new TypeError('`upsertNodes` expected an array of nodes to upsert.');
  }

  const prepareNodes = _.partial(prepareNodeForUpsertion, { store, cache });
  const nodes = await Promise.map(nodesToUpsert, prepareNodes).filter(_.isPlainObject);

  if (!nodes.length) return [];
  await store.upsertNodes(nodes);

  _.each(nodes, (node) => {
    // Update the direct cache for the node
    const cached = cache.get(node.id) || { children: [] };
    const updatedCache = { ...node, children: [...cached.children] };
    cache.set(node.id, updatedCache);

    // Update the node reference in the parent's cache
    const parentCache = cache.get(node.parent);
    if (!parentCache) return null;

    const indexOfChildNode = _.findIndex(parentCache.children, { id: node.id });
    return indexOfChildNode !== -1
      ? parentCache.children.splice(indexOfChildNode, 1, updatedCache)
      : parentCache.children.push(updatedCache);
  });

  log(`Upserted ${nodes.length} nodes`);
  return nodes;
}

/**
 * Deletes all of the given nodes from the database.
 * This will also delete all of the node's child nodes, and their child nodes,
 * since if a child node is deleted there's no reason to keep transitive nodes.
 * @param {object} factoryOptions Options used to create this NodeFactory instance.
 * @param {Array<object>} nodesToDelete The set of nodes received from the frontend to delete.
 * @returns {Promise} Resolves once all of the nodes have
 * been created with the deleted set of nodes.
 * @export
 */
export async function deleteNodes({ store, cache }, nodesToDelete) {
  if (!_.isArray(nodesToDelete)) {
    throw new TypeError('`deleteNodes` requires an array of nodes to upsert.');
  }

  const transitiveNodes = await Promise.map(nodesToDelete,
    _.partial(getNodeAndTransitiveChildren, { store, cache }),
  );

  const nodes = _.uniqBy(_.map(transitiveNodes, fp.first), getNodeId);
  const nodesWithChildren = _.uniqBy(_.flatten(transitiveNodes), getNodeId);

  // When deleting we have to delete the node cache
  // and remove the node from its parent's cache.
  _.each(nodesWithChildren, (node) => {
    cache.del(node.id);

    const parentCache = cache.get(node.parent);
    if (!parentCache) return;

    const indexOfChildNode = _.findIndex(parentCache.children, { id: node.id });
    if (indexOfChildNode === -1) return;

    parentCache.children.splice(indexOfChildNode, 1);
  });

  if (!nodesWithChildren.length) return [];
  await store.deleteNodes(nodesWithChildren);

  log(`Deleted ${nodes.length} nodes, and ${nodesWithChildren.length - nodes.length} child nodes`);
  return nodes;
}

/**
 * Gets an expanded node by id, that is a node with its children and grandchildren, etc added in.
 * Since this will be used to prime the node trees when the application loads, we're caching
 * node fetches to prevent spamming the database.
 * @param {object} factoryOptions Options used to create this NodeFactory instance.
 * @param {string} id The id of the node to delete.
 * @returns {Promise} Resolves with the node with the given id, or null if it doesn't exist.
 * @export
 */
export async function getExpandedNodeWithId({ store, cache }, id) {
  if (!_.isString(id)) return null;
  const cached = cache.get(id);

  if (cached) {
    log(`Fetched expanded node with id ${id} (cache hit)`);
    return cached;
  }

  const node = await store.getNodeWithId(id);
  if (!node) return null;

  let children = [];

  // Get the expanded children and their children, etc.
  // This will recursively get transitive children.
  if (!isLeafNode(node)) {
    children = _.compact(await Promise.map(
      await store.getChildrenOfNodeWithId(node.id),
      child => getExpandedNodeWithId({ store, cache }, child.id),
    ));
  }

  log(`Fetched expanded node with id ${id} (cache miss)`);
  const expanded = Object.assign(node, { children });

  cache.set(expanded.id, expanded);
  return expanded;
}

/**
 * Gets all of the store's nodes.
 * This is purely for debugging purposes.
 * @param {object} factoryOptions Options used to create this NodeFactory instance.
 * @returns {object} A NodeFactory "instance".
 * @export
 */
export async function getAllNodes({ store }) {
  return store.getAllNodes();
}

/**
 * Gets the root node.
 * The root node is conceptual, it doesn't exist in the database.
 * @param {object} factoryOptions Options used to create this NodeFactory instance.
 * @returns {object} The root node and all its transitive children.
 * @export
 */
export async function getExpandedRootNode(factoryOptions) {
  const children = await factoryOptions.store
    .getChildrenOfNodeWithId(ROOT_NODE_ID)
    .map(child => getExpandedNodeWithId(factoryOptions, child.id));

  return {
    id: ROOT_NODE_ID,
    type: 'root',
    value: 'root',
    parent: null,
    children,
  };
}

/**
 * Creates a new "node operations" instance, given factory options.
 * @param {object} factoryOptions Options used to create this NodeFactory instance.
 * @returns {object} Each of the exportable node operations bound to "factoryOptions".
 */
export default function NodeFactory(factoryOptions) {
  const operations = {
    upsertNodes,
    deleteNodes,
    getAllNodes,
    getExpandedRootNode,
    getExpandedNodeWithId,
  };

  const nodeFactory = _.mapValues(operations, action => _.partial(action, factoryOptions));
  const compositeAction = async actions => _.flatten(await Promise.map(actions,
    ({ event, args }) => nodeFactory[event](...args),
  ));

  return Object.assign(nodeFactory, { compositeAction });
}
