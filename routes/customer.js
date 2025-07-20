const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');
const twilioService = require('../services/twilioService');
const waitTimeService = require('../services/waitTimeService');

// Create new customer
router.post('/', async (req, res) => {
  try {
    // Find and increment customerID counter
    const counter = await Counter.findOneAndUpdate(
      { _id: 'customerID' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Extract service and message from request
    const { service, message, ...customerData } = req.body;

    // Create a new customer with a job
    const newCustomer = new Customer({
      ...customerData,
      customerID: counter.seq,
      jobs: [{
        customerID: counter.seq,
        serviceTypes: service,
        message: message,
        status: 'pending'
      }]
    });

    const savedCustomer = await newCustomer.save();
    const jobId = savedCustomer.jobs[0]._id;

    // Calculate wait time estimate
    try {
      // Calculate and store wait time estimate
      const estimatedWaitTime = await waitTimeService.estimateWaitTime(service);
      await waitTimeService.saveWaitTimeEstimate(savedCustomer._id, service, estimatedWaitTime);
      
      // Send initial SMS directly using the formatted wait time
      const formattedTime = estimatedWaitTime >= 1440 
        ? `${Math.ceil(estimatedWaitTime / 1440)} day(s)` 
        : estimatedWaitTime >= 60 
          ? `${Math.ceil(estimatedWaitTime / 60)} hour(s)` 
          : `${estimatedWaitTime} minute(s)`;
          
      const message = `Hello ${savedCustomer.name}, thank you for choosing Nabil Auto Service! Your service request (ID: ${savedCustomer.customerID}) has been received. Your estimated wait time before service begins is ${formattedTime}.`;
      
      await twilioService.sendMessage(savedCustomer.phone, message);
      console.log(`Initial wait time SMS sent to ${savedCustomer.phone}: ${message}`);
    } catch (waitTimeError) {
      console.error('Error calculating wait time:', waitTimeError);
      
      // Send basic welcome SMS if wait time calculation fails
      try {
        const message = `Hello ${savedCustomer.name}, thank you for choosing Nabil Auto Service! Your service request (ID: ${savedCustomer.customerID}) has been received. We'll keep you updated on the progress.`;
        await twilioService.sendMessage(savedCustomer.phone, message);
        console.log(`Fallback SMS sent to ${savedCustomer.phone}`);
      } catch (smsError) {
        console.error('Failed to send welcome SMS:', smsError);
      }
    }

    res.status(201).json({
      customer: savedCustomer,
      jobId: jobId
    });
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
      // Filter by job status if provided
      filter['jobs.status'] = status.toLowerCase();
    }
    
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Update job status
router.put('/jobs/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'started', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (pending, started, completed)' });
    }
    
    const result = await waitTimeService.updateJobStatus(jobId, status);
    
    res.json({
      success: true,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      customer: result.customer,
      job: result.job
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// Test route for SMS
router.get('/test-sms', async (req, res) => {
  try {
    // Get phone from query param or use a default
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required as query parameter' });
    }
    
    // Example wait time (2 hours)
    const waitTimeMinutes = 120;
    const formattedTime = waitTimeMinutes >= 1440 
      ? `${Math.ceil(waitTimeMinutes / 1440)} day(s)` 
      : waitTimeMinutes >= 60 
        ? `${Math.ceil(waitTimeMinutes / 60)} hour(s)` 
        : `${waitTimeMinutes} minute(s)`;
        
    const message = `Hello there, thank you for choosing Nabil Auto Service! Your estimated wait time before service begins is ${formattedTime}.`;
    
    const result = await twilioService.sendMessage(phone, message);
    
    if (result) {
      res.json({
        success: true,
        message: `Test SMS sent to ${phone}`,
        sid: result.sid
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to send SMS, check server logs for details'
      });
    }
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({ 
      error: 'Failed to send test SMS',
      details: error.message
    });
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
