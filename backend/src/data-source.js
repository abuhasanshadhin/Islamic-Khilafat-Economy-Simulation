require('reflect-metadata');
const { DataSource } = require('typeorm');
const { UserEntity } = require('./entities/User');
const { BaitulMalEntity } = require('./entities/BaitulMal');
const { ProductEntity } = require('./entities/Product');
const { MiningLogEntity } = require('./entities/MiningLog');
const { ReportEntity } = require('./entities/Report');
const { TransactionEntity } = require('./entities/Transaction');
const { ResourcePriceEntity } = require('./entities/ResourcePrice');
const { StockEntity } = require('./entities/Stock');
const { ShareOwnershipEntity } = require('./entities/ShareOwnership');

const AppDataSource = new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [
    UserEntity,
    BaitulMalEntity,
    ProductEntity,
    MiningLogEntity,
    ReportEntity,
    TransactionEntity,
    ResourcePriceEntity,
    StockEntity,
    ShareOwnershipEntity,
  ],
  synchronize: true,
  logging: false,
});

module.exports = { AppDataSource };
