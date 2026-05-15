const { reportSchema } = require('../validation/hisbahSchema');
const { calculateReputation } = require('../services/reputationService');
const { UserEntity } = require('../entities/User');
const { ReportEntity } = require('../entities/Report');

function makeHisbahController(dataSource, io) {
  async function report(req, res) {
    try {
      const data = reportSchema.parse(req.body);
      const reporterId = req.user && req.user.userId;
      if (!reporterId) return res.status(401).json({ error: 'Unauthorized' });

      const accused = await dataSource.getRepository(UserEntity).findOneBy({ id: data.accusedId });
      if (!accused) return res.status(404).json({ error: 'Accused user not found' });

      const created = await dataSource.getRepository(ReportEntity).save({
        reporterId,
        accusedId: data.accusedId,
        reason: data.reason,
        status: data.markValid ? 'VALID' : 'OPEN',
      });

      if (data.markValid) {
        await calculateReputation(dataSource, io, data.accusedId);
      }

      return res.status(201).json({ success: true, reportId: created.id });
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
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA') return res.status(403).json({ error: 'Forbidden' });

      const reports = await dataSource.getRepository(ReportEntity).find({
        where: { status: 'OPEN' },
        order: { createdAt: 'DESC' },
      });
      res.json(reports);
    } catch (err) {
      console.error('[hisbah] pending error', err);
      res.status(500).json({ error: 'Failed to fetch pending reports' });
    }
  }

  async function validate(req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA') return res.status(403).json({ error: 'Forbidden' });

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
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA') return res.status(403).json({ error: 'Forbidden' });

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
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA') return res.status(403).json({ error: 'Forbidden' });

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
