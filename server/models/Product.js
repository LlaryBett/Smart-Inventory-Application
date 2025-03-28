const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  stock: { type: Number, default: 0, required: true },
  description: { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
