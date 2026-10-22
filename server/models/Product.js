const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Pantry' },
    weight: { type: String, default: '' },
    price: { type: Number, required: true, min: 1 }, // whole rupees
    stock: { type: Number, required: true, min: 0, default: 0 },
    tone: { type: String, default: '#C8321E' }, // tile colour used instead of photos
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
