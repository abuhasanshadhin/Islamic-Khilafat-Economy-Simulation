const makePartnershipService = require('../services/partnershipService');
const { UserEntity } = require('../entities/User');
const { PartnershipEntity } = require('../entities/Partnership');

function makePartnershipController(dataSource, io) {
  const { launchPartnership: createPartnership, buyShares, distributeDividends } = makePartnershipService;

  async function launchPartnership(req, res) {
    try {
      const ownerId = req.user.userId;
      const { name, totalShares, initialPriceMg } = req.body;

      const owner = await dataSource.getRepository(UserEntity).findOneBy({ id: ownerId });
      if (!owner) return res.status(404).json({ error: 'Owner not found' });
      if (owner.reputationScore <= 80) return res.status(403).json({ error: 'Insufficient reputation to launch partnership' });

      const partnership = await createPartnership(dataSource, ownerId, name, Number(totalShares), BigInt(initialPriceMg));
      if (io) {
        io.emit('partnership:new-listing', {
          partnershipId: partnership.id,
          name: partnership.name,
        });
      }
      return res.json(partnership);
    } catch (err) {
      console.error('[partnershipController.launchPartnership] error', err);
      res.status(500).json({ error: String(err.message || err) });
    }
  }

  async function buy(req, res) {
    try {
      const buyerId = req.user.userId;
      const { partnershipId, shares } = req.body;
      const result = await buyShares(dataSource, io, buyerId, Number(partnershipId), Number(shares));
      return res.json(result);
    } catch (err) {
      console.error('[partnershipController.buy] error', err);
      res.status(400).json({ error: String(err.message || err) });
    }
  }

  async function distribute(req, res) {
    try {
      const ownerId = req.user.userId;
      const { partnershipId, totalAmountMg } = req.body;
      const result = await distributeDividends(dataSource, io, ownerId, Number(partnershipId), Number(totalAmountMg));
      return res.json(result);
    } catch (err) {
      console.error('[partnershipController.distribute] error', err);
      res.status(400).json({ error: String(err.message || err) });
    }
  }

  async function listStocks(req, res) {
    try {
      const stocks = await dataSource.getRepository(PartnershipEntity).find({ relations: ['owner', 'holdings'] });
      return res.json(stocks.map(s => ({
        id: s.id,
        name: s.name,
        ownerId: s.ownerId,
        ownerName: s.owner?.username ?? null,
        totalShares: s.totalShares,
        availableShares: s.availableShares,
        sharePrice: s.sharePrice ? s.sharePrice.toString() : '0',
        isPublic: s.isPublic,
        listedAt: s.listedAt,
        holdings: (s.holdings || []).map(h => ({ userId: h.userId, shares: h.shares })),
      })));
    } catch (err) {
      console.error('[partnershipController.listStocks] error', err);
      res.status(500).json({ error: 'Failed to list partnerships' });
    }
  }

  return { launchPartnership, buy, distribute, listStocks };
}

module.exports = makePartnershipController;
