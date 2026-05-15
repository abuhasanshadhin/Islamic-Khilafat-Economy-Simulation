const express = require('express');
const router = express.Router();
const { BaitulMalEntity } = require('../entities/BaitulMal');
const { UserEntity } = require('../entities/User');
const { TransactionEntity } = require('../entities/Transaction');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

function makeStateRoutes(dataSource, authenticateToken) {
  router.get('/stats', async (req, res) => {
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

  // KHALIFA only: all transactions with server-side filtering + pagination
  // Query params: type, minAmount (mg), page, limit
  router.get('/transactions', authenticateToken, requireRole('KHALIFA'), async (req, res) => {
    try {
      const type = String(req.query.type || '').trim();
      const minAmount = req.query.minAmount ? BigInt(req.query.minAmount) : null;
      const { page, limit } = parsePaginationParams(req.query, { defaultLimit: 50, minLimit: 5, maxLimit: 200 });

      const qb = dataSource.getRepository(TransactionEntity).createQueryBuilder('tx')
        .orderBy('tx.timestamp', 'DESC');

      if (type) qb.andWhere('tx.type = :type', { type });
      if (minAmount !== null) qb.andWhere('tx.amount >= :minAmount', { minAmount: minAmount.toString() });

      const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
      const meta = buildPaginationMeta(page, limit, total);

      const mapped = items.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount ? t.amount.toString() : '0',
        senderId: t.senderId,
        receiverId: t.receiverId,
        timestamp: t.timestamp,
      }));

      return res.json({ items: mapped, meta, page, limit, total });
    } catch (err) {
      console.error('[stateRoutes] transactions error', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  return router;
}

module.exports = makeStateRoutes;
