const { Prisma } = require('@prisma/client');

async function goPublic(prisma, ownerId, name, totalShares, initialPriceMg) {
  if (totalShares <= 0) throw new Error('totalShares must be > 0');
  // create stock and mark public
  const stock = await prisma.stock.create({ data: {
    name,
    ownerId,
    totalShares,
    availableShares: totalShares,
    sharePrice: BigInt(initialPriceMg),
    isPublic: true,
    listedAt: new Date()
  }});
  return stock;
}

async function buyShares(prisma, io, buyerId, stockId, sharesWanted) {
  if (sharesWanted <= 0) throw new Error('sharesWanted must be > 0');

  return await prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({ where: { id: stockId } });
    if (!stock) throw new Error('Stock not found');
    if (!stock.isPublic) throw new Error('Stock is not public');
    if (stock.availableShares < sharesWanted) throw new Error('Not enough available shares');

    const buyer = await tx.user.findUnique({ where: { id: buyerId } });
    if (!buyer) throw new Error('Buyer not found');

    const cost = BigInt(sharesWanted) * BigInt(stock.sharePrice);
    if (buyer.goldBalance < cost) throw new Error('Insufficient gold balance');

    // Deduct from buyer
    await tx.user.update({ where: { id: buyerId }, data: { goldBalance: { decrement: cost } } });

    // Credit owner (business owner)
    await tx.user.update({ where: { id: stock.ownerId }, data: { goldBalance: { increment: cost } } });

    // Decrease available shares
    await tx.stock.update({ where: { id: stockId }, data: { availableShares: stock.availableShares - sharesWanted } });

    // Upsert share ownership
    const existing = await tx.shareOwnership.findUnique({ where: { stockId_userId: { stockId, userId: buyerId } } }).catch(()=>null);
    if (existing) {
      await tx.shareOwnership.update({ where: { id: existing.id }, data: { shares: existing.shares + sharesWanted } });
    } else {
      await tx.shareOwnership.create({ data: { stockId, userId: buyerId, shares: sharesWanted } });
    }

    // record transaction
    await tx.transaction.create({ data: { senderId: buyerId, receiverId: stock.ownerId, amount: cost, type: 'TRADE' } });

    // emit socket update
    if (io) io.emit('shares_changed', { stockId, buyerId, sharesBought: sharesWanted });

    return { stockId, buyerId, sharesBought: sharesWanted, cost: cost.toString() };
  });
}

async function distributeDividends(prisma, io, ownerId, stockId, totalAmountMg) {
  if (totalAmountMg <= 0) throw new Error('totalAmountMg must be > 0');

  return await prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({ where: { id: stockId } });
    if (!stock) throw new Error('Stock not found');
    if (stock.ownerId !== ownerId) throw new Error('Only owner can distribute dividends');

    const owner = await tx.user.findUnique({ where: { id: ownerId } });
    if (!owner) throw new Error('Owner not found');
    const amountBig = BigInt(totalAmountMg);
    if (owner.goldBalance < amountBig) throw new Error('Owner has insufficient gold');

    // get all shareholders
    const holdings = await tx.shareOwnership.findMany({ where: { stockId } });
    const totalShares = stock.totalShares;
    if (holdings.length === 0) throw new Error('No shareholders to distribute to');

    // Deduct from owner
    await tx.user.update({ where: { id: ownerId }, data: { goldBalance: { decrement: amountBig } } });

    for (const h of holdings) {
      const sharePortion = Number(h.shares) / Number(totalShares);
      const payout = BigInt(Math.floor(Number(amountBig) * sharePortion));
      if (payout > 0) {
        await tx.user.update({ where: { id: h.userId }, data: { goldBalance: { increment: payout } } });
        await tx.transaction.create({ data: { senderId: ownerId, receiverId: h.userId, amount: payout, type: 'TRANSFER' } });
      }
    }

    if (io) io.emit('dividends_distributed', { stockId, ownerId, totalAmountMg });
    return { stockId, totalAmountMg };
  });
}

module.exports = { goPublic, buyShares, distributeDividends };
