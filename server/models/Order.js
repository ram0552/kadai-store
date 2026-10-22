const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number, // rupees, snapshot at order time
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    items: [itemSchema],
    customer: {
      name: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      pincode: String,
    },
    subtotal: Number,
    shipping: Number,
    total: Number, // rupees

    paymentMethod: { type: String, enum: ['COD', 'RAZORPAY'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    // awaiting_payment = Razorpay order created but not yet paid
    orderStatus: { type: String, enum: ['awaiting_payment', 'placed', 'cancelled'], default: 'placed' },

    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
