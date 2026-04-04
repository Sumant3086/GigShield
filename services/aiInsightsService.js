/**
 * AI-Powered Earnings Insights & Recommendations
 * Uses worker's earnings fingerprint to provide personalized advice
 * Helps workers optimize their earnings and reduce risk exposure
 */

const Worker = require('../models/Worker');
const Claim = require('../models/Claim');
const DisruptionForecast = require('../models/DisruptionForecast');

/**
 * Generate personalized insights for a worker
 */
async function generateWorkerInsights(workerId) {
  const worker = await Worker.findById(workerId);
  if (!worker) return null;

  const insights = [];
  const fp = worker.earningsFingerprint;

  // 1. Peak hours optimization
  if (fp?.peakHours?.length > 0) {
    const avgHour = fp.peakHours.reduce((a, b) => a + b, 0) / fp.peakHours.length;
    if (avgHour > 18) {
      insights.push({
        type: 'earnings_optimization',
        priority: 'medium',
        icon: '🌙',
        title: 'Night Shift Premium Opportunity',
        message: `You work mostly after 6 PM. Consider registering for night shift bonuses on ${worker.platform}. Potential +15-20% earnings.`,
        action: 'Learn More',
        actionUrl: '/income',
      });
    }
  }

  // 2. Multi-platform recommendation
  if (!worker.linkedPlatforms || worker.linkedPlatforms.length === 0) {
    const potentialIncrease = Math.round(worker.weeklyEarnings * 0.4);
    insights.push({
      type: 'income_growth',
      priority: 'high',
      icon: '📱',
      title: 'Unlock 40% More Income',
      message: `Workers in ${worker.zone} running 2+ apps earn ₹${potentialIncrease} more per week. Link your other platforms.`,
      action: 'Link Platforms',
      actionUrl: '/income',
    });
  }

  // 3. Zone risk analysis
  const recentClaims = await Claim.countDocuments({
    worker: workerId,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  if (recentClaims >= 2) {
    insights.push({
      type: 'risk_alert',
      priority: 'high',
      icon: '⚠️',
      title: 'High Disruption Zone',
      message: `${recentClaims} claims in 30 days. Consider shifting to lower-risk zones like ${getSaferZones(worker.city, worker.zone)[0]}.`,
      action: 'View Safe Zones',
      actionUrl: '/dashboard',
    });
  }

  // 4. Pool recommendation
  if (!worker.poolId) {
    insights.push({
      type: 'savings',
      priority: 'medium',
      icon: '🤝',
      title: 'Save ₹8-12/week with Pools',
      message: `Join ${worker.zone} risk pool. Healthy pools get up to 15% discount. No extra work required.`,
      action: 'Join Pool',
      actionUrl: '/dashboard',
    });
  }

  // 5. Forecast-based recommendations
  const upcomingForecasts = await DisruptionForecast.find({
    city: worker.city,
    zone: worker.zone,
    isActive: true,
    confidence: { $gte: 60 },
    forecastedFor: { $gte: new Date(), $lte: new Date(Date.now() + 48 * 60 * 60 * 1000) },
  }).sort({ confidence: -1 }).limit(1);

  if (upcomingForecasts.length > 0) {
    const forecast = upcomingForecasts[0];
    insights.push({
      type: 'forecast_action',
      priority: 'urgent',
      icon: '🔮',
      title: 'Disruption Alert - Take Action',
      message: `${forecast.type.replace(/_/g, ' ')} likely in ${forecast.zone} (${forecast.confidence}% confidence). ${forecast.recommendation}`,
      action: 'View Forecast',
      actionUrl: '/dashboard',
    });
  }

  // 6. Earnings consistency analysis
  if (fp?.activeDays?.length <= 4) {
    const potentialIncrease = Math.round((worker.weeklyEarnings / fp.activeDays.length) * (7 - fp.activeDays.length));
    insights.push({
      type: 'earnings_optimization',
      priority: 'low',
      icon: '📊',
      title: 'Consistency Bonus Available',
      message: `You work ${fp.activeDays.length} days/week. Adding 2 more days could earn you ₹${potentialIncrease} extra weekly.`,
      action: 'See Schedule',
      actionUrl: '/income',
    });
  }

  return {
    workerId,
    generatedAt: new Date(),
    insights: insights.sort((a, b) => {
      const priority = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priority[a.priority] - priority[b.priority];
    }),
    totalInsights: insights.length,
  };
}

/**
 * Get safer alternative zones
 */
function getSaferZones(city, currentZone) {
  const SAFE_ZONES = {
    Bengaluru: ['Indiranagar', 'Koramangala', 'Jayanagar'],
    Chennai: ['Anna Nagar', 'Adyar', 'Porur'],
    Hyderabad: ['Banjara Hills', 'Gachibowli', 'Madhapur'],
    Mumbai: ['Bandra', 'Borivali', 'Thane'],
    Delhi: ['Connaught Place', 'Saket', 'Dwarka'],
  };

  return (SAFE_ZONES[city] || []).filter(z => z !== currentZone);
}

/**
 * Calculate worker's risk score (0-100, lower is better)
 */
async function calculateWorkerRiskScore(workerId) {
  const worker = await Worker.findById(workerId);
  if (!worker) return null;

  let riskScore = 50; // baseline

  // Recent claims increase risk
  const recentClaims = await Claim.countDocuments({
    worker: workerId,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });
  riskScore += recentClaims * 10;

  // Zone risk
  const { ZONE_RISK_SCORES } = require('../config/constants');
  const zoneRisk = ZONE_RISK_SCORES[worker.zone] || 10;
  riskScore += zoneRisk;

  // Multi-platform reduces risk (diversification)
  if (worker.linkedPlatforms?.length > 0) {
    riskScore -= worker.linkedPlatforms.length * 5;
  }

  // Pool membership reduces risk
  if (worker.poolId) {
    riskScore -= 8;
  }

  // Community trust score
  if (worker.communityTrustScore > 70) {
    riskScore -= 5;
  }

  return {
    score: Math.max(0, Math.min(100, riskScore)),
    level: riskScore < 40 ? 'low' : riskScore < 70 ? 'medium' : 'high',
    factors: {
      recentClaims,
      zoneRisk,
      multiPlatform: worker.linkedPlatforms?.length || 0,
      inPool: !!worker.poolId,
      communityTrust: worker.communityTrustScore,
    },
  };
}

module.exports = {
  generateWorkerInsights,
  calculateWorkerRiskScore,
  getSaferZones,
};
