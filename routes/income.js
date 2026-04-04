const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { verifyAndAggregateIncome, addLinkedPlatform, removeLinkedPlatform } = require('../services/incomeAggregator');
const { buildFingerprint } = require('../services/fingerprintService');
const Worker = require('../models/Worker');

// GET /api/income/profile  — worker's income profile
router.get('/profile', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id)
      .select('platform linkedPlatforms weeklyEarnings aggregatedWeeklyEarnings earningsVerifiedAt earningsFingerprint');
    res.json(worker);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/income/verify  — verify and aggregate income across all platforms
router.post('/verify', auth, async (req, res) => {
  try {
    const result = await verifyAndAggregateIncome(req.user.id);
    // Also rebuild fingerprint
    await buildFingerprint(req.user.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/income/link  — link a new platform
router.post('/link', auth, async (req, res) => {
  try {
    const { platform } = req.body;
    if (!platform) return res.status(400).json({ error: 'Platform required' });
    const result = await addLinkedPlatform(req.user.id, platform);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/income/link/:platform  — unlink a platform
router.delete('/link/:platform', auth, async (req, res) => {
  try {
    const result = await removeLinkedPlatform(req.user.id, req.params.platform);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/income/fingerprint  — rebuild earnings fingerprint
router.post('/fingerprint', auth, async (req, res) => {
  try {
    const fingerprint = await buildFingerprint(req.user.id);
    res.json(fingerprint);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
