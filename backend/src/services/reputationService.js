// Reputation management utilities

async function calculateReputation(prisma, io, accusedId) {
  // Count VALID reports against the user
  const validCount = await prisma.report.count({ where: { accusedId, status: 'VALID' } });

  const user = await prisma.user.findUnique({ where: { id: accusedId } });
  if (!user) return null;

  // Decrease reputation by 10 points per valid report
  const decrease = validCount * 10;
  let newScore = user.reputationScore - decrease;
  if (newScore < 0) newScore = 0;

  const updated = await prisma.user.update({ where: { id: accusedId }, data: { reputationScore: newScore } });

  // Notify user of reputation change
  try {
    if (io) io.to(`user:${accusedId}`).emit('reputation_changed', { newScore });
  } catch (e) {
    console.warn('Failed to emit reputation_changed', e.message || e);
  }

  return updated;
}

function canCreateListing(user) {
  if (!user) return false;
  return user.reputationScore >= (Number(process.env.REPUTATION_LISTING_THRESHOLD || 40));
}

module.exports = { calculateReputation, canCreateListing };
