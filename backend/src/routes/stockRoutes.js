const express = require('express');
const router = express.Router();

function makeStockRoutes(prisma, authenticateToken, io) {
  const makeStockController = require('../controllers/stockController');
  const { ipo, buy, distribute, listStocks } = makeStockController(prisma, io);

  // GET /api/stock/ -> list stocks
  router.get('/', async (req, res) => listStocks(req, res));

  // POST /api/stock/ipo - protected
  router.post('/ipo', authenticateToken, async (req, res) => ipo(req, res));

  // POST /api/stock/buy - protected
  router.post('/buy', authenticateToken, async (req, res) => buy(req, res));

  // POST /api/stock/distribute - protected (owner only)
  router.post('/distribute', authenticateToken, async (req, res) => distribute(req, res));

  return router;
}

module.exports = makeStockRoutes;
