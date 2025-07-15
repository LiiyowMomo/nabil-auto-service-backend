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

// Fetch all customers with optional status filter
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    
    if (status) {
      filter.jobStatus = status;
    }
    
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Delete a customer/job
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    
    if (!deletedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(200).json({ message: 'Customer deleted successfully', deletedCustomer });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
