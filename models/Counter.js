const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 6000 // Start the customerID from 6000
  }
});

// Ensure the model is properly exported
module.exports = mongoose.model('Counter', counterSchema);
