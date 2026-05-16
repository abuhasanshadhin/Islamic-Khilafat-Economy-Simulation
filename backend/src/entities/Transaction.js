const { EntitySchema } = require('typeorm');
const { bigIntTransformer } = require('./transformers');

const TransactionEntity = new EntitySchema({
  name: 'Transaction',
  tableName: 'Transaction',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    senderId: { type: 'int', nullable: true },
    receiverId: { type: 'int', nullable: true },
    amount: { type: 'bigint', transformer: bigIntTransformer },
    type: { type: 'enum', enum: ['GRANT', 'TRANSFER', 'TRADE', 'ZAKAT'] },
    // Optional purchase metadata
    productId: { type: 'int', nullable: true },
    productName: { type: 'varchar', nullable: true },
    quantity: { type: 'int', nullable: true },
    timestamp: { type: 'datetime', createDate: true },
  },
  relations: {
    sender: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
      joinColumn: { name: 'senderId' },
      inverseSide: 'sentTransactions',
    },
    receiver: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
      joinColumn: { name: 'receiverId' },
      inverseSide: 'receivedTransactions',
    },
  },
});

module.exports = { TransactionEntity };
