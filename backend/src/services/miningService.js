const { BaitulMalEntity } = require('../entities/BaitulMal');
const { MiningLogEntity } = require('../entities/MiningLog');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function startMining(dataSource, io, intervalMs = 5 * 60 * 1000) {
  async function cycle() {
    try {
      const boost = global.miningBoosted ? 2 : 1;
      const goldInc = BigInt(getRandomInt(500, 2000) * boost);
      const oilInc = getRandomFloat(0.5 * boost, 3.0 * boost, 3);
      const gasInc = getRandomFloat(0.2 * boost, 1.5 * boost, 3);

      const result = await dataSource.transaction(async (manager) => {
        const existing = await manager.findOneBy(BaitulMalEntity, { id: 1 });
        if (!existing) {
          await manager.save(BaitulMalEntity, { id: 1, goldReserve: goldInc, oilReserve: oilInc, gasReserve: gasInc, totalZakatCollected: 0n });
        } else {
          await manager.update(BaitulMalEntity, { id: 1 }, {
            goldReserve: (existing.goldReserve + goldInc).toString(),
            oilReserve: existing.oilReserve + oilInc,
            gasReserve: existing.gasReserve + gasInc,
          });
        }

        try {
          await manager.save(MiningLogEntity, { baitulMalId: 1, goldExtracted: goldInc, oilExtracted: oilInc, gasExtracted: gasInc });
        } catch (e) {
          console.warn('MiningLog create failed:', e.message || e);
        }

        return await manager.findOneBy(BaitulMalEntity, { id: 1 });
      });

      const payload = {
        id: result.id,
        goldReserve: result.goldReserve.toString(),
        oilReserve: result.oilReserve,
        gasReserve: result.gasReserve,
        totalZakatCollected: result.totalZakatCollected.toString(),
      };

      if (io && io.emit) io.emit('state_reserves_updated', payload);
      console.log('[mining] cycle complete:', payload);
    } catch (err) {
      console.error('[mining] cycle error', err);
    }
  }

  cycle();
  const timer = setInterval(cycle, intervalMs);
  return { stop: () => clearInterval(timer) };
}

module.exports = { startMining };
