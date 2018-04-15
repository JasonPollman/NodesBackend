import uuid from 'uuid/v4';
import { EventEmitter } from 'events';

import { stub } from 'sinon';
import { expect } from 'chai';
import { memory as memoryStore } from '../src/stores';

import {
  ROOT_NODE_ID,
  SOCKET_EVENTS,
} from '../src/constants';

import setupWebsocketEvents, {
  handleNodeEventError,
  broadcastNodeUpdateEvent,
  createBroadcastHandler,
  initializeSocket,
} from '../src/events';

describe('Socket Events', () => {
  it('Should export a function by default', () => {
    expect(setupWebsocketEvents).to.be.a('function');
  });

  it('Should add all listeners to the given socket instance', (done) => {
    const consoleStub = stub(console, 'log');

    try {
      const nodes = { getAllNodes: () => [1, 2, 3] };
      const method = setupWebsocketEvents(nodes);
      const websockets = new EventEmitter();
      const socket = new EventEmitter();

      method(websockets, socket);

      socket.on(SOCKET_EVENTS.DUMP, (data) => {
        expect(data).to.to.equal(undefined);
        done();
      });

      socket.emit(SOCKET_EVENTS.DUMP);
      expect(consoleStub.calledOnce).to.equal(true);
      expect(consoleStub.getCall(0).args).to.equal([[1, 2, 3]]);
    } finally {
      consoleStub.restore();
    }
  });

  it('Should add all listeners to the given socket instance (broadcast event)', (done) => {
    const id = uuid();

    const nodes = {
      upsertNodes: data => [{ ...data[0], id }],
      getExpandedRootNode: (nodeId) => {
        expect(nodeId).to.equal(ROOT_NODE_ID);
        return { id: ROOT_NODE_ID, value: 'root node' };
      },
    };

    const method = setupWebsocketEvents(nodes);
    const websockets = new EventEmitter();
    const socket = new EventEmitter();

    method(websockets, socket);
    websockets.on(`${SOCKET_EVENTS.NODE_WAS_UPDATED}:${ROOT_NODE_ID}`, (result) => {
      expect(result).to.eql({ id: ROOT_NODE_ID, value: 'root node' });
      done();
    });

    socket.emit('upsertNodes', [{ value: 5, parent: ROOT_NODE_ID, type: 'factory' }]);
  });

  describe('handleNodeEventError', () => {
    it('Should call `socket.emit` with the "node error" event', (done) => {
      const socket = new EventEmitter();

      socket.on(SOCKET_EVENTS.ERROR, ({ event, error }) => {
        expect(event).to.equal('foo');
        expect(error).to.equal('oops...');
        done();
      });

      handleNodeEventError(socket, 'foo', new Error('oops...'));
    });
  });

  describe('broadcastNodeUpdateEvent', () => {
    it('Should send an update to all parents of nodes that were updated', async () => {
      const websockets = new EventEmitter();
      const socket = new EventEmitter();

      const node = {
        id: uuid(),
        type: 'factory',
        value: 'node',
        parent: ROOT_NODE_ID,
      };

      const child = {
        id: uuid(),
        type: 'number',
        value: 1234,
        parent: node.id,
      };

      await memoryStore.upsertNodes([node, child]);

      const nodes = {
        getExpandedNodeWithId: () => ({ ...node, children: [child] }),
      };

      const results = [child];
      const key = `${SOCKET_EVENTS.NODE_WAS_UPDATED}:${node.id}`;
      const promise = new Promise(resolve => websockets.on(key, (expandedNode, summary) => {
        expect(summary).to.equal('summary');
        expect(expandedNode).to.eql({
          ...node,
          children: [
            {
              ...child,
            },
          ],
        });

        resolve();
      }));

      await broadcastNodeUpdateEvent(websockets, socket, nodes, results, 'summary');
      await promise;
    });

    it('Should send an update to all parents of nodes that were updated (child of root)', async () => {
      const websockets = new EventEmitter();
      const socket = new EventEmitter();

      const node = {
        id: uuid(),
        type: 'factory',
        value: 'node',
        parent: ROOT_NODE_ID,
      };

      const root = {
        id: ROOT_NODE_ID,
        type: 'root',
        value: 'root',
        children: [node],
      };

      await memoryStore.upsertNodes([node]);

      const nodes = {
        getExpandedRootNode: () => root,
      };

      const results = [node];
      const key = `${SOCKET_EVENTS.NODE_WAS_UPDATED}:${root.id}`;
      const promise = new Promise(resolve => websockets.on(key, (expandedNode, summary) => {
        expect(summary).to.equal('summary');
        expect(expandedNode).to.eql({
          ...root,
          children: [
            {
              ...node,
            },
          ],
        });

        resolve();
      }));

      await broadcastNodeUpdateEvent(websockets, socket, nodes, results, 'summary');
      await promise;
    });
  });

  describe('createBroadcastHandler', () => {
    it('Should return a function', () => {
      expect(createBroadcastHandler()).to.be.a('function');
    });

    it('Should call the handler and then broadcast the update event to all parents', async () => {
      const websockets = new EventEmitter();
      const socket = new EventEmitter();

      const node = {
        id: uuid(),
        type: 'factory',
        value: 'node',
        parent: ROOT_NODE_ID,
      };

      const root = {
        id: ROOT_NODE_ID,
        type: 'root',
        value: 'root',
        children: [node],
      };


      const handler = (data) => {
        expect(data).to.eql({ foo: 'bar' });
        return [node];
      };

      const nodes = {
        getExpandedRootNode: () => root,
      };

      const key = `${SOCKET_EVENTS.NODE_WAS_UPDATED}:${root.id}`;
      const promise = new Promise(resolve => websockets.on(key, (expandedNode, summary) => {
        expect(summary).to.equal('summary');
        expect(expandedNode).to.eql({
          ...root,
          children: [
            {
              ...node,
            },
          ],
        });

        resolve();
      }));

      const method = createBroadcastHandler(nodes, websockets, socket, handler, 'upsertNodes');
      await method({ foo: 'bar' }, 'summary');
      await promise;
    });

    it('Should emit an error to the socket if something goes wrong in the handler', async () => {
      const websockets = new EventEmitter();
      const socket = new EventEmitter();

      const node = {
        id: uuid(),
        type: 'factory',
        value: 'node',
        parent: ROOT_NODE_ID,
      };

      const root = {
        id: ROOT_NODE_ID,
        type: 'root',
        value: 'root',
        children: [node],
      };


      const handler = (data) => {
        expect(data).to.eql({ foo: 'bar' });
        throw new Error('oops...');
      };

      const nodes = {
        getExpandedRootNode: () => root,
      };

      const promise = new Promise(resolve => socket.on(SOCKET_EVENTS.ERROR, (data) => {
        expect(data).to.eql({
          event: 'upsertNodes',
          error: 'oops...',
        });

        resolve();
      }));

      const method = createBroadcastHandler(nodes, websockets, socket, handler, 'upsertNodes');
      await method({ foo: 'bar' }, 'summary');
      await promise;
    });
  });

  describe('initializeSocket', () => {
    it('Should send back an initial tree when the client initializes', async () => {
      let addedListener = false;
      let emitted = false;

      const nodes = { getExpandedRootNode: () => 'tree' };

      const socket = {
        on(event, listener) {
          expect(event).to.equal(SOCKET_EVENTS.INIT);
          expect(listener).to.be.a('function');
          this.listener = listener;
          addedListener = true;
        },
        emit(event) {
          expect(event).to.equal(SOCKET_EVENTS.INIT);
          emitted = true;
          return 'tree';
        },
      };

      initializeSocket(socket, nodes);
      await socket.listener();

      expect(addedListener).to.equal(true);
      expect(emitted).to.equal(true);
    });
  });
});
