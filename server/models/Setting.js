const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  category: { type: String, required: true }, // Group settings by category
  key: { type: String, required: true }, // Key within the category
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // Value can be any type
  description: { type: String, default: '' }, // Optional description
  updatedAt: { type: Date, default: Date.now }, // Track updates
});

module.exports = mongoose.model('Setting', settingSchema);
