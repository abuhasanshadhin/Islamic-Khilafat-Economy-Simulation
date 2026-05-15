const { UserEntity } = require('../entities/User');
const { BaitulMalEntity } = require('../entities/BaitulMal');
const { TransactionEntity } = require('../entities/Transaction');

const DEFAULT_NISAB_MG = 85000n;

function startZakatCollector(dataSource, io, intervalMs = 24 * 60 * 60 * 1000) {
  async function cycle() {
    try {
      const nisab = BigInt(process.env.ZAKAT_NISAB_MG || DEFAULT_NISAB_MG.toString());

      const users = await dataSource.getRepository(UserEntity).find();
      for (const user of users) {
        if (!user.goldBalance || user.goldBalance < nisab) continue;

        const zakat = (user.goldBalance * 25n) / 1000n;
        if (zakat <= 0n) continue;

        await dataSource.transaction(async (manager) => {
          const freshUser = await manager.findOneBy(UserEntity, { id: user.id });
          if (!freshUser || freshUser.goldBalance < zakat) return;

          await manager.update(UserEntity, { id: user.id }, {
            goldBalance: (freshUser.goldBalance - zakat).toString(),
          });

          const bait = await manager.findOneBy(BaitulMalEntity, { id: 1 });
          if (!bait) {
            await manager.save(BaitulMalEntity, { id: 1, goldReserve: zakat, totalZakatCollected: zakat });
          } else {
            await manager.update(BaitulMalEntity, { id: 1 }, {
              goldReserve: (bait.goldReserve + zakat).toString(),
              totalZakatCollected: (bait.totalZakatCollected + zakat).toString(),
            });
          }

          const createdTx = await manager.save(TransactionEntity, {
            senderId: user.id,
            receiverId: 1,
            amount: zakat,
            type: 'ZAKAT',
          });

          try {
            if (io && io.emit) io.emit('transaction_created', {
              id: createdTx.id,
              type: createdTx.type,
              amount: createdTx.amount.toString(),
              senderId: createdTx.senderId,
              receiverId: createdTx.receiverId,
              timestamp: createdTx.timestamp,
            });
          } catch (e) {
            console.warn('Failed to emit transaction_created (zakat)', e.message || e);
          }

          try {
            const newBalance = freshUser.goldBalance - zakat;
            if (io) io.to(`user:${user.id}`).emit('zakat_deducted', {
              deducted: zakat.toString(),
              newBalance: newBalance.toString(),
            });
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

  cycle();
  const timer = setInterval(cycle, Number(process.env.ZAKAT_INTERVAL_MS || intervalMs));
  return { stop: () => clearInterval(timer) };
}

module.exports = { startZakatCollector };
