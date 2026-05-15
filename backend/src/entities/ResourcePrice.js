const { EntitySchema } = require('typeorm');

const ResourcePriceEntity = new EntitySchema({
  name: 'ResourcePrice',
  tableName: 'ResourcePrice',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    resource: { type: 'enum', enum: ['GOLD', 'OIL', 'GAS'], unique: true },
    priceInGoldMg: { type: 'double' },
    updatedAt: { type: 'datetime', updateDate: true },
  },
});

module.exports = { ResourcePriceEntity };
