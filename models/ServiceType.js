const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  estimatedDuration: { type: Number, required: true }, // in minutes
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
