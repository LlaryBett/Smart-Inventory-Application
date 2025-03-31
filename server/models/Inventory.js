const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  stockLevel: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  minimumStock: {
    type: Number,
    default: 10
  },
  location: {
    type: String,
    default: 'Main Warehouse'
  }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
