const mongoose = require('mongoose');

const waitTimeEstimateSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  serviceTypes: [{ type: String, required: true }],
  estimatedWaitTime: { type: Number, required: true }, // in minutes
  createdAt: { type: Date, default: Date.now, expires: '7d' } // Auto-expire after 7 days
});

module.exports = mongoose.model('WaitTimeEstimate', waitTimeEstimateSchema);
