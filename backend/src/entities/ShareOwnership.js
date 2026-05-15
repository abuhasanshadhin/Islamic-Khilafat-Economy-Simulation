const { EntitySchema } = require('typeorm');

const ShareOwnershipEntity = new EntitySchema({
  name: 'ShareOwnership',
  tableName: 'ShareOwnership',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    stockId: { type: 'int' },
    userId: { type: 'int' },
    shares: { type: 'int' },
  },
  relations: {
    stock: {
      type: 'many-to-one',
      target: 'Stock',
      joinColumn: { name: 'stockId' },
      inverseSide: 'holdings',
    },
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'userId' },
      inverseSide: 'shareHoldings',
    },
  },
  uniques: [{ columns: ['stockId', 'userId'] }],
});

module.exports = { ShareOwnershipEntity };
