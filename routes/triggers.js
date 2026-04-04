const router = require('express').Router();
const TriggerEvent = require('../models/TriggerEvent');
const { auth, adminAuth } = require('../middleware/auth');
const { runTriggerEngine, simulateDisruption } = require('../services/triggerEngine');

// GET /api/triggers/active
router.get('/active', auth, async (req, res) => {
  try {
    const { city } = req.query;
    const filter = { isActive: true };
    if (city) filter.city = city;
    const triggers = await TriggerEvent.find(filter).sort({ detectedAt: -1 });
    res.json(triggers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/triggers  — all recent
router.get('/', adminAuth, async (req, res) => {
  try {
    const triggers = await TriggerEvent.find().sort({ detectedAt: -1 }).limit(50);
    res.json(triggers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/triggers/simulate  — admin: simulate a disruption event
router.post('/simulate', adminAuth, async (req, res) => {
  try {
    const { type, severity, zone, city, description, value, unit } = req.body;
    const result = await simulateDisruption({ type, severity, zone, city, description, value, unit });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/triggers/run-engine  — manually trigger the engine
router.post('/run-engine', adminAuth, async (req, res) => {
  try {
    await runTriggerEngine();
    res.json({ success: true, message: 'Trigger engine ran' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
