const { EntitySchema } = require('typeorm');
const { bigIntTransformer } = require('./transformers');

const MiningLogEntity = new EntitySchema({
  name: 'MiningLog',
  tableName: 'MiningLog',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    baitulMalId: { type: 'int' },
    goldExtracted: { type: 'bigint', default: 0, transformer: bigIntTransformer },
    oilExtracted: { type: 'double', default: 0.0 },
    gasExtracted: { type: 'double', default: 0.0 },
    createdAt: { type: 'datetime', createDate: true },
  },
  relations: {
    baitulMal: {
      type: 'many-to-one',
      target: 'BaitulMal',
      joinColumn: { name: 'baitulMalId' },
      inverseSide: 'miningLogs',
    },
  },
});

module.exports = { MiningLogEntity };
