import { assert, expect } from 'chai';
import serve, { onNewSocketConnection } from '../src/websockets';

describe('Websockets Export', () => {
  describe('onNewSocketConnection', () => {
    expect(onNewSocketConnection()).to.equal(undefined);
  });

  describe('serve', () => {
    it('Should throw if no httpServer is given', () => {
      assert.throws(
        () => serve(),
        'Cannot serve sockets, no http server supplied',
      );
    });

    it('Should return the websockets instance', (done) => {
      serve({ httpServer: {}, onSocketConnection: () => done() }).emit('connection');
    });
  });
});
