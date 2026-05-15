const BASELINES = {
  GOLD: 1000000, // mg
  OIL: 5000.0,
  GAS: 2000.0,
};

const DEFAULT_BASE_PRICES = {
  GOLD: 1.0,
  OIL: 100.0,
  GAS: 80.0,
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

async function ensurePrices(prisma) {
  const res = {};
  for (const r of Object.keys(DEFAULT_BASE_PRICES)) {
    let existing = await prisma.resourcePrice.findUnique({ where: { resource: r } }).catch(()=>null);
    if (!existing) {
      existing = await prisma.resourcePrice.create({ data: { resource: r, priceInGoldMg: DEFAULT_BASE_PRICES[r] } });
    }
    res[r] = existing;
  }
  return res;
}

function computePrice(basePrice, baselineReserve, currentReserve) {
  const cur = Math.max(1e-6, currentReserve);
  const ratio = baselineReserve / cur;
  // Inverse proportional: price scales with ratio. Clamp to avoid runaway.
  const raw = basePrice * ratio;
  return clamp(raw, basePrice * 0.2, basePrice * 100);
}

async function updatePricesOnce(prisma, io) {
  const bait = await prisma.baitulMal.findUnique({ where: { id: 1 } });
  if (!bait) return;

  const prices = await ensurePrices(prisma);

  const current = {
    GOLD: Number(bait.goldReserve || 0n),
    OIL: Number(bait.oilReserve || 0.0),
    GAS: Number(bait.gasReserve || 0.0),
  };

  const events = [];
  const rand = Math.random();
  let globalEvent = null;
  if (rand < 0.05) {
    // 5% chance
    const types = ['discovery', 'depletion'];
    globalEvent = types[Math.floor(Math.random() * types.length)];
  }

  for (const resource of Object.keys(DEFAULT_BASE_PRICES)) {
    const baseline = BASELINES[resource];
    const basePrice = DEFAULT_BASE_PRICES[resource];
    const oldPrice = prices[resource].priceInGoldMg;
    let newPrice = computePrice(basePrice, baseline, current[resource]);

    if (globalEvent) {
      if (globalEvent === 'discovery') {
        // supply increases -> price falls
        newPrice = newPrice * 0.7;
      } else if (globalEvent === 'depletion') {
        // supply drops -> price rises
        newPrice = newPrice * 1.5;
      }
    }

    // small random jitter +/-2%
    const jitter = 1 + (Math.random() * 0.04 - 0.02);
    newPrice = newPrice * jitter;
    newPrice = Number(newPrice.toFixed(4));

    // persist
    await prisma.resourcePrice.upsert({
      where: { resource },
      update: { priceInGoldMg: newPrice },
      create: { resource, priceInGoldMg: newPrice }
    });

    io.emit('price_changed', { resource, oldPrice, newPrice, event: globalEvent });
    events.push({ resource, oldPrice, newPrice, event: globalEvent });
  }

  return events;
}

function startPriceEngine(prisma, io, intervalMs = 10 * 60 * 1000) {
  // run immediately then on interval
  updatePricesOnce(prisma, io).catch(err => console.error('[priceService] initial update failed', err));
  const id = setInterval(() => {
    updatePricesOnce(prisma, io).catch(err => console.error('[priceService] update failed', err));
  }, intervalMs);
  return () => clearInterval(id);
}

module.exports = { startPriceEngine, updatePricesOnce };
