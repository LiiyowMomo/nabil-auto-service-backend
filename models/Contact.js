const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  vehicle: { type: String, required: true },
  service: { type: String, required: true },
  message: { type: String },
  jobStatus: { type: String, default: "Pending" },
  customerId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Contact", contactSchema);
