const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    default: () => `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  supplier: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Food', 'Books', 'Other']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'received', 'cancelled', 'processing'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'partially_paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'bank_transfer', 'credit', 'cheque'],
    default: 'bank_transfer'
  },
  invoiceNumber: {
    type: String,
    unique: true,
    default: () => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
      return `INV-${year}${month}${random}`;
    }
  },
  purchasedBy: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
});

// Add pre-save hook to ensure ID is set
purchaseSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
