const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  stockLevel: { type: Number, required: true }
});

module.exports = mongoose.model('Inventory', inventorySchema);
