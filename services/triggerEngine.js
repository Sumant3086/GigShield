const TriggerEvent = require('../models/TriggerEvent');
const Policy = require('../models/Policy');
const Worker = require('../models/Worker');
const Claim = require('../models/Claim');
const { runFraudAnalysis } = require('./fraudEngine');
const { simulatePayout } = require('./paymentService');
const { TRIGGER_TYPES, CITIES, PAYOUT_MULTIPLIERS } = require('../config/constants');

// Mock weather/civic data feeds
const MOCK_FEEDS = [
  { type: 'heavy_rainfall', city: 'Bengaluru', zone: 'HSR Layout', value: 72, unit: 'mm/hr', severity: 'red', description: 'IMD Red Alert: Heavy rainfall 72mm/hr in HSR Layout zone' },
  { type: 'extreme_heat', city: 'Hyderabad', zone: 'Hitech City', value: 46, unit: '°C', severity: 'red', description: 'IMD Heat Wave Advisory: 46°C in Hyderabad' },
  { type: 'flood_warning', city: 'Chennai', zone: 'Velachery', value: null, unit: null, severity: 'red', description: 'NDMA Red Flood Alert: Velachery district' },
  { type: 'civic_curfew', city: 'Chennai', zone: 'T. Nagar', value: null, unit: null, severity: 'orange', description: 'Section 144 declared in T. Nagar zone' },
  { type: 'platform_halt', city: 'Mumbai', zone: 'Andheri', value: null, unit: null, severity: 'red', description: 'Amazon Flex suspended operations in Andheri zone' },
];

const THRESHOLDS = {
  heavy_rainfall: 64.5,  // mm/hr
  extreme_heat: 45,       // °C
};

async function runTriggerEngine() {
  console.log('[TriggerEngine] Running at', new Date().toISOString());
  // In production: fetch from real IMD/OpenWeatherMap APIs
  // For demo: randomly activate one mock feed occasionally
  if (Math.random() > 0.7) {
    const feed = MOCK_FEEDS[Math.floor(Math.random() * MOCK_FEEDS.length)];
    await simulateDisruption(feed);
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
