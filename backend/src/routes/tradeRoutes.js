const express = require('express');
const router = express.Router();

function makeTradeRoutes(dataSource, authenticateToken, io) {
  const makeTradeController = require('../controllers/tradeController');
  const { purchaseProduct } = makeTradeController(dataSource, io);

  router.post('/purchase', authenticateToken, purchaseProduct);

  return router;
}

module.exports = makeTradeRoutes;
