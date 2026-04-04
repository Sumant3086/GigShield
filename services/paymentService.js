const Claim = require('../models/Claim');
const Policy = require('../models/Policy');

// Initialize Razorpay only if keys are present
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Creates a Razorpay Payment Link for the worker's UPI payout.
 * In test mode: generates a real test payment link visible in Razorpay dashboard.
 * In production: would use Razorpay Payouts API with fund account.
 */
async function simulatePayout(claim) {
  try {
    const worker = await require('../models/Worker').findById(claim.worker);
    const amount = claim.payoutAmount || 0;

    if (amount <= 0) {
      console.log('[Payment] Skipping zero-amount payout');
      return { success: false, error: 'Zero amount' };
    }

    let paymentRef;

    try {
      // Create a real Razorpay Payment Link (visible in dashboard)
      const paymentLink = await razorpay.paymentLink.create({
        amount: amount * 100, // Razorpay uses paise
        currency: 'INR',
        accept_partial: false,
        description: `GigShield income protection payout — ${claim.triggerType?.replace(/_/g, ' ')} in ${claim.zone}`,
        customer: {
          name: worker?.name || 'GigShield Worker',
          contact: worker?.phone || '',
        },
        notify: { sms: false, email: false },
        reminder_enable: false,
        notes: {
          claim_id: claim._id.toString(),
          trigger_type: claim.triggerType,
          zone: claim.zone,
          city: claim.city,
          worker_upi: worker?.upiId || '',
        },
        callback_url: `${process.env.CLIENT_URL}/dashboard`,
        callback_method: 'get',
      });

      paymentRef = paymentLink.id;
      console.log(`[Payment] Razorpay link created: ${paymentLink.short_url} for Rs.${amount}`);

    } catch (rzpError) {
      // Fallback to mock ref if Razorpay API fails (e.g. network issue)
      console.warn('[Payment] Razorpay API error, using mock ref:', rzpError.message);
      paymentRef = `GS_MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    await Claim.findByIdAndUpdate(claim._id, {
      status: 'paid',
      paymentRef,
      paidAt: new Date(),
    });

    if (claim.policy) {
      await Policy.findByIdAndUpdate(claim.policy, {
        $inc: { totalPayoutReceived: amount },
      });
    }

    console.log(`[Payment] Payout Rs.${amount} processed → ref: ${paymentRef}`);
    return { success: true, paymentRef };

  } catch (e) {
    console.error('[Payment] Error:', e.message);
    return { success: false, error: e.message };
  }
}

module.exports = { simulatePayout };
