const router = require('express').Router();
const { adminAuth } = require('../middleware/auth');
const { generateVerificationTwiML } = require('../services/voiceService');
const Claim = require('../models/Claim');
const Worker = require('../models/Worker');
const { simulatePayout } = require('../services/paymentService');

// GET /api/voice/verify-claim/:id — TwiML for voice verification
router.get('/verify-claim/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('worker');
    if (!claim) return res.status(404).send('Claim not found');

    const twiml = generateVerificationTwiML(claim, claim.worker);
    res.type('text/xml');
    res.send(twiml);
  } catch (e) {
    res.status(500).send('Error generating TwiML');
  }
});

// POST /api/voice/verify-claim/:id/response — Handle voice response
router.post('/verify-claim/:id/response', async (req, res) => {
  try {
    const { Digits } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (Digits === '1') {
      // Confirmed
      claim.status = 'approved';
      await claim.save();
      await simulatePayout(claim);

      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Dhanyavaad. Aapka claim approve ho gaya hai. Payment 2 ghante mein aapke UPI account mein aa jayega.
  </Say>
</Response>`);
    } else if (Digits === '2') {
      // Rejected
      claim.status = 'rejected';
      await claim.save();

      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Aapka claim cancel kar diya gaya hai. Madad ke liye customer care se sampark karein.
  </Say>
</Response>`);
    } else {
      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Galat input. Kripya dobara koshish karein.
  </Say>
</Response>`);
    }
  } catch (e) {
    res.status(500).send('Error processing response');
  }
});

module.exports = router;
