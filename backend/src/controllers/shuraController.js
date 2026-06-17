const { ProposalEntity } = require('../entities/Proposal');

function makeShuraController(dataSource, io) {
    async function createProposal(req, res) {
        try {
            const user = req.user;
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const { title, description } = req.body;
            if (!title) return res.status(400).json({ error: 'title required' });

            const proposal = await dataSource.getRepository(ProposalEntity).save({ title, description: description || null, proposerId: user.userId, status: 'OPEN' });
            if (io) io.emit('shura:new-proposal', { id: proposal.id, title: proposal.title });
            return res.status(201).json({ id: proposal.id, title: proposal.title, status: proposal.status });
        } catch (err) {
            console.error('[shuraController.createProposal] error', err);
            res.status(500).json({ error: 'Failed to create proposal' });
        }
    }

    async function listProposals(req, res) {
        try {
            const proposals = await dataSource.getRepository(ProposalEntity).find({ order: { id: 'DESC' } });
            return res.json(proposals.map(p => ({ id: p.id, title: p.title, description: p.description, proposerId: p.proposerId, status: p.status, createdAt: p.createdAt })));
        } catch (err) {
            console.error('[shuraController.listProposals] error', err);
            res.status(500).json({ error: 'Failed to list proposals' });
        }
    }

    async function getProposal(req, res) {
        try {
            const id = Number(req.params.id);
            const p = await dataSource.getRepository(ProposalEntity).findOneBy({ id });
            if (!p) return res.status(404).json({ error: 'Proposal not found' });
            return res.json({ id: p.id, title: p.title, description: p.description, proposerId: p.proposerId, status: p.status, createdAt: p.createdAt });
        } catch (err) {
            console.error('[shuraController.getProposal] error', err);
            res.status(500).json({ error: 'Failed to get proposal' });
        }
    }

    async function changeStatus(req, res) {
        try {
            const user = req.user;
            if (!user) return res.status(401).json({ error: 'Unauthorized' });
            // Only SHURA or KHALIFA or MUHTASIB can change status
            if (!['SHURA', 'KHALIFA', 'MUHTASIB'].includes(user.role)) return res.status(403).json({ error: 'Forbidden' });

            const id = Number(req.params.id);
            const { status } = req.body;
            if (!['OPEN', 'VOTED', 'ADOPTED', 'REJECTED', 'RESOLVED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

            const repo = dataSource.getRepository(ProposalEntity);
            const p = await repo.findOneBy({ id });
            if (!p) return res.status(404).json({ error: 'Proposal not found' });
            await repo.update({ id }, { status });
            if (io) io.emit('shura:proposal-updated', { id, status });
            return res.json({ success: true, id, status });
        } catch (err) {
            console.error('[shuraController.changeStatus] error', err);
            res.status(500).json({ error: 'Failed to change status' });
        }
    }

    return { createProposal, listProposals, getProposal, changeStatus };
}

module.exports = makeShuraController;
