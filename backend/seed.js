require('reflect-metadata');
require('dotenv/config');
const bcrypt = require('bcrypt');
const { AppDataSource } = require('./src/data-source');
const { UserEntity } = require('./src/entities/User');
const { BaitulMalEntity } = require('./src/entities/BaitulMal');
const { ProductEntity } = require('./src/entities/Product');
const { StockEntity } = require('./src/entities/Stock');
const { ShareOwnershipEntity } = require('./src/entities/ShareOwnership');
const { ReportEntity } = require('./src/entities/Report');
const { TransactionEntity } = require('./src/entities/Transaction');
const { ResourcePriceEntity } = require('./src/entities/ResourcePrice');
const { MiningLogEntity } = require('./src/entities/MiningLog');

async function seed() {
    await AppDataSource.initialize();
    console.log('Connected to database for seeding.');

    const clearOrder = [
        TransactionEntity,
        ShareOwnershipEntity,
        ReportEntity,
        ProductEntity,
        StockEntity,
        MiningLogEntity,
        ResourcePriceEntity,
        UserEntity,
        BaitulMalEntity,
    ];

    try {
        await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const entity of clearOrder) {
            await AppDataSource.getRepository(entity).clear();
        }
    } finally {
        await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    const usersData = [
        {
            username: 'khalifa',
            email: 'khalifa@example.com',
            password: 'khalifa123',
            goldBalance: 120000n,
            reputationScore: 95,
            role: 'KHALIFA',
            isZakatEligible: true,
        },
        {
            username: 'shura',
            email: 'shura@example.com',
            password: 'shura123',
            goldBalance: 80000n,
            reputationScore: 80,
            role: 'SHURA',
            isZakatEligible: true,
        },
        {
            username: 'muhtasib',
            email: 'muhtasib@example.com',
            password: 'muhtasib123',
            goldBalance: 70000n,
            reputationScore: 70,
            role: 'MUHTASIB',
            isZakatEligible: true,
        },
        {
            username: 'merchant',
            email: 'merchant@example.com',
            password: 'merchant123',
            goldBalance: 50000n,
            reputationScore: 55,
            role: 'USER',
            isZakatEligible: true,
        },
        {
            username: 'buyer',
            email: 'buyer@example.com',
            password: 'buyer123',
            goldBalance: 40000n,
            reputationScore: 45,
            role: 'USER',
            isZakatEligible: true,
        },
        {
            username: 'critic',
            email: 'critic@example.com',
            password: 'critic123',
            goldBalance: 15000n,
            reputationScore: 30,
            role: 'USER',
            isZakatEligible: false,
        },
    ];

    const hashedUsers = [];
    for (const userData of usersData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await AppDataSource.getRepository(UserEntity).save({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            goldBalance: userData.goldBalance,
            reputationScore: userData.reputationScore,
            role: userData.role,
            isZakatEligible: userData.isZakatEligible,
        });
        hashedUsers.push(user);
    }

    const [khalifaUser, shuraUser, merchantUser, buyerUser, criticUser] = hashedUsers;

    const baitulMal = await AppDataSource.getRepository(BaitulMalEntity).save({
        goldReserve: 180000n,
        oilReserve: 6200.0,
        gasReserve: 3200.0,
        totalZakatCollected: 0n,
    });

    await AppDataSource.getRepository(ResourcePriceEntity).save([
        { resource: 'GOLD', priceInGoldMg: 1.0 },
        { resource: 'OIL', priceInGoldMg: 100.0 },
        { resource: 'GAS', priceInGoldMg: 80.0 },
    ]);

    const products = [
        {
            name: 'Gold-plated lantern',
            description: 'Handcrafted lantern with gold accents for community gatherings.',
            price: 1200n,
            stock: 22,
            ownerId: merchantUser.id,
        },
        {
            name: 'Organic date bundle',
            description: 'Premium dates harvested from local farms.',
            price: 650n,
            stock: 40,
            ownerId: shuraUser.id,
        },
        {
            name: 'Silk prayer robe',
            description: 'High-quality silk robe with elegant embroidery.',
            price: 2800n,
            stock: 8,
            ownerId: merchantUser.id,
        },
    ];

    await AppDataSource.getRepository(ProductEntity).save(products);

    const farmStock = await AppDataSource.getRepository(StockEntity).save({
        name: 'Sana Farms',
        ownerId: merchantUser.id,
        totalShares: 1000,
        availableShares: 900,
        sharePrice: 1500n,
        isPublic: true,
        listedAt: new Date(),
    });

    await AppDataSource.getRepository(ShareOwnershipEntity).save({
        stockId: farmStock.id,
        userId: buyerUser.id,
        shares: 100,
    });

    await AppDataSource.getRepository(ReportEntity).save([
        {
            reporterId: criticUser.id,
            accusedId: merchantUser.id,
            reason: 'Overcharging and delaying shipment of goods.',
            status: 'OPEN',
        },
        {
            reporterId: buyerUser.id,
            accusedId: shuraUser.id,
            reason: 'Unfair marketplace policies hurting smaller sellers.',
            status: 'OPEN',
        },
    ]);

    await AppDataSource.getRepository(TransactionEntity).save([
        {
            senderId: buyerUser.id,
            receiverId: merchantUser.id,
            amount: 2500n,
            type: 'TRADE',
        },
        {
            senderId: khalifaUser.id,
            receiverId: buyerUser.id,
            amount: 10000n,
            type: 'TRANSFER',
        },
        {
            senderId: khalifaUser.id,
            receiverId: criticUser.id,
            amount: 5000n,
            type: 'GRANT',
        },
    ]);

    await AppDataSource.getRepository(MiningLogEntity).save({
        baitulMalId: baitulMal.id,
        goldExtracted: 10000n,
        oilExtracted: 250.0,
        gasExtracted: 170.0,
    });

    console.log('Seed data created successfully.');
    console.log('Available users:');
    console.log(hashedUsers.map(user => ({ username: user.username, email: user.email, password: usersData.find(u => u.email === user.email).password })));
    console.log('Run the app and log in with one of the seeded accounts.');
}

seed()
    .catch((err) => {
        console.error('Seeding failed:', err);
        process.exit(1);
    })
    .finally(() => {
        if (AppDataSource.isInitialized) {
            AppDataSource.destroy().catch(() => { });
        }
    });
