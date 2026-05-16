const { EntitySchema } = require('typeorm');

const OwnedItemEntity = new EntitySchema({
    name: 'OwnedItem',
    tableName: 'OwnedItem',
    columns: {
        id: { primary: true, type: 'int', generated: true },
        userId: { type: 'int' },
        productId: { type: 'int', nullable: true },
        productName: { type: 'varchar', nullable: true },
        quantity: { type: 'int', default: 0 },
        originalTxId: { type: 'int', nullable: true },
        createdAt: { type: 'datetime', createDate: true },
    },
    relations: {
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: 'userId' },
            inverseSide: 'ownedItems',
        },
    },
});

module.exports = { OwnedItemEntity };
