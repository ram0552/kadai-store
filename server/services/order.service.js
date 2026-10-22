const Product = require('../models/Product');
const Order = require('../models/Order');

const FREE_SHIPPING_ABOVE = 999; // keep in sync with client/src/utils/pricing.js
const SHIPPING_FEE = 49;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function validateCustomer(c) {
  const required = ['name', 'email', 'phone', 'address', 'city', 'pincode'];
  if (!c || required.some((k) => !String(c[k] || '').trim())) {
    throw httpError(400, 'Please fill in all delivery details');
  }
  if (!/^\S+@\S+\.\S+$/.test(c.email)) throw httpError(400, 'Enter a valid email address');
  if (!/^\d{10}$/.test(c.phone)) throw httpError(400, 'Phone number must be 10 digits');
  if (!/^\d{6}$/.test(c.pincode)) throw httpError(400, 'PIN code must be 6 digits');
  return Object.fromEntries(required.map((k) => [k, String(c[k]).trim()]));
}

// Never trust prices from the browser: rebuild the cart from the database.
async function priceCart(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw httpError(400, 'Your cart is empty');

  const qtyById = new Map();
  for (const it of rawItems) {
    const qty = Number(it.qty);
    if (!it.productId || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw httpError(400, 'Invalid cart item');
    }
    qtyById.set(String(it.productId), (qtyById.get(String(it.productId)) || 0) + qty);
  }

  let products;
  try {
    products = await Product.find({ _id: { $in: [...qtyById.keys()] } });
  } catch (e) {
    throw httpError(400, 'Invalid cart item');
  }
  if (products.length !== qtyById.size) throw httpError(400, 'Some products are no longer available');

  const items = products.map((p) => {
    const qty = qtyById.get(String(p._id));
    if (p.stock < qty) throw httpError(409, `Only ${p.stock} left of ${p.name}`);
    return { product: p._id, name: p.name, price: p.price, qty };
  });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  return { items, subtotal, shipping, total: subtotal + shipping };
}

async function decrementStock(items) {
  for (const i of items) {
    // Guarded update so stock never goes negative
    await Product.updateOne({ _id: i.product, stock: { $gte: i.qty } }, { $inc: { stock: -i.qty } });
  }
}

// Atomic + idempotent: only the first caller flips pending -> paid and reduces stock.
async function markOrderPaid(razorpayOrderId, { paymentId, signature } = {}) {
  const order = await Order.findOneAndUpdate(
    { razorpayOrderId, paymentStatus: { $ne: 'paid' } },
    {
      $set: {
        paymentStatus: 'paid',
        orderStatus: 'placed',
        razorpayPaymentId: paymentId,
        ...(signature ? { razorpaySignature: signature } : {}),
        paidAt: new Date(),
      },
    },
    { new: true }
  );
  if (!order) return { order: await Order.findOne({ razorpayOrderId }), alreadyPaid: true };
  await decrementStock(order.items);
  return { order, alreadyPaid: false };
}

async function markOrderFailed(razorpayOrderId) {
  await Order.updateOne({ razorpayOrderId, paymentStatus: 'pending' }, { $set: { paymentStatus: 'failed' } });
}

module.exports = {
  httpError,
  validateCustomer,
  priceCart,
  decrementStock,
  markOrderPaid,
  markOrderFailed,
};
