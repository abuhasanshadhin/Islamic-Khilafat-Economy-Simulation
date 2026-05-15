const express = require('express');
const router = express.Router();
const { UserEntity } = require('../entities/User');
const { ProductEntity } = require('../entities/Product');
const { TransactionEntity } = require('../entities/Transaction');
const { Like } = require('typeorm');
const { paginate, parsePaginationParams } = require('../utils/pagination');

function makeUserRoutes(dataSource, authenticateToken, io) {
  // Community member directory — supports server-side search + pagination
  // Query params: q (search), page (1-based), limit, sort (rep|gold|name)
  router.get('/directory', authenticateToken, async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const { page, limit } = parsePaginationParams(req.query);
      const sort = String(req.query.sort || 'rep');

      const where = q.length > 0 ? { username: Like(`%${q}%`) } : {};

      // determine order
      let order = { reputationScore: 'DESC' };
      if (sort === 'gold') order = { goldBalance: 'DESC' };
      if (sort === 'name') order = { username: 'ASC' };

      const repo = dataSource.getRepository(UserEntity)
      const result = await paginate(repo, {
        where,
        order,
        page,
        limit,
        select: ['id', 'username', 'role', 'reputationScore', 'goldBalance', 'createdAt']
      })

      const items = result.items.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        reputationScore: u.reputationScore,
        goldBalance: u.goldBalance ? u.goldBalance.toString() : '0',
        memberSince: u.createdAt || null,
      }))

      return res.json({
        items,
        meta: result.meta,
        page: result.page,
        limit: result.limit,
        total: result.total,
      })
    } catch (err) {
      console.error('[userRoutes] /directory error', err);
      res.status(500).json({ error: 'Failed to fetch directory' });
    }
  });

  // Public profile by username — includes their active listings
  router.get('/profile/:username', authenticateToken, async (req, res) => {
    try {
      const user = await dataSource.getRepository(UserEntity).findOne({
        select: ['id', 'username', 'role', 'reputationScore', 'goldBalance', 'createdAt'],
        where: { username: req.params.username },
      });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const products = await dataSource.getRepository(ProductEntity).find({
        where: { ownerId: user.id },
        order: { id: 'DESC' },
      });

      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        reputationScore: user.reputationScore,
        goldBalance: user.goldBalance ? user.goldBalance.toString() : '0',
        memberSince: user.createdAt || null,
        listings: products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price ? p.price.toString() : '0',
          stock: p.stock,
        })),
      });
    } catch (err) {
      console.error('[userRoutes] /profile error', err);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Public username search — returns only safe public fields, excludes caller
  router.get('/search', authenticateToken, async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (q.length < 1) return res.json([]);
      const callerId = req.user && req.user.userId;

      const users = await dataSource.getRepository(UserEntity).find({
        select: ['id', 'username', 'reputationScore', 'role'],
        where: { username: Like(`%${q}%`) },
        order: { username: 'ASC' },
        take: 8,
      });

      return res.json(
        users
          .filter(u => u.id !== callerId)
          .map(u => ({ id: u.id, username: u.username, reputationScore: u.reputationScore, role: u.role }))
      );
    } catch (err) {
      console.error('[userRoutes] /search error', err);
      res.status(500).json({ error: 'Search failed' });
    }
  });

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

  // Transfer gold to another user by username
  router.post('/transfer', authenticateToken, async (req, res) => {
    try {
      const senderId = req.user && req.user.userId;
      if (!senderId) return res.status(401).json({ error: 'Unauthorized' });

      const { receiverUsername, amountGrams } = req.body;
      if (!receiverUsername || !amountGrams) return res.status(400).json({ error: 'receiverUsername and amountGrams are required' });

      const amountMg = BigInt(Math.round(Number(amountGrams) * 1000));
      if (amountMg <= 0n) return res.status(400).json({ error: 'Amount must be positive' });

      const result = await dataSource.transaction(async (manager) => {
        const sender = await manager.findOneBy(UserEntity, { id: senderId });
        if (!sender) throw { status: 404, message: 'Sender not found' };

        const receiver = await manager.findOneBy(UserEntity, { username: receiverUsername });
        if (!receiver) throw { status: 404, message: `User "${receiverUsername}" not found` };
        if (receiver.id === senderId) throw { status: 400, message: 'Cannot transfer to yourself' };
        if (sender.goldBalance < amountMg) throw { status: 400, message: 'Insufficient gold balance' };

        const newSenderBalance = (sender.goldBalance - amountMg).toString();
        const newReceiverBalance = (receiver.goldBalance + amountMg).toString();

        await manager.update(UserEntity, { id: senderId }, { goldBalance: newSenderBalance });
        await manager.update(UserEntity, { id: receiver.id }, { goldBalance: newReceiverBalance });

        const tx = await manager.save(TransactionEntity, {
          senderId,
          receiverId: receiver.id,
          amount: amountMg,
          type: 'TRANSFER',
        });

        return { tx, newSenderBalance, newReceiverBalance, receiverId: receiver.id };
      });

      try {
        if (io) {
          const txPayload = {
            id: result.tx.id,
            type: 'TRANSFER',
            amount: amountMg.toString(),
            senderId,
            receiverId: result.receiverId,
            timestamp: result.tx.timestamp,
          };
          io.to(`user:${senderId}`).emit('transaction_created', txPayload);
          io.to(`user:${result.receiverId}`).emit('transaction_created', txPayload);
          io.to(`user:${senderId}`).emit('balance_updated', { goldBalance: result.newSenderBalance });
          io.to(`user:${result.receiverId}`).emit('balance_updated', { goldBalance: result.newReceiverBalance });
        }
      } catch (e) {
        console.warn('transfer socket emit failed', e.message || e);
      }

      return res.json({ success: true, amount: amountMg.toString(), receiverUsername });
    } catch (err) {
      if (err && err.status) return res.status(err.status).json({ error: err.message });
      console.error('[userRoutes] /transfer error', err);
      res.status(500).json({ error: 'Transfer failed' });
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
