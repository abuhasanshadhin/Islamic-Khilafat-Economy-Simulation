const express = require('express');
const router = express.Router();

function makeUserRoutes(prisma, authenticateToken) {
  // GET /api/user/reputation
  router.get('/reputation', authenticateToken, async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const standing = user.reputationScore >= 40 ? 'good' : 'restricted';
      return res.json({ reputationScore: user.reputationScore, standing });
    } catch (err) {
      console.error('[userRoutes] error', err);
      res.status(500).json({ error: 'Failed to fetch reputation' });
    }
  });

  return router;
}

module.exports = makeUserRoutes;
