const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const twilioService = require('../services/twilioService');

// Update job status for a customer
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { jobStatus } = req.body;
  
  try {
    // Find the customer first to get their details
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update the job status
    const updated = await Customer.findByIdAndUpdate(
      id,
      { jobStatus },
      { new: true, runValidators: true }
    );

    // Send SMS notification
    try {
      const message = twilioService.generateStatusMessage(
        customer.name,
        jobStatus,
        customer.customerID
      );
      
      await twilioService.sendSMS(customer.phone, message);
      console.log(`SMS notification sent to ${customer.phone} for status: ${jobStatus}`);
    } catch (smsError) {
      console.error('Failed to send SMS notification:', smsError);
      // Don't fail the entire request if SMS fails
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating job status:', err);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

module.exports = router;
