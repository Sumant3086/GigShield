const TriggerEvent = require('../models/TriggerEvent');
const Policy = require('../models/Policy');
const Worker = require('../models/Worker');
const Claim = require('../models/Claim');
const { runFraudAnalysis } = require('./fraudEngine');
const { simulatePayout } = require('./paymentService');
const { TRIGGER_TYPES, CITIES, PAYOUT_MULTIPLIERS } = require('../config/constants');

const THRESHOLDS = {
  heavy_rainfall: 64.5,  // mm/hr
  extreme_heat: 45,       // °C
};

async function runTriggerEngine() {
  console.log('[TriggerEngine] Running at', new Date().toISOString());

  // Fetch live weather from OpenWeather API
  if (process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'mock_key') {
    await checkLiveWeather();
  } else {
    console.log('[TriggerEngine] No OpenWeather API key configured. Skipping weather check.');
  }
}

// Fetch real weather from OpenWeatherMap and trigger if thresholds exceeded
async function checkLiveWeather() {
  const axios = require('axios');
  const { CITIES } = require('../config/constants');
  const cityCoords = {
    Bengaluru: { lat: 12.9716, lon: 77.5946 },
    Chennai:   { lat: 13.0827, lon: 80.2707 },
    Hyderabad: { lat: 17.3850, lon: 78.4867 },
    Mumbai:    { lat: 19.0760, lon: 72.8777 },
    Delhi:     { lat: 28.6139, lon: 77.2090 },
  };

  for (const [city, coords] of Object.entries(cityCoords)) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
      const { data } = await axios.get(url);
      const rain = data.rain?.['1h'] || 0;       // mm in last hour
      const temp = data.main?.temp || 0;
      const zones = Object.values(CITIES)[Object.keys(CITIES).indexOf(city)]?.zones || [];
      const zone = zones[0];

      // Heavy rainfall threshold: 64.5 mm/hr
      if (rain >= 64.5) {
        console.log(`[TriggerEngine] LIVE: Heavy rainfall ${rain}mm/hr in ${city}`);
        await simulateDisruption({ type: 'heavy_rainfall', severity: rain >= 100 ? 'disaster' : 'red', zone, city, description: `IMD/OWM: Heavy rainfall ${rain.toFixed(1)}mm/hr detected in ${city}`, value: rain, unit: 'mm/hr' });
      }
      // Extreme heat threshold: 45°C
      if (temp >= 45) {
        console.log(`[TriggerEngine] LIVE: Extreme heat ${temp}°C in ${city}`);
        await simulateDisruption({ type: 'extreme_heat', severity: 'red', zone, city, description: `IMD/OWM: Extreme heat ${temp.toFixed(1)}°C detected in ${city}`, value: temp, unit: '°C' });
      }
    } catch (e) {
      console.warn(`[TriggerEngine] Weather fetch failed for ${city}:`, e.message);
    }
  }
}

async function simulateDisruption({ type, severity = 'red', zone, city, description, value, unit }) {
  // Check if same event already active
  const existing = await TriggerEvent.findOne({ type, zone, city, isActive: true });
  if (existing) return { message: 'Event already active', event: existing };

  const dataSources = getDataSources(type);
  const event = await TriggerEvent.create({
    type, severity, zone, city, description, value, unit,
    dataSources,
    validatedSources: dataSources.length,
    isActive: true,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
  });

  console.log(`[TriggerEngine] Event created: ${type} in ${zone}, ${city}`);

  // Find all active policies in this zone/city
  const policies = await Policy.find({ zone, city, status: 'active' }).populate('worker');
  console.log(`[TriggerEngine] Found ${policies.length} active policies in ${zone}`);

  let claimsCreated = 0;
  for (const policy of policies) {
    const worker = policy.worker;
    if (!worker) continue;

    // Skip if claim already exists for this event
    const existingClaim = await Claim.findOne({
      worker: worker._id,
      triggerType: type,
      createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    });
    if (existingClaim) continue;

    // Run fraud analysis
    const bcsResult = await runFraudAnalysis(worker, event);

    // Calculate payout using config multipliers
    const dailyRate = Math.round(worker.weeklyEarnings / 6);
    const multiplier = PAYOUT_MULTIPLIERS[severity] || PAYOUT_MULTIPLIERS.red;
    const rawPayout = Math.round(dailyRate * multiplier);
    const payoutAmount = Math.min(rawPayout, policy.maxWeeklyPayout);

    const claim = await Claim.create({
      worker: worker._id,
      policy: policy._id,
      triggerType: type,
      triggerSeverity: severity,
      zone, city,
      eventDescription: description,
      dailyRate,
      severityMultiplier: multiplier,
      payoutAmount,
      bcsScore: bcsResult.score,
      bcsSignals: bcsResult.signals,
      fraudFlags: bcsResult.flags,
      status: bcsResult.status,
      dataSources,
    });

    // Auto-process based on BCS tier
    if (bcsResult.status === 'auto_approved') {
      await simulatePayout(claim);
    }

    claimsCreated++;
  }

  event.claimsInitiated = claimsCreated;
  await event.save();

  return { event, claimsCreated };
}

function getDataSources(type) {
  const triggerConfig = TRIGGER_TYPES.find(t => t.key === type);
  if (triggerConfig) return [triggerConfig.source];
  return ['IMD API'];
}

module.exports = { runTriggerEngine, simulateDisruption };
