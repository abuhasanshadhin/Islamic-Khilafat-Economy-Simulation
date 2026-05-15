const express = require('express');
const router = express.Router();

function makePartnershipRoutes(dataSource, authenticateToken, io) {
  const makePartnershipController = require('../controllers/partnershipController');
  const { launchPartnership, buy, distribute, listStocks } = makePartnershipController(dataSource, io);

  router.get('/', async (req, res) => listStocks(req, res));
  router.post('/partnership', authenticateToken, async (req, res) => launchPartnership(req, res));
  router.post('/buy', authenticateToken, async (req, res) => buy(req, res));
  router.post('/distribute', authenticateToken, async (req, res) => distribute(req, res));

  return router;
}

module.exports = makePartnershipRoutes;
