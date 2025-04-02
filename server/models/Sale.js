const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: true,
    min: [0, 'Cost price cannot be negative']
  },
  unitCost: {
    base: { type: Number, required: true }, // Cost price
    shipping: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },
    labor: { type: Number, default: 0 },
    overhead: { type: Number, default: 0 },
    total: { type: Number } // Calculated total unit cost
  }
});

const saleSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
    default: () => `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  },
  products: [saleItemSchema],
  customerName: {
    type: String,
    required: true
  },
  totalAmount: Number,
  profit: Number,
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_payment']
  },
  salesPerson: {
    type: String,
    required: true
  },
  salesPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  notes: String,
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save middleware to calculate totals only
saleSchema.pre('save', function (next) {
  try {
    let totalAmount = 0;
    let profit = 0;

    // Calculate totals
    for (const item of this.products) {
      totalAmount += item.quantity * item.unitPrice;
      profit += item.quantity * (item.unitPrice - item.costPrice);
    }

    this.totalAmount = totalAmount;
    this.profit = profit;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Sale', saleSchema);
