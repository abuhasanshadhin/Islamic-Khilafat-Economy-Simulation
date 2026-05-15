const { EntitySchema } = require('typeorm');
const { bigIntTransformer } = require('./transformers');

const BaitulMalEntity = new EntitySchema({
  name: 'BaitulMal',
  tableName: 'BaitulMal',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    goldReserve: { type: 'bigint', default: 0, transformer: bigIntTransformer },
    oilReserve: { type: 'double', default: 0.0 },
    gasReserve: { type: 'double', default: 0.0 },
    totalZakatCollected: { type: 'bigint', default: 0, transformer: bigIntTransformer },
  },
  relations: {
    miningLogs: { type: 'one-to-many', target: 'MiningLog', inverseSide: 'baitulMal' },
  },
});

module.exports = { BaitulMalEntity };
