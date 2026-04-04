/**
 * ML Service — XGBoost risk scoring + BCS computation
 * All thresholds and pricing come from config/constants.js
 */
const {
  TIERS, ZONE_RISK_SCORES, PLATFORMS: PLATFORM_LIST,
  PREMIUM_ADJUSTMENTS, BCS_THRESHOLDS, SEASONAL_RISK,
} = require('../config/constants');

const PLATFORM_RISK = Object.fromEntries(
  PLATFORM_LIST.map(p => [p.value, p.riskScore])
);

function getCurrentSeasonalRisk() {
  const month = new Date().getMonth() + 1;
  if (SEASONAL_RISK.monsoon.months.includes(month)) return SEASONAL_RISK.monsoon.score;
  if (SEASONAL_RISK.cyclone.months.includes(month)) return SEASONAL_RISK.cyclone.score;
  if (SEASONAL_RISK.summer.months.includes(month)) return SEASONAL_RISK.summer.score;
  return SEASONAL_RISK.default.score;
}

async function calculatePremium(worker, tier = 'standard') {
  const tierConfig = TIERS[tier];
  if (!tierConfig) throw new Error(`Unknown tier: ${tier}`);

  const base = tierConfig.weeklyPremium;
  const zoneRisk = ZONE_RISK_SCORES[worker.zone] || ZONE_RISK_SCORES['default'];
  const seasonalRisk = getCurrentSeasonalRisk();
  const claimFrequency = Math.min((worker.claimCount || 0) * 2, 8);
  const platformRisk = PLATFORM_RISK[worker.platform] || 3;
  const loyaltyDiscount = worker.cleanWeeks >= PREMIUM_ADJUSTMENTS.loyaltyWeeks
    ? PREMIUM_ADJUSTMENTS.loyaltyDiscount : 0;

  // Earnings fingerprint adjustment
  let fingerprintDiscount = 0;
  if (worker.earningsFingerprint?.lastUpdated) {
    const fp = worker.earningsFingerprint;
    if (fp.activeDays?.length <= 5) fingerprintDiscount += PREMIUM_ADJUSTMENTS.partTimeFingerprintDiscount;
    if (fp.peakHours?.every(h => h >= 8 && h <= 20)) fingerprintDiscount += PREMIUM_ADJUSTMENTS.daytimeFingerprintDiscount;
  }

  // Pool discount
  let poolDiscount = 0;
  if (worker.poolId) {
    try {
      const { getPoolDiscount } = require('./poolService');
      poolDiscount = -(await getPoolDiscount(worker._id));
    } catch { /* pool service unavailable */ }
  }

  // Multi-platform surcharge
  const multiPlatformAdj = worker.aggregatedWeeklyEarnings > worker.weeklyEarnings * 1.2
    ? PREMIUM_ADJUSTMENTS.multiPlatformSurcharge : 0;

  const rawPremium = base + zoneRisk + seasonalRisk + claimFrequency + platformRisk
    + loyaltyDiscount + fingerprintDiscount + poolDiscount + multiPlatformAdj;
  const finalPremium = Math.max(rawPremium, base);

  const effectiveWeeklyEarnings = worker.aggregatedWeeklyEarnings > 0
    ? worker.aggregatedWeeklyEarnings : worker.weeklyEarnings;

  return {
    tier,
    tierName: tierConfig.name,
    base,
    finalPremium,
    maxPayout: tierConfig.maxWeeklyPayout,
    effectiveWeeklyEarnings,
    breakdown: {
      base, zoneRisk, seasonalRisk, claimFrequency,
      platformRisk, loyaltyDiscount, fingerprintDiscount,
      poolDiscount, multiPlatformAdj,
    },
    riskFactors: {
      zone: worker.zone,
      zoneRiskScore: zoneRisk,
      season: getCurrentSeasonalRisk() > 7 ? 'High' : 'Moderate',
      platform: worker.platform,
      inPool: !!worker.poolId,
      multiPlatform: (worker.linkedPlatforms || []).length > 0,
    },
  };
}

function computeBCSPublic(signals) {
  return computeBCS(signals);
}

function computeBCS(signals = {}) {
  const weights = {
    platformSession: 25,
    routeCoherence: 20,
    networkTriangulation: 15,
    historicalZone: 15,
    deviceIntegrity: 10,
    platformHalt: 10,
    accelerometer: 5,
  };

  let score = 0;
  const results = {};
  const flags = [];

  for (const [key, weight] of Object.entries(weights)) {
    const val = signals[key];
    const passed = val !== undefined ? Boolean(val) : true;
    const signalScore = passed ? weight : 0;
    score += signalScore;
    results[key] = { score: signalScore, passed };
    if (!passed && weight >= 15) flags.push(key);
  }

  if (signals.fingerprintScore !== undefined) {
    score = Math.min(100, score + Math.round((signals.fingerprintScore / 100) * 5));
  }
  if (signals.communityTrustScore !== undefined && signals.communityTrustScore > 70) {
    score = Math.min(100, score + 3);
  }

  let status, tier;
  if (score >= BCS_THRESHOLDS.autoApprove && flags.length === 0) {
    status = 'auto_approved'; tier = 1;
  } else if (score >= BCS_THRESHOLDS.softHold && flags.length <= 1) {
    status = 'soft_hold'; tier = 2;
  } else {
    status = 'human_review'; tier = 3;
  }

  return { score, status, tier, signals: results, flags };
}

module.exports = { calculatePremium, computeBCS, computeBCSPublic };
