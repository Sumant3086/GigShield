const router = require('express').Router();
const { calculatePremium, computeBCSPublic } = require('../services/mlService');
const { auth } = require('../middleware/auth');
const Worker = require('../models/Worker');

// GET /api/ml/premium-quote
router.get('/premium-quote', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    const results = await Promise.all(
      ['basic', 'standard', 'pro'].map(tier => calculatePremium(worker, tier))
    );
    res.json({ basic: results[0], standard: results[1], pro: results[2] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ml/bcs-score  — compute BCS for a claim scenario
router.post('/bcs-score', auth, async (req, res) => {
  try {
    const result = computeBCSPublic(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
