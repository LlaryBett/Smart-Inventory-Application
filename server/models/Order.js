const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  customerName: { type: String, required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  total: { type: Number, required: true },
  status: { type: String, default: 'completed' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
