const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');
const twilioService = require('../services/twilioService');

// Create new customer
router.post('/', async (req, res) => {
  try {
    // Find and increment customerID counter
    const counter = await Counter.findOneAndUpdate(
      { _id: 'customerID' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Use the incremented customerID from the counter
    const newCustomer = new Customer({
      ...req.body,
      customerID: counter.seq
    });

    const savedCustomer = await newCustomer.save();

    // Send welcome SMS
    try {
      const welcomeMessage = `Hi ${savedCustomer.name}, thank you for choosing Nabil Auto Service! Your service request (ID: ${savedCustomer.customerID}) has been received. We'll keep you updated on the progress.`;
      await twilioService.sendSMS(savedCustomer.phone, welcomeMessage);
      console.log(`Welcome SMS sent to ${savedCustomer.phone}`);
    } catch (smsError) {
      console.error('Failed to send welcome SMS:', smsError);
      // Don't fail the customer creation if SMS fails
    }

    res.status(201).json(savedCustomer);
  } catch (err) {
    console.error('Error saving customer:', err);
    res.status(500).json({ error: 'Failed to save customer' });
  }
});

// Fetch all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ... rest of your existing routes
module.exports = router;
