const express = require('express');
const router = express.Router();

function makeShuraRoutes(dataSource, authenticateToken, io) {
    const makeShuraController = require('../controllers/shuraController');
    const { createProposal, listProposals, getProposal, changeStatus } = makeShuraController(dataSource, io);

    router.post('/proposals', authenticateToken, createProposal);
    router.get('/proposals', listProposals);
    router.get('/proposals/:id', getProposal);
    router.post('/proposals/:id/status', authenticateToken, changeStatus);

    return router;
}

module.exports = makeShuraRoutes;
