const mongoose = require('mongoose');

const adminCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  // Optional: you can add an expiration or description if needed
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminCode', adminCodeSchema);
