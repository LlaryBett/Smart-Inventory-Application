const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
    default: () => `SRV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  requestCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Add pre-save hook to ensure ID is set
serviceSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = `SRV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
