// const mongoose = require("mongoose");
// 
// const contactSchema = new mongoose.Schema({
//   customerID: { type: Number, unique: true },
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
//   vehicle: { type: String, required: true },
//   service: { type: String, required: true },
//   message: { type: String },
//   // jobStatus: { type: String, default: "Pending" },
//   // customerId: { type: String }
// }, { timestamps: true });
// 
// module.exports = mongoose.model("Customer", contactSchema);
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  customerID: { type: Number, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, match: /^\+1\d{10}$/ }, // Ensure phone is +1 followed by 10 digits
  vehicle: { type: String, required: true },
  service: [{ type: String, required: true }], // Allow multiple services
  message: { type: String },
  jobStatus: { type: String, enum: ["Pending", "Started", "Completed"], default: "Pending" },
}, { timestamps: true });

// Use the model name 'Customer' so Mongoose will look in 'customers' collection
module.exports = mongoose.model("Customer", customerSchema);
