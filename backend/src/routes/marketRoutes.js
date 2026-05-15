const express = require('express');
const router = express.Router();
const { ResourcePriceEntity } = require('../entities/ResourcePrice');

function makeMarketRoutes(dataSource, io) {
  router.get('/prices', async (req, res) => {
    try {
      const prices = await dataSource.getRepository(ResourcePriceEntity).find();
      return res.json(prices.map(p => ({ resource: p.resource, priceInGoldMg: p.priceInGoldMg, updatedAt: p.updatedAt })));
    } catch (err) {
      console.error('[marketRoutes] error', err);
      res.status(500).json({ error: 'Failed to fetch prices' });
    }
  });

  return router;
}

module.exports = makeMarketRoutes;
