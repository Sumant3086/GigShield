const router = require('express').Router();
const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const Worker = require('../models/Worker');
const { auth, adminAuth } = require('../middleware/auth');
const { simulatePayout } = require('../services/paymentService');

// GET /api/claims  — worker's claims
router.get('/', auth, async (req, res) => {
  try {
    const claims = await Claim.find({ worker: req.user.id }).sort({ createdAt: -1 });
    res.json(claims);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/claims/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findOne({ _id: req.params.id, worker: req.user.id })
      .populate('policy');
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/claims/confirm/:id  — worker one-tap confirm for soft-hold
router.post('/confirm/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findOne({ _id: req.params.id, worker: req.user.id });
    if (!claim || claim.status !== 'soft_hold') {
      return res.status(400).json({ error: 'Claim not in soft hold' });
    }
    claim.status = 'approved';
    await claim.save();
    // Trigger payout
    await simulatePayout(claim);
    res.json(claim);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: GET /api/claims/admin/all
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { status, city } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = city;
    const claims = await Claim.find(filter)
      .populate('worker', 'name phone zone city platform')
      .populate('policy', 'tier weeklyPremium')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(claims);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: PUT /api/claims/admin/:id/approve
router.put('/admin/:id/approve', adminAuth, async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', reviewNote: req.body.note || 'Approved by admin' },
      { new: true }
    );
    await simulatePayout(claim);
    res.json(claim);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: PUT /api/claims/admin/:id/reject
router.put('/admin/:id/reject', adminAuth, async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', reviewNote: req.body.note || 'Rejected by admin' },
      { new: true }
    );
    res.json(claim);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
