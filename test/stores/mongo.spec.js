import _ from 'lodash';
import { expect } from 'chai';

import createStore, {
  upsertNodes,
  deleteNodes,
  getNodeWithId,
  getChildrenOfNodeWithId,
  getAllNodes,
} from '../../src/stores/mongo';

describe('Mongo Store', () => {
  describe('upsertNodes', () => {
    it('Should call `collection.bulkWrite` with the given nodes', async () => {
      const bulkWrite = async (data) => {
        expect(data).to.eql([
          {
            updateOne: {
              filter: { id: 'id' },
              update: { $set: { id: 'id', value: 'value' } },
              upsert: true,
            },
          },
        ]);
        return true;
      };

      expect(await upsertNodes({ bulkWrite }, [{ id: 'id', value: 'value' }])).to.equal(true);
    });
  });

  describe('deleteNodes', () => {
    it('Should call `collection.bulkWrite` with the given nodes', async () => {
      const bulkWrite = async (data) => {
        expect(data).to.eql([
          {
            deleteOne: {
              filter: { id: 'id' },
            },
          },
        ]);
        return true;
      };

      expect(await deleteNodes({ bulkWrite }, [{ id: 'id', value: 'value' }])).to.equal(true);
    });
  });

  describe('getNodeWithId', () => {
    it('Should call `collection.findOne` with the given id', async () => {
      const findOne = (data) => {
        expect(data).to.eql({ id: 5 });
        return true;
      };

      expect(await getNodeWithId({ findOne }, 5)).to.equal(true);
    });

    it('Should return `null` if no id is passed', async () => {
      expect(await getNodeWithId({}, null)).to.equal(null);
    });
  });

  describe('getChildrenOfNodeWithId', () => {
    it('Should call `collection.find` with the given id', async () => {
      const find = (data) => {
        expect(data).to.eql({ parent: 5 });
        return { toArray: _.stubTrue };
      };

      expect(await getChildrenOfNodeWithId({ find }, 5)).to.equal(true);
    });

    it('Should return an empty array if no id is passed', async () => {
      expect(await getChildrenOfNodeWithId({}, null)).to.eql([]);
    });
  });

  describe('getAllNodes', () => {
    it('Should call `collection.find`', async () => {
      const find = () => ({ toArray: _.stubTrue });
      expect(await getAllNodes({ find }, 5)).to.equal(true);
    });
  });

  describe('Default Export', () => {
    it('Should return a partialized version of the store bound to the given options', async () => {
      const driver = await createStore();
      expect(driver).to.have.all.keys([
        'client',
        'deleteNodes',
        'getAllNodes',
        'getChildrenOfNodeWithId',
        'getNodeWithId',
        'upsertNodes',
      ]);
    });
  });
});
