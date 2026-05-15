// Zakat collector service: runs periodically to collect zakat from eligible users
const DEFAULT_NISAB_MG = 85000n; // 85g = 85000mg

function startZakatCollector(prisma, io, intervalMs = 24 * 60 * 60 * 1000) {
  // intervalMs default is 24h for demo; set via env for faster testing
  async function cycle() {
    try {
      const nisab = BigInt(process.env.ZAKAT_NISAB_MG || DEFAULT_NISAB_MG.toString());

      const users = await prisma.user.findMany();
      for (const user of users) {
        if (!user.goldBalance || user.goldBalance < nisab) continue;

        // 2.5% => 25 / 1000
        const zakat = (user.goldBalance * 25n) / 1000n;
        if (zakat <= 0n) continue;

        await prisma.$transaction(async (tx) => {
          // deduct from user
          const updatedUser = await tx.user.update({ where: { id: user.id }, data: { goldBalance: user.goldBalance - zakat } });

          // ensure BaitulMal id:1 exists
          const bait = await tx.baitulMal.findUnique({ where: { id: 1 } });
          if (!bait) {
            await tx.baitulMal.create({ data: { id: 1, goldReserve: zakat, totalZakatCollected: zakat } });
          } else {
            await tx.baitulMal.update({ where: { id: 1 }, data: { goldReserve: bait.goldReserve + zakat, totalZakatCollected: bait.totalZakatCollected + zakat } });
          }

          // log transaction
          const createdTx = await tx.transaction.create({ data: { senderId: user.id, receiverId: 1, amount: zakat, type: 'ZAKAT' } });

          // emit transaction_created for admin monitoring
          try {
            if (io && io.emit) io.emit('transaction_created', {
              id: createdTx.id,
              type: createdTx.type,
              amount: createdTx.amount.toString(),
              senderId: createdTx.senderId,
              receiverId: createdTx.receiverId,
              timestamp: createdTx.timestamp
            });
          } catch (e) {
            console.warn('Failed to emit transaction_created (zakat)', e.message || e);
          }

          // notify user via socket room
          try {
            const payload = { deducted: zakat.toString(), newBalance: (updatedUser.goldBalance).toString() };
            if (io) io.to(`user:${user.id}`).emit('zakat_deducted', payload);
          } catch (e) {
            console.warn('Failed to send zakat notification', e.message || e);
          }
        });
      }

      console.log('[zakat] cycle complete');
    } catch (err) {
      console.error('[zakat] cycle error', err);
    }
  }

  // run immediately then schedule
  cycle();
  const timer = setInterval(cycle, Number(process.env.ZAKAT_INTERVAL_MS || intervalMs));

  return { stop: () => clearInterval(timer) };
}

module.exports = { startZakatCollector };
