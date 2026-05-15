const express = require('express');
const router = express.Router();

function makeStockRoutes(dataSource, authenticateToken, io) {
  const makeStockController = require('../controllers/stockController');
  const { ipo, buy, distribute, listStocks } = makeStockController(dataSource, io);

  router.get('/', async (req, res) => listStocks(req, res));
  router.post('/ipo', authenticateToken, async (req, res) => ipo(req, res));
  router.post('/buy', authenticateToken, async (req, res) => buy(req, res));
  router.post('/distribute', authenticateToken, async (req, res) => distribute(req, res));

  return router;
}

module.exports = makeStockRoutes;
