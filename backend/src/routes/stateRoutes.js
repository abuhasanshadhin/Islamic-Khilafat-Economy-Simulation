const express = require('express');
const router = express.Router();

function makeStateRoutes(prisma, authenticateToken) {
  // GET /api/state/stats - protected
  router.get('/stats', authenticateToken, async (req, res) => {
    try {
      const bait = await prisma.baitulMal.findUnique({ where: { id: 1 } });
      if (!bait) return res.status(404).json({ error: 'BaitulMal record not found' });

      // bigIntMiddleware will stringify BigInt on res.json, but ensure values are present
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
