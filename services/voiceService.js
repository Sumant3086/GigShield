/**
 * Voice-Based Claim Verification Service
 * Uses Web Speech API + Twilio for voice interactions
 * Enables low-literacy workers to verify claims via phone call
 */

const twilio = require('twilio');

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Initiate voice call for claim verification
 * Worker receives call, presses 1 to confirm, 2 to reject
 */
async function initiateVoiceVerification(worker, claim) {
  if (!client) {
    console.log('[Voice] Demo mode - would call:', worker.phone);
    return { success: true, demo: true };
  }

  try {
    const call = await client.calls.create({
      url: `${process.env.API_URL}/api/voice/verify-claim/${claim._id}`,
      to: worker.phone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return { success: true, callSid: call.sid };
  } catch (error) {
    console.error('[Voice] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate TwiML response for voice verification
 */
function generateVerificationTwiML(claim, worker) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Namaste ${worker.name}. Yeh GigShield se call hai.
  </Say>
  <Say voice="Polly.Aditi" language="hi-IN">
    Aapka ${claim.payoutAmount} rupaye ka claim approve ho gaya hai.
  </Say>
  <Say voice="Polly.Aditi" language="hi-IN">
    Confirm karne ke liye 1 dabayein. Cancel karne ke liye 2 dabayein.
  </Say>
  <Gather numDigits="1" action="/api/voice/verify-claim/${claim._id}/response" method="POST">
    <Say voice="Polly.Aditi" language="hi-IN">
      Kripya apna choice enter karein.
    </Say>
  </Gather>
  <Say voice="Polly.Aditi" language="hi-IN">
    Koi response nahi mila. Dhanyavaad.
  </Say>
</Response>`;
}

/**
 * Multi-language support for voice
 */
const VOICE_LANGUAGES = {
  hindi: { voice: 'Polly.Aditi', code: 'hi-IN' },
  english: { voice: 'Polly.Raveena', code: 'en-IN' },
  tamil: { voice: 'Polly.Aditi', code: 'ta-IN' },
  telugu: { voice: 'Polly.Aditi', code: 'te-IN' },
  kannada: { voice: 'Polly.Aditi', code: 'kn-IN' },
};

module.exports = {
  initiateVoiceVerification,
  generateVerificationTwiML,
  VOICE_LANGUAGES,
};
