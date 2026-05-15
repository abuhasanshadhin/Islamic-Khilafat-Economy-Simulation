// Mining service: runs a cycle every 5 minutes to simulate extractions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function startMining(prisma, io, intervalMs = 5 * 60 * 1000) {
  async function cycle() {
    try {
      // random increments
      const goldInc = BigInt(getRandomInt(500, 2000)); // in mg
      const oilInc = getRandomFloat(0.5, 3.0, 3);
      const gasInc = getRandomFloat(0.2, 1.5, 3);

      const result = await prisma.$transaction(async (tx) => {
        // ensure we update the single BaitulMal record with id:1
        const existing = await tx.baitulMal.findUnique({ where: { id: 1 } });
        if (!existing) {
          // create if absent
          await tx.baitulMal.create({ data: { id: 1, goldReserve: goldInc, oilReserve: oilInc, gasReserve: gasInc, totalZakatCollected: 0n } });
        } else {
          await tx.baitulMal.update({
            where: { id: 1 },
            data: {
              goldReserve: existing.goldReserve + goldInc,
              oilReserve: existing.oilReserve + oilInc,
              gasReserve: existing.gasReserve + gasInc,
            }
          });
        }

        // create a mining log if the model exists
        try {
          await tx.miningLog.create({ data: { baitulMalId: 1, goldExtracted: goldInc, oilExtracted: oilInc, gasExtracted: gasInc } });
        } catch (e) {
          // If migration not applied or model missing, ignore logging but continue
          console.warn('MiningLog create failed (migration may be pending):', e.message || e);
        }

        const updated = await tx.baitulMal.findUnique({ where: { id: 1 } });
        return updated;
      });

      // Prepare safe payload: convert BigInt fields to strings
      const payload = {
        id: result.id,
        goldReserve: result.goldReserve.toString(),
        oilReserve: result.oilReserve,
        gasReserve: result.gasReserve,
        totalZakatCollected: result.totalZakatCollected.toString(),
      };

      // broadcast to all clients
      if (io && io.emit) io.emit('state_reserves_updated', payload);
      console.log('[mining] cycle complete, broadcasted reserves:', payload);
    } catch (err) {
      console.error('[mining] cycle error', err);
    }
  }

  // run immediately, then schedule
  cycle();
  const timer = setInterval(cycle, intervalMs);

  return {
    stop: () => clearInterval(timer),
  };
}

module.exports = { startMining };
