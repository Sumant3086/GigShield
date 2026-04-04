const Claim = require('../models/Claim');
const Worker = require('../models/Worker');

/**
 * Simulates Razorpay UPI payout (sandbox mode)
 * In production: calls Razorpay Payout API
 */
async function simulatePayout(claim) {
  try {
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 100));

    const paymentRef = `GS_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    await Claim.findByIdAndUpdate(claim._id, {
      status: 'paid',
      paymentRef,
      paidAt: new Date(),
    });

    // Update policy total payout
    const Policy = require('../models/Policy');
    if (claim.policy) {
      await Policy.findByIdAndUpdate(claim.policy, {
        $inc: { totalPayoutReceived: claim.payoutAmount || 0 }
      });
    }

    console.log(`[Payment] Payout ₹${claim.payoutAmount} → ref: ${paymentRef}`);
    return { success: true, paymentRef };
  } catch (e) {
    console.error('[Payment] Error:', e.message);
    return { success: false, error: e.message };
  }
}

module.exports = { simulatePayout };
