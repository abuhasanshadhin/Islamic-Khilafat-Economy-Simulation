const { reportSchema } = require('../validation/hisbahSchema');
const { calculateReputation } = require('../services/reputationService');
const { UserEntity } = require('../entities/User');
const { ReportEntity } = require('../entities/Report');
const { In } = require('typeorm');

function makeHisbahController(dataSource, io) {
  async function report(req, res) {
    try {
      const data = reportSchema.parse(req.body);
      const reporterId = req.user && req.user.userId;
      if (!reporterId) return res.status(401).json({ error: 'Unauthorized' });

      const accused = await dataSource.getRepository(UserEntity).findOneBy({ username: data.accusedUsername });
      if (!accused) return res.status(404).json({ error: `User "${data.accusedUsername}" not found` });
      if (accused.id === reporterId) return res.status(400).json({ error: 'You cannot report yourself' });

      const created = await dataSource.getRepository(ReportEntity).save({
        reporterId,
        accusedId: accused.id,
        reason: data.reason,
        status: data.markValid ? 'VALID' : 'OPEN',
      });

      if (data.markValid) {
        await calculateReputation(dataSource, io, accused.id);
      }

      return res.status(201).json({ success: true, reportId: created.id, accusedUsername: accused.username });
    } catch (err) {
      if (err && err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      console.error('[hisbah] error', err);
      return res.status(500).json({ error: 'Failed to create report' });
    }
  }

  async function pending(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA' && user.role !== 'MUHTASIB') return res.status(403).json({ error: 'Forbidden' });

      const reports = await dataSource.getRepository(ReportEntity).find({
        where: { status: 'OPEN' },
        order: { createdAt: 'DESC' },
      });

      // Resolve usernames for all participants
      const userIds = [...new Set([...reports.map(r => r.reporterId), ...reports.map(r => r.accusedId)])];
      let usernameMap = {};
      if (userIds.length > 0) {
        const users = await dataSource.getRepository(UserEntity).findBy({ id: In(userIds) });
        users.forEach(u => { usernameMap[u.id] = u.username; });
      }

      return res.json(reports.map(r => ({
        id: r.id,
        reporterId: r.reporterId,
        reporterUsername: usernameMap[r.reporterId] || `#${r.reporterId}`,
        accusedId: r.accusedId,
        accusedUsername: usernameMap[r.accusedId] || `#${r.accusedId}`,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
      })));
    } catch (err) {
      console.error('[hisbah] pending error', err);
      res.status(500).json({ error: 'Failed to fetch pending reports' });
    }
  }

  async function validate(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA' && user.role !== 'MUHTASIB') return res.status(403).json({ error: 'Forbidden' });

      const id = Number(req.params.id);
      const rep = await dataSource.getRepository(ReportEntity).findOneBy({ id });
      if (!rep) return res.status(404).json({ error: 'Report not found' });

      await dataSource.getRepository(ReportEntity).update({ id }, { status: 'VALID' });
      await calculateReputation(dataSource, io, rep.accusedId);

      res.json({ success: true });
    } catch (err) {
      console.error('[hisbah] validate error', err);
      res.status(500).json({ error: 'Failed to validate report' });
    }
  }

  async function resolve(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA' && user.role !== 'MUHTASIB') return res.status(403).json({ error: 'Forbidden' });

      const id = Number(req.params.id);
      await dataSource.getRepository(ReportEntity).update({ id }, { status: 'RESOLVED' });
      res.json({ success: true });
    } catch (err) {
      console.error('[hisbah] resolve error', err);
      res.status(500).json({ error: 'Failed to resolve report' });
    }
  }

  async function recalc(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA' && user.role !== 'MUHTASIB') return res.status(403).json({ error: 'Forbidden' });

      const accusedId = Number(req.params.accusedId);
      await calculateReputation(dataSource, io, accusedId);
      res.json({ success: true });
    } catch (err) {
      console.error('[hisbah] recalc error', err);
      res.status(500).json({ error: 'Failed to recalc reputation' });
    }
  }

  return { report, pending, validate, resolve, recalc };
}

module.exports = makeHisbahController;
