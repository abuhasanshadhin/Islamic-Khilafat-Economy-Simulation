const makeStockService = require('../services/stockService');
const { UserEntity } = require('../entities/User');
const { StockEntity } = require('../entities/Stock');

function makeStockController(dataSource, io) {
  const { goPublic, buyShares, distributeDividends } = makeStockService;

  async function ipo(req, res) {
    try {
      const ownerId = req.user.userId;
      const { name, totalShares, initialPriceMg } = req.body;

      const owner = await dataSource.getRepository(UserEntity).findOneBy({ id: ownerId });
      if (!owner) return res.status(404).json({ error: 'Owner not found' });
      if (owner.reputationScore <= 80) return res.status(403).json({ error: 'Insufficient reputation to go public' });

      const stock = await goPublic(dataSource, ownerId, name, Number(totalShares), BigInt(initialPriceMg));
      if (io) {
        io.emit('stock:new-listing', {
          stockId: stock.id,
          name: stock.name,
        });
      }
      return res.json(stock);
    } catch (err) {
      console.error('[stockController.ipo] error', err);
      res.status(500).json({ error: String(err.message || err) });
    }
  }

  async function buy(req, res) {
    try {
      const buyerId = req.user.userId;
      const { stockId, shares } = req.body;
      const result = await buyShares(dataSource, io, buyerId, Number(stockId), Number(shares));
      return res.json(result);
    } catch (err) {
      console.error('[stockController.buy] error', err);
      res.status(400).json({ error: String(err.message || err) });
    }
  }

  async function distribute(req, res) {
    try {
      const ownerId = req.user.userId;
      const { stockId, totalAmountMg } = req.body;
      const result = await distributeDividends(dataSource, io, ownerId, Number(stockId), Number(totalAmountMg));
      return res.json(result);
    } catch (err) {
      console.error('[stockController.distribute] error', err);
      res.status(400).json({ error: String(err.message || err) });
    }
  }

  async function listStocks(req, res) {
    try {
      const stocks = await dataSource.getRepository(StockEntity).find({ relations: ['owner', 'holdings'] });
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
      console.error('[stockController.listStocks] error', err);
      res.status(500).json({ error: 'Failed to list stocks' });
    }
  }

  return { ipo, buy, distribute, listStocks };
}

module.exports = makeStockController;
