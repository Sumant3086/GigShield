const router = require('express').Router();
const Policy = require('../models/Policy');
const Worker = require('../models/Worker');
const { auth } = require('../middleware/auth');
const { calculatePremium } = require('../services/mlService');

// GET /api/policies/quote  — AI premium quote
router.get('/quote', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    const { tier = 'standard' } = req.query;
    const quote = await calculatePremium(worker, tier);
    res.json(quote);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/policies  — activate policy
router.post('/', auth, async (req, res) => {
  try {
    const { tier } = req.body;
    const worker = await Worker.findById(req.user.id);

    // Deactivate any existing active policy
    await Policy.updateMany({ worker: req.user.id, status: 'active' }, { status: 'expired' });

    const quote = await calculatePremium(worker, tier);
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const TIERS = Policy.TIERS;
    const policy = await Policy.create({
      worker: req.user.id,
      tier,
      weeklyPremium: quote.finalPremium,
      maxWeeklyPayout: TIERS[tier].maxPayout,
      zone: worker.zone,
      city: worker.city,
      startDate: monday,
      endDate: sunday,
      premiumBreakdown: quote.breakdown,
      totalPremiumPaid: quote.finalPremium,
    });

    res.status(201).json(policy);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/policies/active
router.get('/active', auth, async (req, res) => {
  try {
    const policy = await Policy.findOne({ worker: req.user.id, status: 'active' });
    res.json(policy);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/policies
router.get('/', auth, async (req, res) => {
  try {
    const policies = await Policy.find({ worker: req.user.id }).sort({ createdAt: -1 });
    res.json(policies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/policies/:id/pause
router.put('/:id/pause', auth, async (req, res) => {
  try {
    const policy = await Policy.findOneAndUpdate(
      { _id: req.params.id, worker: req.user.id },
      { status: 'paused' }, { new: true }
    );
    res.json(policy);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
