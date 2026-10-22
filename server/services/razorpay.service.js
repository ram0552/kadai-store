const Razorpay = require('razorpay');
const crypto = require('crypto');

let instance;

function hasRazorpayEnv() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getInstance() {
  if (!instance) {
    if (!hasRazorpayEnv()) {
      const err = new Error('Razorpay keys are not configured on the server');
      err.status = 500;
      throw err;
    }
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

async function createRazorpayOrder({ amountInPaise, receipt, notes }) {
  if (!Number.isInteger(amountInPaise) || amountInPaise < 100) {
    const err = new Error('Amount must be at least 100 paise (Rs 1)');
    err.status = 400;
    throw err;
  }
  return getInstance().orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: String(receipt).slice(0, 40), // Razorpay limit: 40 chars
    notes,
  });
}

function hmacHex(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (x.length !== y.length) return false; // timingSafeEqual throws on unequal lengths
  return crypto.timingSafeEqual(x, y);
}

// Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET)
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = hmacHex(`${orderId}|${paymentId}`, process.env.RAZORPAY_KEY_SECRET);
  return safeEqual(expected, signature);
}

// Webhook signature: HMAC_SHA256(raw request body, WEBHOOK_SECRET)
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return safeEqual(hmacHex(rawBody, secret), signature);
}

module.exports = {
  hasRazorpayEnv,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
