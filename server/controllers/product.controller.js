const Product = require('../models/Product');

exports.list = async (req, res, next) => {
  try {
    res.json(await Product.find().sort({ createdAt: 1 }));
  } catch (e) {
    next(e);
  }
};
