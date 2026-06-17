require('reflect-metadata');
const { DataSource } = require('typeorm');
const { UserEntity } = require('./entities/User');
const { BaitulMalEntity } = require('./entities/BaitulMal');
const { ProductEntity } = require('./entities/Product');
const { StockEntity } = require('./entities/Stock');
const { MiningLogEntity } = require('./entities/MiningLog');
const { ReportEntity } = require('./entities/Report');
const { TransactionEntity } = require('./entities/Transaction');
const { ResourcePriceEntity } = require('./entities/ResourcePrice');
const { PartnershipEntity } = require('./entities/Partnership');
const { ShareOwnershipEntity } = require('./entities/ShareOwnership');
const { OwnedItemEntity } = require('./entities/OwnedItem');
const { SaleLogEntity } = require('./entities/SaleLog');
const { ProposalEntity } = require('./entities/Proposal');
const { InvestigationNoteEntity } = require('./entities/InvestigationNote');

const AppDataSource = new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [
    UserEntity,
    BaitulMalEntity,
    ProductEntity,
    StockEntity,
    MiningLogEntity,
    ReportEntity,
    TransactionEntity,
    ResourcePriceEntity,
    PartnershipEntity,
    ShareOwnershipEntity,
    OwnedItemEntity,
    SaleLogEntity,
    ProposalEntity,
    InvestigationNoteEntity,
  ],
  synchronize: true,
  logging: false,
});

module.exports = { AppDataSource };
