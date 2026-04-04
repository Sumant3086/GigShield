const router = require('express').Router();
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const { auth } = require('../middleware/auth');

// GET /api/workers/me
router.get('/me', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id).select('-__v');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/workers/me
router.put('/me', auth, async (req, res) => {
  try {
    const allowed = ['name', 'upiId', 'weeklyEarnings', 'zone', 'city', 'platform'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const worker = await Worker.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(worker);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/workers/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    const policy = await Policy.findOne({ worker: req.user.id, status: 'active' });
    const claims = await Claim.find({ worker: req.user.id }).sort({ createdAt: -1 }).limit(10);
    const totalProtected = claims
      .filter(c => ['approved', 'paid'].includes(c.status))
      .reduce((sum, c) => sum + (c.payoutAmount || 0), 0);
    res.json({ worker, policy, claims, totalProtected });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
