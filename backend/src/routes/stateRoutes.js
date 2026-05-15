const express = require('express');
const router = express.Router();
const { BaitulMalEntity } = require('../entities/BaitulMal');
const { UserEntity } = require('../entities/User');
const { TransactionEntity } = require('../entities/Transaction');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

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

  // KHALIFA or SHURA: toggle mining boost
  router.post('/toggle-mining', authenticateToken, requireRole('KHALIFA', 'SHURA'), async (req, res) => {
    try {
      // Toggle a simple flag via env/in-memory (mining service checks global.miningBoosted)
      global.miningBoosted = !global.miningBoosted;
      return res.json({ miningBoosted: !!global.miningBoosted });
    } catch (err) {
      console.error('[stateRoutes] toggle-mining error', err);
      res.status(500).json({ error: 'Failed to toggle mining' });
    }
  });

  // KHALIFA or SHURA: approve a public grant (distribute gold from BaitulMal to all users)
  router.post('/approve-grant', authenticateToken, requireRole('KHALIFA', 'SHURA'), async (req, res) => {
    try {
      const { amountMg = 1000 } = req.body;
      const grant = BigInt(amountMg);
      if (grant <= 0n) return res.status(400).json({ error: 'amount must be > 0' });

      const result = await dataSource.transaction(async (manager) => {
        const [bait] = await manager.find(BaitulMalEntity, { order: { id: 'ASC' }, take: 1 });
        if (!bait) throw new Error('BaitulMal not found');

        const users = await manager.find(UserEntity, { where: {} });
        const total = grant * BigInt(users.length);
        if (bait.goldReserve < total) throw { status: 400, message: 'Insufficient BaitulMal reserves' };

        await manager.update(BaitulMalEntity, { id: bait.id }, {
          goldReserve: (bait.goldReserve - total).toString(),
        });

        for (const user of users) {
          await manager.update(UserEntity, { id: user.id }, {
            goldBalance: (user.goldBalance + grant).toString(),
          });
          await manager.save(TransactionEntity, {
            senderId: null,
            receiverId: user.id,
            amount: grant,
            type: 'GRANT',
          });
        }
        return { usersGranted: users.length, totalDistributed: total.toString() };
      });

      return res.json(result);
    } catch (err) {
      if (err && err.status) return res.status(err.status).json({ error: err.message });
      console.error('[stateRoutes] approve-grant error', err);
      res.status(500).json({ error: 'Failed to approve grant' });
    }
  });

  // KHALIFA only: all transactions
  router.get('/transactions', authenticateToken, requireRole('KHALIFA'), async (req, res) => {
    try {
      const txs = await dataSource.getRepository(TransactionEntity).find({
        order: { timestamp: 'DESC' },
        take: 200,
      });
      return res.json(txs.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount ? t.amount.toString() : '0',
        senderId: t.senderId,
        receiverId: t.receiverId,
        timestamp: t.timestamp,
      })));
    } catch (err) {
      console.error('[stateRoutes] transactions error', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  return router;
}

module.exports = makeStateRoutes;
