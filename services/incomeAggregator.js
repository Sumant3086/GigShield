const Worker = require('../models/Worker');

/**
 * Platform-Agnostic Income Aggregator
 *
 * Most gig workers run 2-3 delivery apps simultaneously.
 * A worker earning ₹2,500/week on Swiggy + ₹2,000/week on Zomato
 * has a true income of ₹4,500 — but single-platform verification
 * would undercount their loss and underpay their claim.
 *
 * This service aggregates earnings across all linked platforms
 * to build an accurate income baseline for premium pricing and payouts.
 *
 * In production: OAuth integrations with each platform's earnings API.
 * Here: simulated verification with realistic variance.
 */

const PLATFORM_LABELS = {
  amazon_flex: 'Amazon Flex',
  flipkart_quick: 'Flipkart Quick',
  swiggy: 'Swiggy',
  zomato: 'Zomato',
  dunzo: 'Dunzo',
};

// Simulated platform earnings API response
function simulatePlatformEarnings(platform, baseEarnings) {
  // Each platform contributes a realistic fraction of total income
  const fractions = {
    amazon_flex: 0.85,    // usually primary platform
    flipkart_quick: 0.80,
    swiggy: 0.55,         // often secondary
    zomato: 0.50,
    dunzo: 0.40,          // usually tertiary
  };
  const fraction = fractions[platform] || 0.6;
  const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
  return Math.round(baseEarnings * (fraction + variance));
}

async function verifyAndAggregateIncome(workerId) {
  const worker = await Worker.findById(workerId);
  if (!worker) throw new Error('Worker not found');

  const platforms = [
    { platform: worker.platform, isPrimary: true },
    ...(worker.linkedPlatforms || []).filter(p => p.active),
  ];

  const verified = [];
  let total = 0;

  for (const p of platforms) {
    const earnings = simulatePlatformEarnings(p.platform, worker.weeklyEarnings);
    verified.push({
      platform: p.platform,
      label: PLATFORM_LABELS[p.platform],
      weeklyEarnings: earnings,
      verifiedAt: new Date(),
      active: true,
    });
    total += earnings;
  }

  // Cap at realistic maximum (₹12,000/week for multi-platform)
  const aggregated = Math.min(total, 12000);

  await Worker.findByIdAndUpdate(workerId, {
    linkedPlatforms: verified,
    aggregatedWeeklyEarnings: aggregated,
    earningsVerifiedAt: new Date(),
  });

  return {
    platforms: verified,
    aggregatedWeeklyEarnings: aggregated,
    singlePlatformEarnings: worker.weeklyEarnings,
    uplift: aggregated - worker.weeklyEarnings,
    upliftPercent: Math.round(((aggregated - worker.weeklyEarnings) / worker.weeklyEarnings) * 100),
    verifiedAt: new Date(),
  };
}

async function addLinkedPlatform(workerId, platform) {
  const worker = await Worker.findById(workerId);
  if (!worker) throw new Error('Worker not found');
  if (worker.platform === platform) throw new Error('Already your primary platform');

  const existing = (worker.linkedPlatforms || []).find(p => p.platform === platform);
  if (existing) throw new Error('Platform already linked');

  const earnings = simulatePlatformEarnings(platform, worker.weeklyEarnings);
  const newPlatform = { platform, weeklyEarnings: earnings, verifiedAt: new Date(), active: true };

  await Worker.findByIdAndUpdate(workerId, {
    $push: { linkedPlatforms: newPlatform },
  });

  // Re-aggregate
  return verifyAndAggregateIncome(workerId);
}

async function removeLinkedPlatform(workerId, platform) {
  await Worker.findByIdAndUpdate(workerId, {
    $pull: { linkedPlatforms: { platform } },
  });
  return verifyAndAggregateIncome(workerId);
}

module.exports = { verifyAndAggregateIncome, addLinkedPlatform, removeLinkedPlatform };
