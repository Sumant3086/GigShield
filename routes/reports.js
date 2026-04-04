const router = require('express').Router();
const { auth, adminAuth } = require('../middleware/auth');
const FraudReport = require('../models/FraudReport');
const Worker = require('../models/Worker');
const Claim = require('../models/Claim');
const { PREMIUM_ADJUSTMENTS } = require('../config/constants');

const CREDIT_AMOUNTS = { verified: PREMIUM_ADJUSTMENTS.fraudReportCredit, dismissed: 0 };

// POST /api/reports  — worker submits a fraud report
router.post('/', auth, async (req, res) => {
  try {
    const { claimId, reason, description } = req.body;
    if (!claimId || !reason) return res.status(400).json({ error: 'claimId and reason required' });

    // Can't report your own claim
    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.worker.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot report your own claim' });
    }

    // Prevent duplicate reports
    const existing = await FraudReport.findOne({ reportedBy: req.user.id, claim: claimId });
    if (existing) return res.status(400).json({ error: 'You already reported this claim' });

    const report = await FraudReport.create({
      reportedBy: req.user.id,
      claim: claimId,
      reason,
      description,
    });

    await Worker.findByIdAndUpdate(req.user.id, { $inc: { reportsSubmitted: 1 } });

    res.status(201).json({ report, message: 'Report submitted. You\'ll earn ₹15 credit if verified.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/my  — worker's submitted reports
router.get('/my', auth, async (req, res) => {
  try {
    const reports = await FraudReport.find({ reportedBy: req.user.id })
      .populate('claim', 'triggerType zone city payoutAmount status')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reports/admin/all  — admin: all reports
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await FraudReport.find(filter)
      .populate('reportedBy', 'name phone zone communityTrustScore')
      .populate('claim', 'triggerType zone city payoutAmount status worker')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(reports);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/reports/admin/:id/verify  — admin verifies report → award credits
router.put('/admin/:id/verify', adminAuth, async (req, res) => {
  try {
    const report = await FraudReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const credits = CREDIT_AMOUNTS.verified;
    report.status = 'verified';
    report.creditsAwarded = credits;
    report.creditsPaid = true;
    report.reviewNote = req.body.note || 'Verified by admin';
    report.reviewedAt = new Date();
    report.claimImpacted = true;
    await report.save();

    // Award credits to reporter
    await Worker.findByIdAndUpdate(report.reportedBy, {
      $inc: { communityCredits: credits, reportsVerified: 1, communityTrustScore: 5 },
    });

    // Flag the claim for human review
    await Claim.findByIdAndUpdate(report.claim, {
      $push: { fraudFlags: 'community_verified_report' },
      status: 'human_review',
    });

    res.json({ report, creditsAwarded: credits });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/reports/admin/:id/dismiss  — admin dismisses report
router.put('/admin/:id/dismiss', adminAuth, async (req, res) => {
  try {
    const report = await FraudReport.findByIdAndUpdate(
      req.params.id,
      { status: 'dismissed', reviewNote: req.body.note || 'Dismissed', reviewedAt: new Date() },
      { new: true }
    );
    // Slightly reduce trust score for false reports
    await Worker.findByIdAndUpdate(report.reportedBy, {
      $inc: { communityTrustScore: -2 },
    });
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
