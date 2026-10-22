const mongoose = require('mongoose');
const Order = require('../models/Order');
const { httpError, validateCustomer, priceCart, decrementStock } = require('../services/order.service');

// POST /api/orders/cod
exports.createCodOrder = async (req, res, next) => {
  try {
    const customer = validateCustomer(req.body.customer);
    const priced = await priceCart(req.body.items);
    const order = await Order.create({
      ...priced,
      customer,
      paymentMethod: 'COD',
      paymentStatus: 'pending', // collected on delivery
      orderStatus: 'placed',
    });
    await decrementStock(order.items);
    res.status(201).json({ success: true, orderId: order._id });
  } catch (e) {
    next(e);
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Order not found');
    const order = await Order.findById(req.params.id).select('-razorpaySignature');
    if (!order) throw httpError(404, 'Order not found');
    res.json(order);
  } catch (e) {
    next(e);
  }
};
