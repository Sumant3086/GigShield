const router = require('express').Router();
const {
  TIERS, PLATFORMS, CITIES, ZONE_RISK_SCORES,
  TRIGGER_TYPES, FRAUD_REPORT_REASONS,
  BCS_THRESHOLDS, PREMIUM_ADJUSTMENTS,
  PAYOUT_MULTIPLIERS, SEASONAL_RISK,
} = require('../config/constants');

/**
 * GET /api/config
 * Returns all platform configuration to the frontend.
 * No hardcoded values in the UI — everything comes from here.
 */
router.get('/', (req, res) => {
  const month = new Date().getMonth() + 1;
  let currentSeason = SEASONAL_RISK.default;
  if (SEASONAL_RISK.monsoon.months.includes(month)) currentSeason = SEASONAL_RISK.monsoon;
  else if (SEASONAL_RISK.cyclone.months.includes(month)) currentSeason = SEASONAL_RISK.cyclone;
  else if (SEASONAL_RISK.summer.months.includes(month)) currentSeason = SEASONAL_RISK.summer;

  res.json({
    tiers: Object.values(TIERS),
    platforms: PLATFORMS,
    cities: Object.entries(CITIES).map(([name, data]) => ({
      name,
      zones: data.zones,
      riskProfile: data.riskProfile,
    })),
    triggerTypes: TRIGGER_TYPES,
    fraudReportReasons: FRAUD_REPORT_REASONS,
    bcsThresholds: BCS_THRESHOLDS,
    premiumAdjustments: PREMIUM_ADJUSTMENTS,
    payoutMultipliers: PAYOUT_MULTIPLIERS,
    currentSeason,
    zoneRiskScores: ZONE_RISK_SCORES,
    coverageItems: [
      { icon: '🌧️', text: 'Heavy rainfall & floods' },
      { icon: '🌡️', text: 'Extreme heat waves' },
      { icon: '🚧', text: 'Civic curfew / Sec 144' },
      { icon: '📦', text: 'Platform delivery halt' },
      { icon: '🌊', text: 'NDMA flood warnings' },
      { icon: '💸', text: 'Automatic UPI payout' },
    ],
    exclusions: [
      'Health or medical expenses',
      'Accident or injury claims',
      'Vehicle repair or maintenance',
      'Life insurance',
      'Income loss from personal reasons',
    ],
    stats: {
      gigWorkersIndia: '12M+',
      avgPayoutTime: '< 2 hours',
      minWeeklyPremium: `₹${Math.min(...Object.values(TIERS).map(t => t.weeklyPremium))}`,
      maxWeeklyPayout: `₹${Math.max(...Object.values(TIERS).map(t => t.maxWeeklyPayout)).toLocaleString('en-IN')}`,
    },
  });
});

module.exports = router;
