const axios = require('axios');

/**
 * WhatsApp Business API Integration
 * Sends real-time notifications to workers via WhatsApp
 * - Claim approved/paid notifications
 * - 48-hour disruption forecasts
 * - Premium payment reminders
 * - Pool health updates
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

async function sendWhatsAppMessage(to, message) {
  if (!WHATSAPP_TOKEN) {
    console.log('[WhatsApp] Demo mode - would send:', message);
    return { success: true, demo: true };
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, messageId: response.data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp] Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Template messages
async function notifyClaimApproved(worker, claim) {
  const message = `🎉 *GigShield Claim Approved*

Hi ${worker.name},

Your claim for ₹${claim.payoutAmount} has been approved!

📍 Event: ${claim.triggerType.replace(/_/g, ' ')}
💰 Amount: ₹${claim.payoutAmount}
⏱️ Payout: Within 2 hours to ${worker.upiId}

Track status: ${process.env.CLIENT_URL}/claims

Stay safe! 🛡️`;

  return sendWhatsAppMessage(worker.phone, message);
}

async function notifyForecastAlert(worker, forecast) {
  const message = `⚠️ *48-Hour Disruption Alert*

Hi ${worker.name},

${forecast.type.replace(/_/g, ' ')} predicted in ${forecast.zone}

🔮 Confidence: ${forecast.confidence}%
📅 Expected: ${new Date(forecast.forecastedFor).toLocaleDateString('en-IN')}

💡 Recommendation: ${forecast.recommendation}

View details: ${process.env.CLIENT_URL}/dashboard`;

  return sendWhatsAppMessage(worker.phone, message);
}

async function notifyPaymentReceived(worker, claim) {
  const message = `✅ *Payment Sent - GigShield*

Hi ${worker.name},

₹${claim.payoutAmount} has been sent to ${worker.upiId}

Ref: ${claim.paymentRef}

Check your UPI app. Usually arrives in 5-10 minutes.

Need help? Reply to this message.`;

  return sendWhatsAppMessage(worker.phone, message);
}

async function notifyPoolDiscount(worker, pool) {
  const message = `🤝 *Pool Discount Unlocked!*

Hi ${worker.name},

Your ${pool.zone} risk pool is healthy!

💚 Health Score: ${pool.healthScore}/100
💰 Your Discount: ${pool.discountPercent}% off premium
📊 Loss Ratio: ${(pool.lossRatio * 100).toFixed(1)}%

Keep it up! Healthy pools = lower rates for everyone.`;

  return sendWhatsAppMessage(worker.phone, message);
}

module.exports = {
  sendWhatsAppMessage,
  notifyClaimApproved,
  notifyForecastAlert,
  notifyPaymentReceived,
  notifyPoolDiscount,
};
