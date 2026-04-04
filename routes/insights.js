const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { generateWorkerInsights, calculateWorkerRiskScore } = require('../services/aiInsightsService');

// GET /api/insights/my — personalized insights for worker
router.get('/my', auth, async (req, res) => {
  try {
    const insights = await generateWorkerInsights(req.user.id);
    res.json(insights);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/insights/risk-score — worker's risk score
router.get('/risk-score', auth, async (req, res) => {
  try {
    const riskScore = await calculateWorkerRiskScore(req.user.id);
    res.json(riskScore);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
