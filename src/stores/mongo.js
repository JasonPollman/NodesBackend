/**
 * The MongoDB driver for node CRUD operations.
 * This interface implements the "node factory store interface":
 * - `upsertNodes`
 * - `deleteNodes`
 * - `getNodeWithId`
 * - `getChildrenOfNodeWithId`
 * - `getAllNodes`
 * @since 4/10/18
 * @file
 */

import _ from 'lodash';
import debug from 'debug';
import { MongoClient } from 'mongodb';

import {
  DEFAULT_DB_URL,
  DEFAULT_DB_NAME,
  DEFAULT_DB_COLLECTION,
} from '../constants';

const log = debug('node-factory:mongo');

/**
 * Upserts the given nodes to the database.
 * @param {object} collection The database collection to operate against.
 * @param {Array<object>} nodes The set of nodes to upsert.
 * @returns {Promise} Resolves once all nodes are written to the database.
 * @export
 */
async function upsertNodes(collection, nodes) {
  log(`Upserting ${nodes.length} nodes`);

  const inserts = _.map(nodes, node => ({
    updateOne: {
      filter: { id: node.id },
      update: { $set: node },
      upsert: true,
    },
  }));

  return collection.bulkWrite(inserts, { ordered: false });
}

/**
 * Deletes the given nodes from the database.
 * @param {object} collection The database collection to operate against.
 * @param {Array<object>} nodes The set of nodes to delete.
 * @returns {Promise} Resolves once all nodes are written to the database.
 * @export
 */
async function deleteNodes(collection, nodes) {
  log(`Deleting ${nodes.length} nodes`);

  const inserts = _.map(nodes, node => ({
    deleteOne: {
      filter: { id: node.id },
    },
  }));

  return collection.bulkWrite(inserts, { ordered: false });
}

/**
 * Gets a node with the given id.
 * @param {object} collection The database collection to operate against.
 * @param {string} id The id of the node to get.
 * @returns {Promise<object>} Resolves with the node data from the database, or null.
 * @export
 */
async function getNodeWithId(collection, id) {
  if (!id) return null;

  log(`Getting node with id ${id}`);
  return collection.findOne({ id });
}

/**
 * Gets a node's child nodes.
 * @param {object} collection The database collection to operate against.
 * @param {string} id The id of the node to get.
 * @returns {Promise<Array>} Resolves with an array of the node's children.
 * @export
 */
export async function getChildrenOfNodeWithId(collection, id) {
  if (!id) return [];

  log(`Getting child nodes of node with id ${id || '(empty)'}`);
  return (await collection.find({ parent: id })).toArray();
}

/**
 * Gets all nodes.
 * This is purely for debugging purposes and should not be used.
 * @param {object} collection The database collection to operate against.
 * @returns {Array<nodes>} All nodes in the database.
 * @export
 */
export async function getAllNodes(collection) {
  log('Getting all nodes');
  return collection.find();
}

/**
 * Creates a new MongoDB store.
 * @returns {Promise} Resolves once the new store has been created/initialized.
 * @export
 */
export default async function createStore({
  db = DEFAULT_DB_NAME,
  url = DEFAULT_DB_URL,
  collection = DEFAULT_DB_COLLECTION,
} = {}) {
  const client = await MongoClient.connect(url);

  const methods = {
    getAllNodes,
    upsertNodes,
    deleteNodes,
    getNodeWithId,
    getChildrenOfNodeWithId,
  };

  return Object.assign({ client },
    _.mapValues(methods, method => _.partial(method, client.db(db).collection(collection))),
  );
}
