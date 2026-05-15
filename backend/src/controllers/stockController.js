const makeStockService = require('../services/stockService');

function makeStockController(prisma, io) {
  const { goPublic, buyShares, distributeDividends } = makeStockService;

  async function ipo(req, res) {
    try {
      const ownerId = req.user.userId;
      const { name, totalShares, initialPriceMg } = req.body;

      // Reputation check
      const owner = await prisma.user.findUnique({ where: { id: ownerId } });
      if (!owner) return res.status(404).json({ error: 'Owner not found' });
      if (owner.reputationScore <= 80) return res.status(403).json({ error: 'Insufficient reputation to go public' });

      const stock = await goPublic(prisma, ownerId, name, Number(totalShares), BigInt(initialPriceMg));
      return res.json(stock);
    } catch (err) {
      console.error('[stockController.ip o] error', err);
      res.status(500).json({ error: String(err.message || err) });
    }
  }

  async function buy(req, res) {
    try {
      const buyerId = req.user.userId;
      const { stockId, shares } = req.body;
      const result = await buyShares(prisma, io, buyerId, Number(stockId), Number(shares));
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
      const result = await distributeDividends(prisma, io, ownerId, Number(stockId), Number(totalAmountMg));
      return res.json(result);
    } catch (err) {
      console.error('[stockController.distribute] error', err);
      res.status(400).json({ error: String(err.message || err) });
    }
  }

  async function listStocks(req, res) {
    try {
      const stocks = await prisma.stock.findMany({ include: { owner: true } });
      return res.json(stocks);
    } catch (err) {
      console.error('[stockController.listStocks] error', err);
      res.status(500).json({ error: 'Failed to list stocks' });
    }
  }

  return { ipo, buy, distribute, listStocks };
}

module.exports = makeStockController;
