const router = require('express').Router();
const { auth, adminAuth } = require('../middleware/auth');
const { getForecastsForWorker, runPredictionEngine, markForecastActedOn } = require('../services/predictionService');
const DisruptionForecast = require('../models/DisruptionForecast');
const Worker = require('../models/Worker');

// GET /api/forecasts/my  — forecasts for worker's zone
router.get('/my', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    const forecasts = await getForecastsForWorker(worker.zone, worker.city);
    res.json(forecasts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/forecasts/:id/acted  — worker acted on forecast (shifted zone)
router.post('/:id/acted', auth, async (req, res) => {
  try {
    await markForecastActedOn(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/forecasts/run  — admin: run prediction engine now
router.post('/run', adminAuth, async (req, res) => {
  try {
    await runPredictionEngine();
    res.json({ success: true, message: 'Prediction engine ran' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/forecasts/all  — admin: all active forecasts
router.get('/all', adminAuth, async (req, res) => {
  try {
    const forecasts = await DisruptionForecast.find({ isActive: true })
      .sort({ confidence: -1, forecastedFor: 1 })
      .limit(50);
    res.json(forecasts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
