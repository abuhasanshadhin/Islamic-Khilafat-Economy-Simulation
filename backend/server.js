require('reflect-metadata');
require('dotenv/config');
const express = require('express');
const http = require('http');
const { Server: IOServer } = require('socket.io');
const { AppDataSource } = require('./src/data-source');
const bigIntMiddleware = require('./src/middleware/bigIntMiddleware');
const authenticateToken = require('./src/middleware/authenticateToken');

const app = express();

// Global BigInt serialization for JSON
if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () { return this.toString(); };
}

const httpServer = http.createServer(app);
const io = new IOServer(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
  socket.on('identify', (userId) => {
    try {
      if (!userId) return;
      socket.join(`user:${userId}`);
    } catch (e) {
      console.warn('identify error', e.message || e);
    }
  });
});

app.use(bigIntMiddleware);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/health', async (req, res) => {
  const out = { db: 'unknown', socket: io ? 'ok' : 'not-initialized' };
  try {
    await AppDataSource.query('SELECT 1');
    out.db = 'ok';
  } catch (err) {
    out.db = 'error';
    out.dbError = String(err.message || err);
  }
  res.json(out);
});

// Auth routes
const makeAuthController = require('./src/controllers/authController');
const { register, login } = makeAuthController(AppDataSource);
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// All other routes
const makeHisbahRoutes = require('./src/routes/hisbahRoutes');
app.use('/api/hisbah', makeHisbahRoutes(AppDataSource, authenticateToken, io));

const makeUserRoutes = require('./src/routes/userRoutes');
app.use('/api/user', makeUserRoutes(AppDataSource, authenticateToken, io));

const makeStateRoutes = require('./src/routes/stateRoutes');
app.use('/api/state', makeStateRoutes(AppDataSource, authenticateToken));

const makeTradeRoutes = require('./src/routes/tradeRoutes');
app.use('/api/trade', makeTradeRoutes(AppDataSource, authenticateToken, io));

const makeMarketRoutes = require('./src/routes/marketRoutes');
app.use('/api/market', makeMarketRoutes(AppDataSource, io));

const makePartnershipRoutes = require('./src/routes/partnershipRoutes');
app.use('/api/partnership', makePartnershipRoutes(AppDataSource, authenticateToken, io));

const PORT = process.env.PORT || 3000;

async function initializeWithRetry(maxAttempts = 10, delayMs = 3000) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      await AppDataSource.initialize();
      console.log('Database connected via TypeORM');

      const { startMining } = require('./src/services/miningService');
      startMining(AppDataSource, io);

      const { startZakatCollector } = require('./src/services/zakatService');
      startZakatCollector(AppDataSource, io, Number(process.env.ZAKAT_INTERVAL_MS || 24 * 60 * 60 * 1000));

      const { startPriceEngine } = require('./src/services/priceService');
      startPriceEngine(AppDataSource, io, Number(process.env.PRICE_ENGINE_INTERVAL_MS || 10 * 60 * 1000));

      httpServer.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
      return;
    } catch (err) {
      console.error(`Database connection attempt ${attempt} failed:`, err.message || err);
      if (attempt >= maxAttempts) {
        console.error('Max DB connection attempts reached, exiting.');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

initializeWithRetry();
