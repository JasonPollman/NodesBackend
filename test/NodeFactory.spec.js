import _ from 'lodash';
import uuid from 'uuid/v4';
import LRUCache from 'lru-cache';

import { expect, assert } from 'chai';
import { memory as memoryStore } from '../src/stores';
import { ROOT_NODE_ID } from '../src/constants';

import NodeFactory, {
  isLeafNode,
  upsertNodes,
  deleteNodes,
  getAllNodes,
  getExpandedRootNode,
  getCachedNodeOrFetch,
  validateAndFormatNode,
  getExpandedNodeWithId,
  prepareNodeForUpsertion,
  getNodeAndTransitiveChildren,
} from '../src/NodeFactory';

describe('NodeFactory', () => {
  let cache;

  beforeEach(() => {
    cache = new LRUCache();
    memoryStore.data.clear();
  });

  describe('Default Export', () => {
    it('Should return the proper interface when called', () => {
      expect(NodeFactory({ cache, store: memoryStore })).to.have.all.keys([
        'compositeAction',
        'deleteNodes',
        'upsertNodes',
        'getAllNodes',
        'getExpandedRootNode',
        'getExpandedNodeWithId',
      ]);
    });

    describe('Composite Actions', () => {
      it('Should perform composite actions', async () => {
        const instance = NodeFactory({ cache, store: memoryStore });

        const actions = [
          {
            event: 'upsertNodes',
            args: [[{
              value: 'foo',
              type: 'factory',
              parent: ROOT_NODE_ID,
            }]],
          },
          {
            event: 'upsertNodes',
            args: [[{
              value: 'foo',
              type: 'factory',
              parent: ROOT_NODE_ID,
            }]],
          },
        ];

        expect(memoryStore.data.size).to.equal(0);
        expect(cache.length).to.equal(0);

        const results = await instance.compositeAction(actions);
        expect(results.length).to.equal(2);

        expect(memoryStore.data.size).to.equal(2);
        expect(cache.length).to.equal(2);
      });
    });
  });

  describe('isLeafNode', () => {
    it('Should determine in a node is a leaf node based on the node type', () => {
      expect(isLeafNode({})).to.equal(false);
      expect(isLeafNode({ type: 'root' })).to.equal(false);
      expect(isLeafNode({ type: 'factory' })).to.equal(false);
      expect(isLeafNode({ type: 'number' })).to.equal(true);
    });
  });

  describe('getCachedNodeOrFetch', () => {
    it('Should fetch the node from the store if the node isn\'t cached', async () => {
      const store = {
        getNodeWithId: async (id) => {
          expect(id).to.equal('1234');
          return 'node';
        },
      };

      expect(await getCachedNodeOrFetch(new Map(), store, '1234')).to.equal('node');
    });

    it('Should fetch the node from the cache if the node is cached', async () => {
      const store = {
        getNodeWithId: async () => {
          throw new Error('Expected node to come from cache!');
        },
      };

      const localCache = new Map([
        ['4567', 'cached'],
      ]);

      expect(await getCachedNodeOrFetch(localCache, store, '4567')).to.equal('cached');
    });
  });

  describe('validateAndFormatNode', () => {
    it('Should throw if the node doesn\'t have the proper fields (missing id)', () => {
      assert.throws(
        () => validateAndFormatNode({}),
        'Node "id" property must be a valid v4 UUID.',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (bad id)', () => {
      assert.throws(
        () => validateAndFormatNode({ id: 7 }),
        'Node "id" property must be a valid v4 UUID.',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (no type)', () => {
      assert.throws(
        () => validateAndFormatNode({ id: uuid() }),
        'Node "type" property must be one of [root, factory, number].',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (bad type)', () => {
      assert.throws(
        () => validateAndFormatNode({ id: uuid(), type: 'whatever' }),
        'Node "type" property must be one of [root, factory, number].',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (missing parent)', () => {
      assert.throws(
        () => validateAndFormatNode({ id: uuid(), type: 'factory' }),
        'Node "parent" property must be a valid v4 UUID.',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (bad parent)', () => {
      assert.throws(
        () => validateAndFormatNode({ id: uuid(), type: 'factory', parent: 'foo' }),
        'Node "parent" property must be a valid v4 UUID.',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (missing value)', () => {
      assert.throws(
        () => validateAndFormatNode({ id: uuid(), type: 'factory', parent: uuid() }),
        'Node "value" property is invalid.',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (bad value for type factory)', () => {
      assert.throws(
        () => validateAndFormatNode({
          id: uuid(),
          type: 'factory',
          parent: uuid(),
          value: 7,
        }),
        'Node "value" property is invalid.',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (bad value for type root)', () => {
      assert.throws(
        () => validateAndFormatNode({
          id: uuid(),
          type: 'root',
          parent: uuid(),
          value: 7,
        }),
        'Node "value" property is invalid.',
      );
    });

    it('Should throw if the node doesn\'t have the proper fields (bad value for type number)', () => {
      assert.throws(
        () => validateAndFormatNode({
          id: uuid(),
          type: 'number',
          parent: uuid(),
          value: 'string',
        }),
        'Node "value" property is invalid.',
      );
    });

    it('Should not throw if the node passes all validation checks', () => {
      const node = {
        id: uuid(),
        type: 'factory',
        parent: uuid(),
        value: 'factory node',
      };

      expect(validateAndFormatNode(node)).to.eql(node);
    });

    it('Should remove extraneous node properties', () => {
      const node = {
        id: uuid(),
        type: 'factory',
        parent: uuid(),
        value: 'factory node',
        foo: 'bar',
      };

      expect(validateAndFormatNode(node)).to.eql(_.omit(node, ['foo']));
    });
  });

  describe('prepareNodeForUpsertion', () => {
    beforeEach(() => {

    });

    it('Should throw if given a non-plain-object', async () => {
      try {
        await prepareNodeForUpsertion({});
      } catch (e) {
        expect(e.message).to.equal('Upsert expected an object for a node.');
        return;
      }

      throw new Error('Expected test to throw...');
    });

    it('Should validate and format the node (node exists, nothing changed)', async () => {
      const id = uuid();
      const parentID = uuid();

      const node = {
        id,
        type: 'factory',
        parent: parentID,
        value: 'factory node',
      };

      const parent = {
        id: parentID,
        type: 'factory',
        parent: uuid(),
        value: 'factory node',
      };

      expect(cache.get(parent)).to.equal(undefined);
      expect(cache.get(id)).to.equal(undefined);

      cache.set(parent.id, parent);
      cache.set(node.id, node);
      expect(await prepareNodeForUpsertion({ store: memoryStore, cache }, node)).to.eql(null);
    });

    it('Should validate and format the node (node exists, data changed)', async () => {
      const id = uuid();
      const parentID = uuid();

      const node = {
        id,
        type: 'factory',
        parent: parentID,
        value: 'factory node',
      };

      const parent = {
        id: parentID,
        type: 'factory',
        parent: uuid(),
        value: 'factory node',
      };

      expect(cache.get(parent)).to.equal(undefined);
      expect(cache.get(id)).to.equal(undefined);

      cache.set(parent.id, parent);
      cache.set(node.id, node);
      expect(await prepareNodeForUpsertion({ store: memoryStore, cache }, { id, value: 'new value' })).to.eql({
        ...node,
        value: 'new value',
      });
    });

    it('Should validate and format the node (node doesn\'t exist)', async () => {
      const parentID = uuid();

      const node = {
        type: 'factory',
        parent: parentID,
        value: 'factory node',
      };

      const parent = {
        id: parentID,
        type: 'factory',
        parent: uuid(),
        value: 'factory node',
      };

      expect(cache.get(parent)).to.equal(undefined);

      cache.set(parent.id, parent);
      const results = await prepareNodeForUpsertion({ store: memoryStore, cache }, node);
      expect(_.omit(results, ['id'])).to.eql(node);
      expect(results.id).to.be.a('string');
    });

    it('Should throw if the parent of the node to upsert doesn\'t exist', async () => {
      const parentID = uuid();

      const node = {
        type: 'factory',
        parent: parentID,
        value: 'factory node',
      };

      const parent = {
        id: parentID,
        type: 'factory',
        parent: uuid(),
        value: 'factory node',
      };

      expect(cache.get(parent)).to.equal(undefined);

      try {
        await prepareNodeForUpsertion({ store: memoryStore, cache }, node);
      } catch (e) {
        expect(e.message).to.equal('Cannot upsert node, since its parent node doesn\'t exist.');
        return;
      }

      throw new Error('Expected test to throw');
    });
  });

  describe('getNodeAndTransitiveChildren', () => {
    it('Should return the node and all it\'s transitive children as a flat array (cached)', async () => {
      const id = uuid();
      const childID = uuid();
      const parentID = uuid();

      const grandchild = {
        id: uuid(),
        type: 'factory',
        parent: id,
        value: 'grandchild',
      };

      const child = {
        id: childID,
        type: 'factory',
        parent: id,
        value: 'child',
        children: [grandchild],
      };

      const node = {
        id,
        type: 'factory',
        parent: parentID,
        value: 'node',
        children: [child],
      };

      cache.set(node.id, node);
      cache.set(child.id, child);
      cache.set(grandchild.id, grandchild);
      const results = await getNodeAndTransitiveChildren({ store: memoryStore, cache }, node);

      expect(results).to.eql([
        node,
        child,
        grandchild,
      ]);
    });

    it('Should return the node and all it\'s transitive children as a flat array (not cached)', async () => {
      const id = uuid();
      const childID = uuid();
      const parentID = uuid();

      const grandchild = {
        id: uuid(),
        type: 'factory',
        parent: childID,
        value: 'grandchild',
      };

      const child = {
        id: childID,
        type: 'factory',
        parent: id,
        value: 'child',
        children: [grandchild],
      };

      const node = {
        id,
        type: 'factory',
        parent: parentID,
        value: 'node',
        children: [child],
      };

      await memoryStore.upsertNodes([node, child, grandchild]);
      const results = await getNodeAndTransitiveChildren({ store: memoryStore, cache }, node);

      expect(results).to.eql([
        node,
        child,
        grandchild,
      ]);
    });

    it('Should return the node and all it\'s transitive children as a flat array (with leaf nodes)', async () => {
      const id = uuid();
      const childID = uuid();
      const parentID = uuid();

      const grandchild = {
        id: uuid(),
        type: 'number',
        parent: childID,
        value: 15,
      };

      const child = {
        id: childID,
        type: 'factory',
        parent: id,
        value: 'child',
        children: [grandchild],
      };

      const node = {
        id,
        type: 'factory',
        parent: parentID,
        value: 'node',
        children: [child],
      };

      await memoryStore.upsertNodes([node, child, grandchild]);
      const results = await getNodeAndTransitiveChildren({ store: memoryStore, cache }, node);

      expect(results).to.eql([
        node,
        child,
        grandchild,
      ]);
    });
  });

  describe('upsertNodes', () => {
    it('Should upsert the given nodes to the database and cache them', async () => {
      const nodes = [
        {
          type: 'factory',
          value: 'foo',
          parent: ROOT_NODE_ID,
        },
        {
          type: 'factory',
          value: 'bar',
          parent: ROOT_NODE_ID,
        },
        {
          type: 'factory',
          value: 'baz',
          parent: ROOT_NODE_ID,
        },
      ];

      const results = await upsertNodes({ store: memoryStore, cache }, nodes);
      const withoutIDs = _.map(results, node => _.omit(node, ['id']));
      expect(withoutIDs).to.eql(nodes);

      _.each(results, node => expect(cache.get(node.id)).to.eql({ ...node, children: [] }));

      await Promise.map(
        results,
        async node => expect(await memoryStore.getNodeWithId(node.id)).to.eql(node),
      );
    });

    it('Should throw if not given an array of nodes to upsert', async () => {
      try {
        await upsertNodes({ store: memoryStore, cache });
      } catch (e) {
        expect(e.message).to.eql('`upsertNodes` expected an array of nodes to upsert.');
        return;
      }

      throw new Error('Expected test to throw...');
    });

    it('Should return an empty array if there are no nodes to upsert (nothing changed)', async () => {
      const node = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
      };

      cache.set(node.id, node);
      expect(await upsertNodes({ store: memoryStore, cache }, [node])).to.eql([]);
    });

    it('Should return an empty array if there are no nodes to upsert (adding child node)', async () => {
      const node = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
        children: [],
      };

      cache.set(node.id, node);
      await memoryStore.upsertNodes([node]);

      const child = {
        type: 'factory',
        value: 'bar',
        parent: node.id,
      };

      const results = await upsertNodes({ store: memoryStore, cache }, [child]);
      expect(results.length).to.equal(1);

      expect(_.omit(results[0], ['id'])).to.eql(child);
      expect(_.omit(cache.get(node.id).children[0], ['id'])).to.eql({ ...child, children: [] });
      expect(cache.get(node.id).children[0].id).to.be.a('string');
    });

    it('Should return an empty array if there are no nodes to upsert (modifying child node)', async () => {
      const node = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
        children: [],
      };

      const child = {
        id: uuid(),
        type: 'factory',
        value: 'bar',
        parent: node.id,
      };

      cache.set(node.id, { ...node, children: [child] });
      await memoryStore.upsertNodes([node, child]);

      const results = await upsertNodes({ store: memoryStore, cache }, [{ ...child, value: 'modified' }]);
      expect(results.length).to.equal(1);

      expect(results[0]).to.eql({ ...child, value: 'modified' });
      expect(cache.get(node.id).children[0]).to.eql({ ...child, value: 'modified', children: [] });
      expect(cache.get(node.id).children[0].id).to.be.a('string');
      expect(cache.get(node.id).children[0].value).to.equal('modified');

      expect((await memoryStore.getNodeWithId(child.id)).value).to.equal('modified');
    });
  });

  describe('deleteNodes', () => {
    it('Should throw if not given an array', async () => {
      try {
        await deleteNodes({ store: memoryStore, cache });
      } catch (e) {
        expect(e.message).to.equal('`deleteNodes` requires an array of nodes to upsert.');
        return;
      }

      throw new Error('Expected test to throw...');
    });

    it('Should return an empty array if there\'s nothing to delete', async () => {
      expect(await deleteNodes({ store: memoryStore, cache }, [])).to.eql([]);
    });

    it('Should delete a node', async () => {
      const node = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
        children: [],
      };

      await memoryStore.upsertNodes([node]);
      cache.set(node.id, { ...node, children: [] });

      expect(memoryStore.data.size).to.equal(1);
      expect(cache.length).to.equal(1);

      const stored = Array.from(memoryStore.data.values())[0];
      expect(stored.id).to.be.a('string');
      expect(stored.type).to.equal('factory');
      expect(stored.value).to.equal('foo');
      expect(stored.parent).to.equal(ROOT_NODE_ID);

      const results = await deleteNodes({ store: memoryStore, cache }, [node]);
      expect(results).to.eql([node]);

      expect(results[0].id).to.be.a('string');
      expect(results[0].type).to.equal('factory');
      expect(results[0].value).to.equal('foo');
      expect(results[0].parent).to.equal(ROOT_NODE_ID);

      expect(memoryStore.data.size).to.equal(0);
      expect(cache.get(results.id)).to.equal(undefined);
    });

    it('Should delete a node and its children', async () => {
      const node = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
        children: [],
      };

      const child = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: node.id,
        children: [],
      };

      await memoryStore.upsertNodes([node, child]);
      cache.set(node.id, { ...node, children: [child] });
      cache.set(child.id, { ...child, children: [] });

      expect(memoryStore.data.size).to.equal(2);
      expect(cache.length).to.equal(2);

      const stored = Array.from(memoryStore.data.values())[0];
      expect(stored.id).to.be.a('string');
      expect(stored.type).to.equal('factory');
      expect(stored.value).to.equal('foo');
      expect(stored.parent).to.equal(ROOT_NODE_ID);

      const results = await deleteNodes({ store: memoryStore, cache }, [node]);
      expect(results).to.eql([{ ...node, children: [child] }]);

      expect(results.length).to.equal(1);
      expect(results[0].id).to.be.a('string');
      expect(results[0].type).to.equal('factory');
      expect(results[0].value).to.equal('foo');
      expect(results[0].parent).to.equal(ROOT_NODE_ID);

      expect(await memoryStore.getNodeWithId(node.id)).to.equal(null);
      expect(await memoryStore.getNodeWithId(child.id)).to.equal(null);

      expect(memoryStore.data.size).to.equal(0);
      expect(cache.get(results.id)).to.equal(undefined);
    });

    it('Should delete a child node and remove it from its parent\'s cache', async () => {
      const node = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
        children: [],
      };

      const child = {
        id: uuid(),
        type: 'factory',
        value: 'bar',
        parent: node.id,
        children: [],
      };

      await memoryStore.upsertNodes([node, child]);
      cache.set(node.id, { ...node, children: [child] });
      cache.set(child.id, { ...child, children: [] });

      expect(memoryStore.data.size).to.equal(2);
      expect(cache.length).to.equal(2);

      const stored = Array.from(memoryStore.data.values())[0];
      expect(stored.id).to.be.a('string');
      expect(stored.type).to.equal('factory');
      expect(stored.value).to.equal('foo');
      expect(stored.parent).to.equal(ROOT_NODE_ID);

      const results = await deleteNodes({ store: memoryStore, cache }, [child]);
      expect(results).to.eql([{ ...child, children: [] }]);

      expect(results.length).to.equal(1);
      expect(results[0].id).to.be.a('string');
      expect(results[0].type).to.equal('factory');
      expect(results[0].value).to.equal('bar');
      expect(results[0].parent).to.equal(node.id);

      expect(await memoryStore.getNodeWithId(node.id)).to.be.an('object');
      expect(await memoryStore.getNodeWithId(child.id)).to.equal(null);

      expect(memoryStore.data.size).to.equal(1);
      expect(cache.get(results.id)).to.equal(undefined);
    });
  });

  describe('getAllNodes', () => {
    it('Should get all nodes (empty)', async () => {
      expect(await getAllNodes({ store: memoryStore, cache })).to.eql([]);
    });

    it('Should get all nodes', async () => {
      expect(await getAllNodes({ store: memoryStore, cache })).to.eql([]);

      const node = {
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
        children: [],
      };

      await upsertNodes({ store: memoryStore, cache }, [node]);
      const results = await getAllNodes({ store: memoryStore, cache });
      expect(results.length).to.equal(1);
      expect(results[0].value).to.equal('foo');
    });
  });

  describe('getExpandedRootNode', () => {
    it('Should return the expanded root node (no children)', async () => {
      expect(await getExpandedRootNode({ store: memoryStore, cache })).to.eql({
        id: ROOT_NODE_ID,
        value: 'root',
        type: 'root',
        parent: null,
        children: [],
      });
    });

    it('Should return the expanded root node (with children)', async () => {
      const childA = {
        parent: ROOT_NODE_ID,
        id: uuid(),
        value: 2,
        type: 'number',
      };

      const childB = {
        parent: ROOT_NODE_ID,
        id: uuid(),
        value: 1,
        type: 'number',
      };

      memoryStore.upsertNodes([childA, childB]);
      expect(await getExpandedRootNode({ store: memoryStore, cache })).to.eql({
        id: ROOT_NODE_ID,
        value: 'root',
        type: 'root',
        parent: null,
        children: [childA, childB],
      });
    });
  });

  describe('getExpandedNodeWithId', () => {
    it('Should get an expanded node (with cache)', async () => {
      const node = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
        children: [],
      };

      const child = {
        id: uuid(),
        type: 'factory',
        value: 'bar',
        parent: node.id,
        children: [],
      };

      await memoryStore.upsertNodes([node, child]);
      cache.set(node.id, { ...node, children: [child] });
      cache.set(child.id, { ...child, children: [] });

      const results = await getExpandedNodeWithId({ store: memoryStore, cache }, node.id);
      expect(results).to.eql({
        ...node,
        children: [child],
      });
    });

    it('Should get an expanded node (no cache)', async () => {
      const node = {
        id: uuid(),
        type: 'factory',
        value: 'foo',
        parent: ROOT_NODE_ID,
        children: [],
      };

      const child = {
        id: uuid(),
        type: 'factory',
        value: 'bar',
        parent: node.id,
        children: [],
      };

      await memoryStore.upsertNodes([node, child]);

      const results = await getExpandedNodeWithId({ store: memoryStore, cache }, node.id);
      expect(results).to.eql({
        ...node,
        children: [child],
      });
    });

    it('Should return null if no such node exists', async () => {
      const results = await getExpandedNodeWithId({ store: memoryStore, cache }, '1234');
      expect(results).to.eql(null);
    });

    it('Should return null if no such node exists (bad id)', async () => {
      const results = await getExpandedNodeWithId({ store: memoryStore, cache }, {});
      expect(results).to.eql(null);
    });
  });
});
