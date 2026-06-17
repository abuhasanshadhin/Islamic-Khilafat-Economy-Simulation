const express = require('express');
const router = express.Router();

function makeHisbahRoutes(dataSource, authenticateToken, io) {

  const makeHisbahController = require('../controllers/hisbahController');
  const { report, pending, validate, resolve, recalc, assignInvestigator, addNote, listNotes } = makeHisbahController(dataSource, io);

  router.post('/report', authenticateToken, report);
  router.post('/report/:id/assign', authenticateToken, async (req, res) => assignInvestigator(req, res));
  router.post('/report/:id/note', authenticateToken, async (req, res) => addNote(req, res));
  router.get('/report/:id/notes', async (req, res) => listNotes(req, res));
  router.get('/pending', authenticateToken, pending);
  router.post('/validate/:id', authenticateToken, validate);
  router.post('/resolve/:id', authenticateToken, resolve);
  router.post('/recalc/:accusedId', authenticateToken, recalc);

  return router;
}

module.exports = makeHisbahRoutes;
