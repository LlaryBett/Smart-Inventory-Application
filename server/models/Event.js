const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  time: { type: String },
  type: { type: String, enum: ['inventory', 'delivery', 'maintenance', 'other'], default: 'other' },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
