const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Cleanup existing data (best-effort)
  await prisma.transaction.deleteMany().catch(()=>{});
  await prisma.miningLog.deleteMany().catch(()=>{});
  await prisma.product.deleteMany().catch(()=>{});
  await prisma.report.deleteMany().catch(()=>{});
  await prisma.user.deleteMany().catch(()=>{});
  await prisma.baitulMal.deleteMany().catch(()=>{});

  // Create BaitulMal with id 1
  const bait = await prisma.baitulMal.create({
    data: {
      id: 1,
      goldReserve: 1000000n, // 1,000,000 mg = 1kg
      oilReserve: 5000.0,
      gasReserve: 2000.0,
      totalZakatCollected: 0n
    }
  });
  console.log('Created BaitulMal:', bait.id);

  // Create users
  const saltRounds = 10;
  const users = [
    { username: 'khalifa', email: 'khalifa@example.com', password: 'khalifa-pass', role: 'KHALIFA', goldBalance: 500000n },
    { username: 'shura', email: 'shura@example.com', password: 'shura-pass', role: 'SHURA', goldBalance: 200000n },
    { username: 'user', email: 'user@example.com', password: 'user-pass', role: 'USER', goldBalance: 10000n }
  ];

  const createdUsers = [];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, saltRounds);
    const created = await prisma.user.create({ data: {
      username: u.username,
      email: u.email,
      password: hashed,
      role: u.role,
      goldBalance: u.goldBalance,
      reputationScore: 50
    }});
    createdUsers.push(created);
    console.log('Created user', created.username, created.id);
  }

  const khalifa = createdUsers.find(x => x.role === 'KHALIFA');
  const shura = createdUsers.find(x => x.role === 'SHURA');

  // Create products (5) owned by SHURA_MEMBER or KHALIFA
  const products = [
    { name: 'Industrial Drill', description: 'High power drill for mining and construction', price: 5000n, stock: 2, ownerId: khalifa.id },
    { name: 'Small Farm Land', description: '2 hectares of arable land', price: 300000n, stock: 1, ownerId: shura.id },
    { name: 'Wheat Seeds (kg)', description: 'High-quality seed for sowing', price: 200n, stock: 100, ownerId: shura.id },
    { name: 'Irrigation Pump', description: 'Medium capacity water pump', price: 2500n, stock: 5, ownerId: khalifa.id },
    { name: 'Hand Tools Set', description: 'Set of basic farming tools', price: 800n, stock: 10, ownerId: shura.id }
  ];

  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    console.log('Created product', created.name, created.id);
  }

  // Initialize ResourcePrice entries
  const resources = [
    { resource: 'GOLD', priceInGoldMg: 1.0 },
    { resource: 'OIL', priceInGoldMg: 100.0 },
    { resource: 'GAS', priceInGoldMg: 80.0 },
  ];

  for (const r of resources) {
    const created = await prisma.resourcePrice.upsert({ where: { resource: r.resource }, update: { priceInGoldMg: r.priceInGoldMg }, create: r });
    console.log('Resource price set', created.resource, created.priceInGoldMg);
  }

  // Optional: create an example stock (Go public) by khalifa or shura
  const ownerForStock = khalifa || shura;
  if (ownerForStock) {
    const stockExists = await prisma.stock.findFirst({ where: { name: 'Sana Farms' } });
    if (!stockExists) {
      const stock = await prisma.stock.create({ data: {
        name: 'Sana Farms', ownerId: ownerForStock.id, totalShares: 10000, availableShares: 10000, sharePrice: 1000n, isPublic: true, listedAt: new Date()
      }});
      console.log('Created example stock', stock.name, stock.id);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
