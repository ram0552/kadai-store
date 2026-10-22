const Order = require('../models/Order');
const { httpError, validateCustomer, priceCart, markOrderPaid, markOrderFailed } = require('../services/order.service');
const { createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } = require('../services/razorpay.service');

// POST /api/payment/create-order
exports.createOrder = async (req, res, next) => {
  let internal;
  try {
    const customer = validateCustomer(req.body.customer);
    const priced = await priceCart(req.body.items); // amount is computed on the server only

    internal = await Order.create({
      ...priced,
      customer,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'pending',
      orderStatus: 'awaiting_payment',
    });

    const rzpOrder = await createRazorpayOrder({
      amountInPaise: Math.round(priced.total * 100),
      receipt: String(internal._id),
      notes: { internalOrderId: String(internal._id) },
    });

    internal.razorpayOrderId = rzpOrder.id;
    await internal.save();

    res.status(201).json({
      success: true,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID, // public key only, never the secret
      internalOrderId: internal._id,
    });
  } catch (err) {
    if (internal && !internal.razorpayOrderId) await Order.deleteOne({ _id: internal._id }).catch(() => {});
    // The Razorpay SDK rejects with { statusCode, error: { description } }
    if (err && err.statusCode) {
      console.error('Razorpay error:', err.statusCode, err.error && err.error.description);
      return next(
        err.statusCode === 401
          ? httpError(401, 'Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
          : httpError(500, 'Could not start the payment. Please try again.')
      );
    }
    next(err);
  }
};

// POST /api/payment/verify-payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw httpError(400, 'Missing payment details');
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) throw httpError(404, 'Order not found');
    if (order.paymentStatus === 'paid') return res.json({ success: true, orderId: order._id }); // idempotent

    const valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      console.warn('Signature mismatch for order', String(order._id));
      throw httpError(400, 'Payment verification failed'); // order is NOT marked paid
    }

    const { order: paid } = await markOrderPaid(razorpay_order_id, {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    res.json({ success: true, orderId: paid._id });
  } catch (e) {
    next(e);
  }
};

// POST /api/payment/webhook  (mounted in server.js with express.raw)
exports.webhook = async (req, res) => {
  try {
    const signature = req.get('x-razorpay-signature');
    const raw = req.body; // Buffer
    if (!Buffer.isBuffer(raw) || !verifyWebhookSignature(raw, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(raw.toString('utf8'));
    const payment = event.payload && event.payload.payment && event.payload.payment.entity;

    if ((event.event === 'payment.captured' || event.event === 'order.paid') && payment) {
      await markOrderPaid(payment.order_id, { paymentId: payment.id });
    } else if (event.event === 'payment.failed' && payment) {
      await markOrderFailed(payment.order_id);
    }
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ received: false });
  }
};
