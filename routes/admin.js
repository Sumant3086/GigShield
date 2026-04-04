const router = require('express').Router();
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const TriggerEvent = require('../models/TriggerEvent');
const { adminAuth } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [workers, activePolicies, claims, triggers] = await Promise.all([
      Worker.countDocuments(),
      Policy.countDocuments({ status: 'active' }),
      Claim.find(),
      TriggerEvent.find({ isActive: true }),
    ]);

    const totalPremium = await Policy.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPremiumPaid' } } }
    ]);
    const totalPayout = await Claim.aggregate([
      { $match: { status: { $in: ['approved', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$payoutAmount' } } }
    ]);

    const claimsByStatus = claims.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const cityBreakdown = await Policy.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$city', count: { $sum: 1 }, premium: { $sum: '$weeklyPremium' } } }
    ]);

    res.json({
      workers,
      activePolicies,
      totalClaims: claims.length,
      claimsByStatus,
      totalPremiumCollected: totalPremium[0]?.total || 0,
      totalPayoutIssued: totalPayout[0]?.total || 0,
      activeTriggers: triggers.length,
      cityBreakdown,
      lossRatio: totalPremium[0]?.total
        ? ((totalPayout[0]?.total || 0) / totalPremium[0].total * 100).toFixed(1)
        : 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/workers
router.get('/workers', adminAuth, async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 }).limit(50);
    res.json(workers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/bcs-distribution
router.get('/bcs-distribution', adminAuth, async (req, res) => {
  try {
    const claims = await Claim.find({ bcsScore: { $gt: 0 } }, 'bcsScore status');
    const buckets = { '0-34': 0, '35-59': 0, '60-100': 0 };
    claims.forEach(c => {
      if (c.bcsScore < 35) buckets['0-34']++;
      else if (c.bcsScore < 60) buckets['35-59']++;
      else buckets['60-100']++;
    });
    res.json(buckets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
