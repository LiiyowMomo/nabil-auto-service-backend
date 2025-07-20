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

// Define a job schema for the customer's service jobs
const jobSchema = new mongoose.Schema({
  customerID: { type: Number },
  serviceTypes: [{ type: String, required: true }], // Array of selected services
  message: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "started", "completed"], 
    default: "pending" 
  },
  startTime: { type: Date },
  completionTime: { type: Date }
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  customerID: { type: Number, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, match: /^\+1\d{10}$/ }, // Ensure phone is +1 followed by 10 digits
  vehicle: { type: String, required: true },
  jobs: [jobSchema], // Customer can have multiple jobs
}, { timestamps: true });

// Use the model name 'Customer' so Mongoose will look in 'customers' collection
module.exports = mongoose.model("Customer", customerSchema);
