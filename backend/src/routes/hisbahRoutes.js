const express = require('express');
const router = express.Router();

function makeHisbahRoutes(prisma, authenticateToken, io) {

  const makeHisbahController = require('../controllers/hisbahController');
  const { report, pending, validate, resolve, recalc } = makeHisbahController(prisma, io);

  router.post('/report', authenticateToken, report);
  router.get('/pending', authenticateToken, pending);
  router.post('/validate/:id', authenticateToken, validate);
  router.post('/resolve/:id', authenticateToken, resolve);
  router.post('/recalc/:accusedId', authenticateToken, recalc);

  return router;
}

module.exports = makeHisbahRoutes;
