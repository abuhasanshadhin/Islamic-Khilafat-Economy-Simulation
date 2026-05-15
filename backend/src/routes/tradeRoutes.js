const express = require('express');
const router = express.Router();

function makeTradeRoutes(prisma, authenticateToken, io) {
  const makeTradeController = require('../controllers/tradeController');
  const { purchaseProduct } = makeTradeController(prisma, io);

  router.post('/purchase', authenticateToken, purchaseProduct);

  return router;
}

module.exports = makeTradeRoutes;
