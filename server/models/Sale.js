const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  category: { type: String, required: true },
  lowStockNotified: { type: Boolean, default: false },
});

const saleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Unique sale ID
  products: [productSchema],
  customer: { type: String, required: true }, // Customer name
  paymentMethod: { type: String, required: true }, // Payment method
  salesPerson: { type: String, required: true }, // Salesperson name
  notes: { type: String }, // Optional notes
  totalAmount: { type: Number, required: true }, // Total sale amount
  profit: { type: Number, required: true }, // Profit from the sale
  date: { type: Date, default: Date.now }, // Sale date
});

module.exports = mongoose.model('Sale', saleSchema);
