const express = require('express');
const router = express.Router();
const { BaitulMalEntity } = require('../entities/BaitulMal');

function makeStateRoutes(dataSource, authenticateToken) {
  router.get('/stats', authenticateToken, async (req, res) => {
    try {
      const bait = await dataSource.getRepository(BaitulMalEntity).findOneBy({ id: 1 });
      if (!bait) return res.status(404).json({ error: 'BaitulMal record not found' });

      res.json({
        id: bait.id,
        goldReserve: bait.goldReserve,
        oilReserve: bait.oilReserve,
        gasReserve: bait.gasReserve,
        totalZakatCollected: bait.totalZakatCollected,
      });
    } catch (err) {
      console.error('[stateRoutes] error', err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  return router;
}

module.exports = makeStateRoutes;
