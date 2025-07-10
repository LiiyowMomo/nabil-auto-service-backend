const mongoose = require("mongoose");

const smsLogSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  phoneNumber: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], required: true },
  twilioSid: { type: String },
  jobStatus: { type: String },
  errorMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("SmsLog", smsLogSchema);