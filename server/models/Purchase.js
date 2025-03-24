const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  supplier: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
});

module.exports = mongoose.model('Purchase', purchaseSchema);
