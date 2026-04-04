const RiskPool = require('../models/RiskPool');
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');

/**
 * Cooperative Risk Pool Service
 * Workers in the same zone form micro-pools. When the pool is healthy
 * (low claims), everyone pays less. Mutual insurance, not corporate insurance.
 */

async function getOrCreatePool(zone, city) {
  let pool = await RiskPool.findOne({ zone, city, status: { $in: ['forming', 'active'] } });
  if (!pool) {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    pool = await RiskPool.create({
      zone, city,
      name: `${zone} Mutual Pool`,
      weekStart: monday,
      weekEnd: sunday,
      status: 'forming',
    });
  }
  return pool;
}

async function joinPool(workerId, zone, city) {
  const pool = await getOrCreatePool(zone, city);

  // Already a member?
  if (pool.members.includes(workerId)) {
    return { pool, alreadyMember: true };
  }

  if (pool.members.length >= pool.maxMembers) {
    // Create a new pool for this zone
    const newPool = await RiskPool.create({
      zone, city,
      name: `${zone} Mutual Pool #${Date.now()}`,
      status: 'forming',
    });
    newPool.members.push(workerId);
    await newPool.save();
    await Worker.findByIdAndUpdate(workerId, { poolId: newPool._id, poolJoinedAt: new Date() });
    return { pool: newPool, alreadyMember: false };
  }

  pool.members.push(workerId);
  if (pool.members.length >= 3) pool.status = 'active';
  await pool.save();
  await Worker.findByIdAndUpdate(workerId, { poolId: pool._id, poolJoinedAt: new Date() });
  return { pool, alreadyMember: false };
}

async function leavePool(workerId) {
  const worker = await Worker.findById(workerId);
  if (!worker.poolId) return { success: false, message: 'Not in a pool' };

  const pool = await RiskPool.findById(worker.poolId);
  if (pool) {
    pool.members = pool.members.filter(m => m.toString() !== workerId.toString());
    if (pool.members.length < 3) pool.status = 'forming';
    await pool.save();
  }
  await Worker.findByIdAndUpdate(workerId, { $unset: { poolId: 1, poolJoinedAt: 1 } });
  return { success: true };
}

async function getPoolStats(poolId) {
  const pool = await RiskPool.findById(poolId).populate('members', 'name zone platform weeklyEarnings');
  if (!pool) return null;

  // Calculate this week's loss ratio
  const weekStart = pool.weekStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const memberIds = pool.members.map(m => m._id || m);

  const [premiums, payouts] = await Promise.all([
    Policy.aggregate([
      { $match: { worker: { $in: memberIds }, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$weeklyPremium' } } }
    ]),
    Claim.aggregate([
      { $match: { worker: { $in: memberIds }, status: { $in: ['approved', 'paid'] }, createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$payoutAmount' } } }
    ]),
  ]);

  const totalPremiums = premiums[0]?.total || 0;
  const totalPayouts = payouts[0]?.total || 0;
  pool.lossRatio = totalPremiums > 0 ? totalPayouts / totalPremiums : 0;
  pool.poolFund = totalPremiums;
  pool.totalPayouts = totalPayouts;
  pool.recalculate();
  await pool.save();

  return {
    pool,
    totalPremiums,
    totalPayouts,
    memberCount: pool.members.length,
    discountPercent: pool.discountPercent,
    healthScore: pool.healthScore,
    lossRatio: (pool.lossRatio * 100).toFixed(1),
    savingsPerMember: totalPremiums > 0
      ? Math.round((totalPremiums * pool.discountPercent / 100) / Math.max(pool.members.length, 1))
      : 0,
  };
}

async function getPoolDiscount(workerId) {
  const worker = await Worker.findById(workerId);
  if (!worker?.poolId) return 0;
  const pool = await RiskPool.findById(worker.poolId);
  if (!pool || pool.status === 'forming') return 0;
  return pool.discountPercent || 0;
}

async function listPoolsForCity(city) {
  return RiskPool.find({ city, status: { $in: ['forming', 'active'] } })
    .select('zone name members status healthScore discountPercent lossRatio')
    .lean();
}

module.exports = { getOrCreatePool, joinPool, leavePool, getPoolStats, getPoolDiscount, listPoolsForCity };
