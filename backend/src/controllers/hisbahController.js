const { reportSchema } = require('../validation/hisbahSchema');
const { calculateReputation } = require('../services/reputationService');

function makeHisbahController(prisma, io) {
  async function report(req, res) {
    try {
      const data = reportSchema.parse(req.body);
      const reporterId = req.user && req.user.userId;
      if (!reporterId) return res.status(401).json({ error: 'Unauthorized' });

      const accused = await prisma.user.findUnique({ where: { id: data.accusedId } });
      if (!accused) return res.status(404).json({ error: 'Accused user not found' });

      const created = await prisma.report.create({ data: { reporterId, accusedId: data.accusedId, reason: data.reason, status: data.markValid ? 'VALID' : 'OPEN' } });

      // If marked valid, recalculate reputation immediately
      if (data.markValid) {
        await calculateReputation(prisma, io, data.accusedId);
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
      // only SHURA or KHALIFA can view pending
      if (user.role !== 'SHURA' && user.role !== 'KHALIFA') return res.status(403).json({ error: 'Forbidden' });

      const reports = await prisma.report.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } });
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
      const rep = await prisma.report.update({ where: { id }, data: { status: 'VALID' } });

      // recalc reputation for accused
      await calculateReputation(prisma, io, rep.accusedId);

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
      await prisma.report.update({ where: { id }, data: { status: 'RESOLVED' } });
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
      await calculateReputation(prisma, io, accusedId);
      res.json({ success: true });
    } catch (err) {
      console.error('[hisbah] recalc error', err);
      res.status(500).json({ error: 'Failed to recalc reputation' });
    }
  }

  return { report, pending, validate, resolve, recalc };
}

module.exports = makeHisbahController;
