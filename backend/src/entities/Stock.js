const { EntitySchema } = require('typeorm');
const { bigIntTransformer } = require('./transformers');

const StockEntity = new EntitySchema({
  name: 'Stock',
  tableName: 'Stock',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    name: { type: 'varchar' },
    ownerId: { type: 'int' },
    totalShares: { type: 'int' },
    availableShares: { type: 'int' },
    sharePrice: { type: 'bigint', transformer: bigIntTransformer },
    isPublic: { type: 'boolean', default: false },
    listedAt: { type: 'datetime', nullable: true },
  },
  relations: {
    owner: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'ownerId' },
      inverseSide: 'stocksOwned',
    },
    holdings: { type: 'one-to-many', target: 'ShareOwnership', inverseSide: 'stock' },
  },
});

module.exports = { StockEntity };
