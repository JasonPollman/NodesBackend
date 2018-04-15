/**
 * The in-memory driver for node CRUD operations.
 * This is used for testing purposes only.
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

const data = new Map();

export default {
  data,
  getAllNodes: async () => Array.from(data.values()),
  upsertNodes: async nodes => _.each(nodes, node => data.set(node.id, node)),
  deleteNodes: async nodes => _.each(nodes, node => data.delete(node.id, node)),
  getNodeWithId: async id => data.get(id) || null,
  getChildrenOfNodeWithId: async (id) => {
    const children = [];

    Array.from(data.values()).forEach((node) => {
      if (node.parent === id) children.push(node);
    });

    return children;
  },
};
