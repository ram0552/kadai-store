require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const { hasRazorpayEnv } = require('./services/razorpay.service');
const { webhook } = require('./controllers/payment.controller');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

// Webhook needs the RAW body for signature checks, so it must be registered BEFORE express.json()
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), webhook);

app.use(express.json());
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    if (!hasRazorpayEnv()) {
      console.warn('WARNING: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing. COD works, online payment will return an error.');
    }
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn('WARNING: RAZORPAY_WEBHOOK_SECRET missing. Webhook requests will be rejected.');
    }
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
