const { EntitySchema } = require('typeorm');

const StockEntity = new EntitySchema({
    name: 'Stock',
    tableName: 'Stock',
    columns: {
        id: { primary: true, type: 'int', generated: true },
        name: { type: 'varchar' },
        ownerId: { type: 'int' },
        totalShares: { type: 'int', default: 0 },
        availableShares: { type: 'int', default: 0 },
        sharePrice: { type: 'bigint', nullable: true },
        isPublic: { type: 'boolean', default: false },
        listedAt: { type: 'datetime', nullable: true },
    },
});

module.exports = { StockEntity };
