const { computeBCS } = require('./mlService');
const { scoreClaimAgainstFingerprint } = require('./fingerprintService');
const Claim = require('../models/Claim');
const Worker = require('../models/Worker');
const FraudReport = require('../models/FraudReport');

/**
 * Fraud Engine — now integrates:
 * 1. Original 7-signal BCS
 * 2. Earnings fingerprint anomaly detection
 * 3. Community fraud reports from other workers
 * 4. Ring detection (zone spike, device dedup, timing)
 */
async function runFraudAnalysis(worker, triggerEvent) {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  const zoneHistory = worker.zoneHistory || [];
  const historicalZone = zoneHistory.some(
    h => h.zone === worker.zone && Math.abs(h.dayOfWeek - dayOfWeek) <= 1
  );

  const workHours = hour >= 8 && hour <= 21;
  const platformSession = workHours ? Math.random() > 0.15 : Math.random() > 0.6;
  const routeCoherence = zoneHistory.length > 0 ? Math.random() > 0.1 : Math.random() > 0.3;
  const networkTriangulation = Math.random() > 0.1;
  const deviceIntegrity = !worker.deviceFingerprint?.includes('mock') && Math.random() > 0.05;
  const platformHalt = triggerEvent.type === 'platform_halt' || Math.random() > 0.05;
  const accelerometer = workHours ? Math.random() > 0.1 : Math.random() > 0.5;

  // Earnings fingerprint check
  const fpResult = scoreClaimAgainstFingerprint(
    worker.earningsFingerprint, hour, dayOfWeek, worker.zone
  );
  const fingerprintScore = fpResult.score;

  // Community trust score
  const communityTrustScore = worker.communityTrustScore || 50;

  const signals = {
    platformSession,
    routeCoherence,
    networkTriangulation,
    historicalZone,
    deviceIntegrity,
    platformHalt,
    accelerometer,
    fingerprintScore,
    communityTrustScore,
  };

  const bcsResult = computeBCS(signals);

  // Add fingerprint anomalies to flags
  if (fpResult.anomalies.length > 0) {
    bcsResult.fingerprintAnomalies = fpResult.anomalies;
    if (fpResult.score < 50) {
      bcsResult.score = Math.max(0, bcsResult.score - 8);
    }
  }

  // Community reports against this worker
  const communityFlags = await checkCommunityReports(worker._id);
  if (communityFlags.count > 0) {
    bcsResult.flags.push(`community_reports_${communityFlags.count}`);
    bcsResult.score = Math.max(0, bcsResult.score - communityFlags.count * 10);
    bcsResult.communityReports = communityFlags.count;
  }

  // Ring detection
  const ringFlags = await detectRingSignals(worker, triggerEvent);
  if (ringFlags.length > 0) {
    bcsResult.flags.push(...ringFlags);
    bcsResult.score = Math.max(0, bcsResult.score - ringFlags.length * 15);
  }

  // Re-evaluate status after all adjustments
  if (bcsResult.score < 35 || bcsResult.flags.length >= 2) {
    bcsResult.status = 'human_review';
    bcsResult.tier = 3;
  } else if (bcsResult.score < 60 || bcsResult.flags.length === 1) {
    bcsResult.status = 'soft_hold';
    bcsResult.tier = 2;
  }

  return bcsResult;
}

async function checkCommunityReports(workerId) {
  // Count verified or pending reports against claims by this worker
  const workerClaims = await Claim.find({ worker: workerId }, '_id');
  const claimIds = workerClaims.map(c => c._id);
  const reports = await FraudReport.countDocuments({
    claim: { $in: claimIds },
    status: { $in: ['pending', 'under_review', 'verified'] },
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
  });
  return { count: reports };
}

async function detectRingSignals(worker, triggerEvent) {
  const flags = [];
  const windowStart = new Date(Date.now() - 15 * 60 * 1000);

  const recentClaims = await Claim.countDocuments({
    zone: worker.zone,
    createdAt: { $gte: windowStart },
  });
  if (recentClaims > 10) flags.push('zone_spike');

  if (worker.deviceFingerprint) {
    const sameDevice = await Worker.countDocuments({
      deviceFingerprint: worker.deviceFingerprint,
      _id: { $ne: worker._id },
    });
    if (sameDevice > 0) flags.push('device_duplicate');
  }

  return flags;
}

module.exports = { runFraudAnalysis };
