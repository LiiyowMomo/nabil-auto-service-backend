const express = require('express');
const router = express.Router();
const waitTimeService = require('../services/waitTimeService');
const ServiceType = require('../models/ServiceType');
const WaitTimeEstimate = require('../models/WaitTimeEstimate');

// Get all service types with their estimated durations
router.get('/services', async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find().select('name estimatedDuration description');
    res.json(serviceTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estimate wait time for selected services
router.post('/estimate', async (req, res) => {
  try {
    const { services, customerId } = req.body;
    
    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'Services array is required' });
    }
    
    const serviceNames = services.map(s => typeof s === 'string' ? s : s.name);
    const estimatedWaitTime = await waitTimeService.estimateWaitTime(serviceNames);
    
    // If customerId is provided, save the estimate
    if (customerId) {
      await waitTimeService.saveWaitTimeEstimate(customerId, serviceNames, estimatedWaitTime);
    }
    
    res.json({ 
      estimatedWaitTime,
      formattedTime: formatWaitTime(estimatedWaitTime),
      services: serviceNames
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to format wait time
function formatWaitTime(minutes) {
  if (minutes >= 1440) {
    const days = Math.ceil(minutes / 1440);
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

// Get wait time estimate for a specific customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const waitTimeEstimate = await waitTimeService.getCustomerWaitTime(customerId);
    
    if (!waitTimeEstimate) {
      return res.status(404).json({ error: 'No wait time estimate found for this customer' });
    }
    
    res.json({
      ...waitTimeEstimate.toObject(),
      formattedTime: formatWaitTime(waitTimeEstimate.estimatedWaitTime)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current queue status
router.get('/queue', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    // Get all pending and in-progress jobs
    const customers = await Customer.find({ 
      'jobs.status': { $in: ['pending', 'started'] }
    }).select('name phone jobs');
    
    // Calculate queue metrics
    const pendingJobs = [];
    const startedJobs = [];
    
    customers.forEach(customer => {
      customer.jobs.forEach(job => {
        if (job.status === 'pending') {
          pendingJobs.push({
            id: job._id,
            customerName: customer.name,
            customerPhone: customer.phone,
            serviceTypes: job.serviceTypes,
            createdAt: job.createdAt
          });
        } else if (job.status === 'started') {
          startedJobs.push({
            id: job._id,
            customerName: customer.name,
            customerPhone: customer.phone,
            serviceTypes: job.serviceTypes,
            startTime: job.startTime,
            createdAt: job.createdAt
          });
        }
      });
    });
    
    // Sort by creation time
    pendingJobs.sort((a, b) => a.createdAt - b.createdAt);
    
    // If customerId is provided, calculate position in queue
    let customerPosition = -1;
    if (customerId) {
      customerPosition = pendingJobs.findIndex(job => 
        job.customer && job.customer.toString() === customerId
      );
    }
    
    res.json({
      queueLength: pendingJobs.length,
      activeJobs: startedJobs.length,
      customerPosition: customerPosition >= 0 ? customerPosition + 1 : null,
      estimatedWaitTime: pendingJobs.length * 30, // Simple calculation: 30 min per job
      pendingJobs,
      startedJobs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job status and wait time
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobStatus = await waitTimeService.getJobStatus(jobId);
    
    res.json({
      ...jobStatus,
      formattedWaitTime: formatWaitTime(jobStatus.estimatedWaitTime)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update job status and send notifications
router.put('/job/:jobId/status', async (req, res) => {
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
      job: result.job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
