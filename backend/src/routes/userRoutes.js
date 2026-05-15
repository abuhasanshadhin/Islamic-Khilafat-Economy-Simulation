const express = require('express');
const router = express.Router();
const { UserEntity } = require('../entities/User');
const { TransactionEntity } = require('../entities/Transaction');

function makeUserRoutes(dataSource, authenticateToken) {
  // Get current user profile (used for store rehydration on page refresh)
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await dataSource.getRepository(UserEntity).findOneBy({ id: userId });
      if (!user) return res.status(404).json({ error: 'User not found' });

      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        goldBalance: user.goldBalance,
        reputationScore: user.reputationScore,
        isZakatEligible: user.isZakatEligible,
      });
    } catch (err) {
      console.error('[userRoutes] /me error', err);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Get current user's recent transactions
  router.get('/transactions', authenticateToken, async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const txRepo = dataSource.getRepository(TransactionEntity);
      const txs = await txRepo
        .createQueryBuilder('tx')
        .where('tx.senderId = :id OR tx.receiverId = :id', { id: userId })
        .orderBy('tx.timestamp', 'DESC')
        .take(50)
        .getMany();

      return res.json(txs.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount ? t.amount.toString() : '0',
        senderId: t.senderId,
        receiverId: t.receiverId,
        timestamp: t.timestamp,
      })));
    } catch (err) {
      console.error('[userRoutes] /transactions error', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // KHALIFA only: assign/change a user's role
  router.post('/assign-role', authenticateToken, async (req, res) => {
    try {
      const { role: callerRole } = req.user;
      if (callerRole !== 'KHALIFA') return res.status(403).json({ error: 'Only KHALIFA can assign roles' });

      const { userId, role } = req.body;
      if (!userId || !role) return res.status(400).json({ error: 'userId and role are required' });
      if (!['USER', 'SHURA', 'KHALIFA'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be USER, SHURA, or KHALIFA' });
      }

      const target = await dataSource.getRepository(UserEntity).findOneBy({ id: userId });
      if (!target) return res.status(404).json({ error: 'User not found' });

      await dataSource.getRepository(UserEntity).update({ id: userId }, { role });
      return res.json({ success: true, userId, role });
    } catch (err) {
      console.error('[userRoutes] assign-role error', err);
      res.status(500).json({ error: 'Failed to assign role' });
    }
  });

  // KHALIFA only: list all users (for admin panel)
  router.get('/all', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'KHALIFA') return res.status(403).json({ error: 'Forbidden' });
      const users = await dataSource.getRepository(UserEntity).find({
        select: ['id', 'username', 'email', 'role', 'goldBalance', 'reputationScore', 'isZakatEligible'],
        order: { id: 'ASC' },
      });
      return res.json(users.map(u => ({
        ...u,
        goldBalance: u.goldBalance ? u.goldBalance.toString() : '0',
      })));
    } catch (err) {
      console.error('[userRoutes] /all error', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.get('/reputation', authenticateToken, async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await dataSource.getRepository(UserEntity).findOneBy({ id: userId });
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
