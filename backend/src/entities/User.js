const { EntitySchema } = require('typeorm');
const { bigIntTransformer } = require('./transformers');

const UserEntity = new EntitySchema({
  name: 'User',
  tableName: 'User',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    username: { type: 'varchar', unique: true },
    email: { type: 'varchar', unique: true },
    password: { type: 'varchar' },
    goldBalance: { type: 'bigint', default: 0, transformer: bigIntTransformer },
    reputationScore: { type: 'int', default: 0 },
    isZakatEligible: { type: 'boolean', default: false },
    role: { type: 'enum', enum: ['USER', 'SHURA', 'KHALIFA', 'MUHTASIB'], default: 'USER' },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    sentTransactions: { type: 'one-to-many', target: 'Transaction', inverseSide: 'sender' },
    receivedTransactions: { type: 'one-to-many', target: 'Transaction', inverseSide: 'receiver' },
    products: { type: 'one-to-many', target: 'Product', inverseSide: 'owner' },
    stocksOwned: { type: 'one-to-many', target: 'Stock', inverseSide: 'owner' },
    shareHoldings: { type: 'one-to-many', target: 'ShareOwnership', inverseSide: 'user' },
    reportsMade: { type: 'one-to-many', target: 'Report', inverseSide: 'reporter' },
    reportsAgainst: { type: 'one-to-many', target: 'Report', inverseSide: 'accused' },
  },
});

module.exports = { UserEntity };
