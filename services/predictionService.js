const DisruptionForecast = require('../models/DisruptionForecast');
const Worker = require('../models/Worker');
const { CITIES, TRIGGER_TYPES, SEASONAL_RISK } = require('../config/constants');

/**
 * 48-Hour Disruption Prediction Engine
 *
 * Instead of reacting to events after they happen, GigShield predicts
 * disruptions 48 hours ahead using IMD forecast data + historical patterns.
 * Workers get advance warnings and zone-shift recommendations.
 *
 * In production: calls real IMD forecast API + trained time-series model.
 * Here: uses seasonal patterns + historical event frequency per zone.
 */

// Historical disruption frequency per zone (events per month, mock data)
const ZONE_DISRUPTION_HISTORY = {
  'HSR Layout':    { heavy_rainfall: 3.2, flood_warning: 1.1, extreme_heat: 0.2 },
  'Koramangala':   { heavy_rainfall: 2.8, flood_warning: 0.8, extreme_heat: 0.2 },
  'Velachery':     { heavy_rainfall: 2.1, flood_warning: 2.4, extreme_heat: 0.5 },
  'T. Nagar':      { heavy_rainfall: 1.8, flood_warning: 1.9, civic_curfew: 0.6 },
  'Hitech City':   { extreme_heat: 2.8, heavy_rainfall: 0.9, flood_warning: 0.3 },
  'Banjara Hills': { extreme_heat: 2.5, heavy_rainfall: 0.7, flood_warning: 0.2 },
  'Andheri':       { heavy_rainfall: 2.2, flood_warning: 1.3, platform_halt: 0.4 },
  'default':       { heavy_rainfall: 1.5, extreme_heat: 1.0, flood_warning: 0.8 },
};

// Safe alternative zones per city
const ALTERNATIVE_ZONES = {
  Bengaluru: { 'HSR Layout': ['Koramangala', 'Indiranagar'], 'Whitefield': ['Indiranagar', 'Koramangala'] },
  Chennai:   { 'Velachery': ['Anna Nagar', 'Adyar'], 'T. Nagar': ['Anna Nagar', 'Adyar'] },
  Hyderabad: { 'Hitech City': ['Banjara Hills', 'Gachibowli'], 'Madhapur': ['Gachibowli', 'Banjara Hills'] },
  Mumbai:    { 'Andheri': ['Bandra', 'Borivali'], 'Kurla': ['Bandra', 'Thane'] },
};

function getSeasonalMultiplier(type) {
  const month = new Date().getMonth() + 1;
  const isMonsoon = SEASONAL_RISK.monsoon.months.includes(month);
  const isCyclone = SEASONAL_RISK.cyclone.months.includes(month);
  const isSummer  = SEASONAL_RISK.summer.months.includes(month);

  if (type === 'heavy_rainfall' || type === 'flood_warning') {
    if (isMonsoon) return 2.5;
    if (isCyclone) return 1.5;
    return 0.3;
  }
  if (type === 'extreme_heat') {
    if (isSummer) return 2.8;
    return 0.2;
  }
  return 1.0;
}

function buildRecommendation(type, zone, city, confidence) {
  const alts = ALTERNATIVE_ZONES[city]?.[zone] || [];
  const altText = alts.length > 0 ? ` Consider shifting to ${alts.join(' or ')}.` : '';
  const msgs = {
    heavy_rainfall: `Heavy rainfall expected in ${zone} within 48 hours.${altText} Secure your vehicle and check waterproofing.`,
    flood_warning:  `Flood risk elevated in ${zone}.${altText} Avoid low-lying delivery routes.`,
    extreme_heat:   `Extreme heat advisory likely for ${zone}. Plan early morning shifts (before 10 AM).${altText}`,
    civic_curfew:   `Civic disruption risk in ${zone}. Monitor local news and keep alternate routes ready.`,
    platform_halt:  `Platform suspension risk in ${zone}. Consider registering on a backup platform.`,
  };
  return msgs[type] || `Disruption risk elevated in ${zone}.${altText}`;
}

async function runPredictionEngine() {
  console.log('[PredictionEngine] Running forecast at', new Date().toISOString());

  // Build zone list dynamically from config
  const zones = [];
  for (const [city, data] of Object.entries(CITIES)) {
    for (const zone of data.zones.slice(0, 3)) { // top 3 zones per city
      zones.push({ zone, city });
    }
  }

  const types = TRIGGER_TYPES.map(t => t.key);
  let created = 0;

  for (const { zone, city } of zones) {
    const history = ZONE_DISRUPTION_HISTORY[zone] || ZONE_DISRUPTION_HISTORY['default'];

    for (const type of types) {
      const baseFreq = history[type] || 0.3;
      const seasonal = getSeasonalMultiplier(type);
      // Probability of event in next 48 hours
      const prob = Math.min(0.95, (baseFreq / 30) * seasonal * 48);
      const confidence = Math.round(prob * 100);

      if (confidence < 20) continue; // not worth forecasting

      // Don't duplicate active forecasts
      const forecastedFor = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr from now
      const existing = await DisruptionForecast.findOne({
        type, zone, city, isActive: true,
        forecastedFor: { $gte: new Date(), $lte: new Date(Date.now() + 48 * 60 * 60 * 1000) },
      });
      if (existing) continue;

      const severity = confidence > 70 ? 'high' : confidence > 45 ? 'moderate' : 'low';
      const alts = ALTERNATIVE_ZONES[city]?.[zone] || [];

      await DisruptionForecast.create({
        type, zone, city,
        forecastedFor,
        forecastedUntil: new Date(forecastedFor.getTime() + 6 * 60 * 60 * 1000),
        confidence,
        predictedSeverity: severity,
        dataSources: ['IMD Forecast API', 'Historical Pattern Model', 'Seasonal Index'],
        recommendation: buildRecommendation(type, zone, city, confidence),
        alternativeZones: alts,
        isActive: true,
      });
      created++;
    }
  }

  console.log(`[PredictionEngine] Created ${created} forecasts`);
}

async function getForecastsForWorker(zone, city) {
  return DisruptionForecast.find({
    city, isActive: true,
    forecastedFor: { $gte: new Date() },
    $or: [{ zone }, { zone: { $in: [zone, 'ALL'] } }],
  }).sort({ confidence: -1, forecastedFor: 1 }).limit(5);
}

async function markForecastActedOn(forecastId, workerId) {
  await DisruptionForecast.findByIdAndUpdate(forecastId, { $inc: { notifiedWorkers: 1 } });
  await Worker.findByIdAndUpdate(workerId, { $inc: { forecastsActedOn: 1 } });
}

module.exports = { runPredictionEngine, getForecastsForWorker, markForecastActedOn };
