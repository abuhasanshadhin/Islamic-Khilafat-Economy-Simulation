require('dotenv/config');
const express = require('express');
const http = require('http');
const { Server: IOServer } = require('socket.io');
// Prefer the generated Prisma client in ./src/generated/prisma (custom output)
let PrismaClientImport;
try {
  PrismaClientImport = require('./src/generated/prisma');
} catch (e) {
  PrismaClientImport = require('@prisma/client');
}
const { registerUserSchema } = require('./src/validation/userSchema');
const bigIntMiddleware = require('./src/middleware/bigIntMiddleware');
const { PrismaClient } = PrismaClientImport;

// Prisma client instance
const prismaOptions = {};
if (process.env.PRISMA_ACCELERATE_URL) prismaOptions.accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
if (process.env.PRISMA_ADAPTER) prismaOptions.adapter = process.env.PRISMA_ADAPTER;
const prisma = new PrismaClient(prismaOptions);

const app = express();

// Global BigInt serialization for JSON (ensures BigInt is stringified everywhere)
if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
  // eslint-disable-next-line no-extend-native
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

// create HTTP server for socket.io
const httpServer = http.createServer(app);

// Prisma client (simple default usage). For accelerate/adapter, use env vars PRISMA_ACCELERATE_URL or PRISMA_ADAPTER as before.

// Apply BigInt JSON middleware globally
app.use(bigIntMiddleware);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Health check that validates DB and socket
app.get('/api/health', async (req, res) => {
  const out = { db: 'unknown', socket: io ? 'ok' : 'not-initialized' };
  try {
    // simple query to ensure DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    out.db = 'ok';
  } catch (err) {
    out.db = 'error';
    out.dbError = String(err.message || err);
  }
  res.json(out);
});

// Auth controller factory (pass prisma instance)
const makeAuthController = require('./src/controllers/authController');
const { register, login } = makeAuthController(prisma);

app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// Socket.io setup
const io = new IOServer(httpServer, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
  // allow client to join a personal room for user-specific notifications
  socket.on('identify', (userId) => {
    try {
      if (!userId) return;
      socket.join(`user:${userId}`);
      console.log(`socket ${socket.id} joined room user:${userId}`);
    } catch (e) {
      console.warn('identify error', e.message || e);
    }
  });
});

// Start mining service and broadcast updates
const { startMining } = require('./src/services/miningService');
startMining(prisma, io);

// Start zakat collector service
const { startZakatCollector } = require('./src/services/zakatService');
startZakatCollector(prisma, io, Number(process.env.ZAKAT_INTERVAL_MS || 24 * 60 * 60 * 1000));

// Start dynamic pricing engine
const { startPriceEngine } = require('./src/services/priceService');
startPriceEngine(prisma, io, Number(process.env.PRICE_ENGINE_INTERVAL_MS || 10 * 60 * 1000));

// Hisbah routes
const makeHisbahRoutes = require('./src/routes/hisbahRoutes');
app.use('/api/hisbah', makeHisbahRoutes(prisma, authenticateToken, io));

// User routes
const makeUserRoutes = require('./src/routes/userRoutes');
app.use('/api/user', makeUserRoutes(prisma, authenticateToken));

// State routes (protected)
const authenticateToken = require('./src/middleware/authenticateToken');
const makeStateRoutes = require('./src/routes/stateRoutes');
app.use('/api/state', makeStateRoutes(prisma, authenticateToken));

// Trade routes
const makeTradeRoutes = require('./src/routes/tradeRoutes');
app.use('/api/trade', makeTradeRoutes(prisma, authenticateToken, io));

// Market routes (prices)
const makeMarketRoutes = require('./src/routes/marketRoutes');
app.use('/api/market', makeMarketRoutes(prisma, io));

// Stock exchange routes
const makeStockRoutes = require('./src/routes/stockRoutes');
app.use('/api/stock', makeStockRoutes(prisma, authenticateToken, io));

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
