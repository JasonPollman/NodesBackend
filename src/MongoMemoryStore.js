/**
 * Handles node CRUD operations.
 * @since 4/9/18
 * @file
 */

import _ from 'lodash';
import debug from 'debug';
import { MongoClient } from 'mongodb';

import {
  DEFAULT_DB_URL,
  DEFAULT_DB_NAME,
  DEFAULT_DB_COLLECTION,
} from './constants';

const log = debug('node-factory:store');
const MongoConnect = Promise.promisify(MongoClient.connect, { context: MongoClient });

/**
 * Stores a in-memory copy of the node data.
 * This will significantly reduce database calls and reduce node fetch time.
 * @type {Map}
 */
export const data = new Map();

/**
 * Sets a new node in memory for quick retrieval and persists it to the database.
 * @param {string} id The node's id.
 * @param {object} node The node data to set in the store.
 * @export
 */
async function set(collection, id, node) {
  log('SET', node);

  return collection
    .updateAsync({ id }, { $set: node }, { upsert: true })
    .then(() => data.set(id, node));
}

/**
 * Fetches a node by id.
 * @param {string} id The id of the node to get.
 * @export
 */
async function get(collection, id) {
  log('GET', id);
  return data.get(id);
}

/**
 * Determines if a node exists.
 * @param {string} id The id of the node to get.
 * @export
 */
async function has(collection, id) {
  log('GET', id);
  return data.has(id);
}

/**
 * Deletes a node.
 * @param {string} id The id of the node to delete.
 * @export
 */
async function del(collection, id) {
  log('DEL', id);

  return collection
    .deleteOneAsync({ id })
    .then(() => data.delete(id));
}

/**
 * Creates a new "Mongo-Memory"  store.
 * @returns {Promise} Resolves once the new store has been created/initialized.
 * @export
 */
export default async function createStore({
  db = DEFAULT_DB_NAME,
  url = DEFAULT_DB_URL,
  collection = DEFAULT_DB_COLLECTION,
} = {}) {
  log('Initializing Store...');

  // Create the necessary Mongo connection
  const client = await MongoConnect(url);
  const databaseCollection = Promise.promisifyAll(client.db(db).collection(collection));

  // Prime the in-memory store
  const cursor = await databaseCollection.findAsync();
  const fields = await cursor.toArray();
  _.each(fields, field => data.set(field.id, _.omit(field, ['_id'])));

  // Create partials from each method
  // with the selected collection.
  const methods = {
    has,
    get,
    set,
    del,
  };

  return Object.assign({ client, data },
    _.mapValues(methods, method => _.partial(method, databaseCollection)),
  );
}
