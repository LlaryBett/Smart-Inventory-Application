const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import UUID for unique ID generation

const reportSchema = new mongoose.Schema({
  id: { type: String, default: () => uuidv4(), unique: true }, // Ensure UUID is generated
  type: { type: String, required: true }, // 'sales', 'purchases', etc.
  date: { type: Date, default: Date.now },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make generatedBy optional
  },
});

module.exports = mongoose.model('Report', reportSchema);
