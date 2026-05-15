const { ReportEntity } = require('../entities/Report');
const { UserEntity } = require('../entities/User');

async function calculateReputation(dataSource, io, accusedId) {
  const validCount = await dataSource.getRepository(ReportEntity).countBy({ accusedId, status: 'VALID' });

  const user = await dataSource.getRepository(UserEntity).findOneBy({ id: accusedId });
  if (!user) return null;

  const decrease = validCount * 10;
  let newScore = user.reputationScore - decrease;
  if (newScore < 0) newScore = 0;

  await dataSource.getRepository(UserEntity).update({ id: accusedId }, { reputationScore: newScore });

  try {
    if (io) io.to(`user:${accusedId}`).emit('reputation_changed', { newScore });
  } catch (e) {
    console.warn('Failed to emit reputation_changed', e.message || e);
  }

  return { ...user, reputationScore: newScore };
}

function canCreateListing(user) {
  if (!user) return false;
  return user.reputationScore >= (Number(process.env.REPUTATION_LISTING_THRESHOLD || 40));
}

module.exports = { calculateReputation, canCreateListing };
