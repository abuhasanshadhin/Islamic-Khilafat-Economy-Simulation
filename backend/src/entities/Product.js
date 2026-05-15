const { EntitySchema } = require('typeorm');
const { bigIntTransformer } = require('./transformers');

const ProductEntity = new EntitySchema({
  name: 'Product',
  tableName: 'Product',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    name: { type: 'varchar' },
    description: { type: 'varchar', nullable: true },
    price: { type: 'bigint', transformer: bigIntTransformer },
    stock: { type: 'int', default: 0 },
    ownerId: { type: 'int' },
  },
  relations: {
    owner: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'ownerId' },
      inverseSide: 'products',
    },
  },
});

module.exports = { ProductEntity };
