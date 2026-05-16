const { EntitySchema } = require('typeorm');
const { bigIntTransformer } = require('./transformers');

const SaleLogEntity = new EntitySchema({
    name: 'SaleLog',
    tableName: 'SaleLog',
    columns: {
        id: { primary: true, type: 'int', generated: true },
        sellerId: { type: 'int', nullable: true },
        buyerId: { type: 'int', nullable: true },
        productId: { type: 'int', nullable: true },
        ownedItemId: { type: 'int', nullable: true },
        action: { type: 'enum', enum: ['PURCHASED', 'LISTED', 'SOLD', 'CANCELLED'] },
        price: { type: 'bigint', nullable: true, transformer: bigIntTransformer },
        quantity: { type: 'int', nullable: true },
        txId: { type: 'int', nullable: true },
        timestamp: { type: 'datetime', createDate: true },
    },
});

module.exports = { SaleLogEntity };
