import http from 'http';
import express from 'express';
import { expect } from 'chai';

import { memory as memoryStore } from '../src/stores';
import setup, { NodeFactory, stores } from '../src';

describe('Main Export', () => {
  it('Should export a function by default', () => {
    expect(setup).to.be.a('function');
  });

  it('Should a NodeFactory factory function', () => {
    expect(NodeFactory).to.be.a('function');
  });

  it('Should export all stores', () => {
    expect(stores).to.be.an('object');
    expect(stores.mongo).to.be.a('function');
  });

  describe('Default Export', () => {
    it('Should return a NodeFactory instance', async () => {
      const app = express();
      const httpServer = http.Server(app);
      const results = await setup({ httpServer, store: memoryStore });
      expect(results).to.be.an('object');
    });

    it('Should return a NodeFactory instance (defaulting store)', async () => {
      const app = express();
      const httpServer = http.Server(app);
      const results = await setup({ httpServer });
      expect(results).to.be.an('object');
    });

    it('Should return a NodeFactory instance (no options)', async () => {
      try {
        await setup();
      } catch (e) {
        expect(e.message).to.equal('Cannot serve sockets, no http server supplied');
        return;
      }

      throw new Error('Expected test to throw...');
    });
  });
});
