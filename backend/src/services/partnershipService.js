const { PartnershipEntity } = require('../entities/Partnership');
const { UserEntity } = require('../entities/User');
const { ShareOwnershipEntity } = require('../entities/ShareOwnership');
const { TransactionEntity } = require('../entities/Transaction');

async function launchPartnership(dataSource, ownerId, name, totalShares, initialPriceMg) {
  if (totalShares <= 0) throw new Error('totalShares must be > 0');
  const partnership = await dataSource.getRepository(PartnershipEntity).save({
    name,
    ownerId,
    totalShares,
    availableShares: totalShares,
    sharePrice: BigInt(initialPriceMg),
    isPublic: true,
    listedAt: new Date(),
  });
  return partnership;
}

async function buyShares(dataSource, io, buyerId, partnershipId, sharesWanted) {
  if (sharesWanted <= 0) throw new Error('sharesWanted must be > 0');

  return await dataSource.transaction(async (manager) => {
    const partnership = await manager.findOneBy(PartnershipEntity, { id: partnershipId });
    if (!partnership) throw new Error('Partnership not found');
    if (!partnership.isPublic) throw new Error('Partnership is not public');
    if (partnership.availableShares < sharesWanted) throw new Error('Not enough available shares');

    const buyer = await manager.findOneBy(UserEntity, { id: buyerId });
    if (!buyer) throw new Error('Buyer not found');

    const cost = BigInt(sharesWanted) * BigInt(partnership.sharePrice);
    if (buyer.goldBalance < cost) throw new Error('Insufficient gold balance');

    await manager.update(UserEntity, { id: buyerId }, { goldBalance: (buyer.goldBalance - cost).toString() });

    const owner = await manager.findOneBy(UserEntity, { id: partnership.ownerId });
    if (owner) {
      await manager.update(UserEntity, { id: partnership.ownerId }, { goldBalance: (owner.goldBalance + cost).toString() });
    }

    await manager.update(PartnershipEntity, { id: partnershipId }, { availableShares: partnership.availableShares - sharesWanted });

    const existing = await manager.findOneBy(ShareOwnershipEntity, { stockId: partnershipId, userId: buyerId }).catch(() => null);
    if (existing) {
      await manager.update(ShareOwnershipEntity, { id: existing.id }, { shares: existing.shares + sharesWanted });
    } else {
      await manager.save(ShareOwnershipEntity, { stockId: partnershipId, userId: buyerId, shares: sharesWanted });
    }

    await manager.save(TransactionEntity, { senderId: buyerId, receiverId: partnership.ownerId, amount: cost, type: 'TRADE' });

    if (io) io.emit('shares_changed', { partnershipId, buyerId, sharesBought: sharesWanted });

    return { partnershipId, buyerId, sharesBought: sharesWanted, cost: cost.toString() };
  });
}

async function distributeDividends(dataSource, io, ownerId, partnershipId, totalAmountMg) {
  if (totalAmountMg <= 0) throw new Error('totalAmountMg must be > 0');

  return await dataSource.transaction(async (manager) => {
    const partnership = await manager.findOneBy(PartnershipEntity, { id: partnershipId });
    if (!partnership) throw new Error('Partnership not found');
    if (partnership.ownerId !== ownerId) throw new Error('Only owner can distribute dividends');

    const owner = await manager.findOneBy(UserEntity, { id: ownerId });
    if (!owner) throw new Error('Owner not found');
    const amountBig = BigInt(totalAmountMg);
    if (owner.goldBalance < amountBig) throw new Error('Owner has insufficient gold');

    const holdings = await manager.findBy(ShareOwnershipEntity, { stockId: partnershipId });
    if (holdings.length === 0) throw new Error('No shareholders to distribute to');

    await manager.update(UserEntity, { id: ownerId }, { goldBalance: (owner.goldBalance - amountBig).toString() });

    for (const h of holdings) {
      const sharePortion = Number(h.shares) / Number(partnership.totalShares);
      const payout = BigInt(Math.floor(Number(amountBig) * sharePortion));
      if (payout > 0n) {
        const shareholder = await manager.findOneBy(UserEntity, { id: h.userId });
        if (shareholder) {
          await manager.update(UserEntity, { id: h.userId }, { goldBalance: (shareholder.goldBalance + payout).toString() });
        }
        await manager.save(TransactionEntity, { senderId: ownerId, receiverId: h.userId, amount: payout, type: 'TRANSFER' });
      }
    }

    if (io) io.emit('dividends_distributed', { partnershipId, ownerId, totalAmountMg });
    return { partnershipId, totalAmountMg };
  });
}

module.exports = { launchPartnership, buyShares, distributeDividends };
