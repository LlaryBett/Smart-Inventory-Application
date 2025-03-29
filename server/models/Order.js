const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    default: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  items: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function(v) {
        return v === this.quantity; // Ensure items matches quantity
      },
      message: 'Items must match quantity'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  shippingAddress: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
    default: 'credit_card'
  },
  notes: {
    type: String,
    default: ''
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
  pricePerUnit: {
    type: Number,
    required: true
  }
});

// Add validation middleware
orderSchema.pre('save', function(next) {
  console.log('Order validation. Quantity:', this.quantity, 'Items:', this.items);
  if (this.quantity !== this.items) {
    this.items = this.quantity; // Ensure they match
  }
  next();
});

// Add pre-save hook to ensure ID is set
orderSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Add a post-save middleware to handle stock updates and sales records
orderSchema.post('save', async function(doc) {
  try {
    const Product = require('./Product');
    const Sale = require('./Sale');
    
    console.log('Post-save middleware triggered for order:', doc);

    const product = await Product.findById(doc.productId);
    if (!product) {
      console.error('Product not found for productId:', doc.productId);
      return;
    }

    console.log('Found product:', product);

    if (doc.status === 'completed') {
      console.log('Creating sale record for completed order');
      const sale = new Sale({
        id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        products: [{
          product: doc.productId,
          productName: doc.productName,
          category: product.category,
          quantity: doc.quantity,
          unitPrice: doc.pricePerUnit,
          costPrice: product.cost,
          unitCost: {
            base: product.cost
          }
        }],
        customerName: doc.customerName,
        totalAmount: doc.totalAmount,
        paymentMethod: doc.paymentMethod,
        salesPerson: 'System',
        date: new Date(),
        notes: doc.notes || ''
      });

      await sale.save();
      console.log('Sale record created:', sale);
    }

    // Always reduce stock for new orders regardless of status (except cancelled)
    if (doc.status !== 'cancelled') {
      console.log(`Processing stock update for ${doc.status} order`);
      product.stock = Math.max(0, product.stock - doc.quantity);
      await product.save();
      console.log('Stock updated. New stock level:', product.stock);
    }
  } catch (error) {
    console.error('Post-save order processing error:', error);
  }
});

module.exports = mongoose.model('Order', orderSchema);
