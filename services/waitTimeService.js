const Customer = require('../models/Customer');
const ServiceType = require('../models/ServiceType');
const WaitTimeEstimate = require('../models/WaitTimeEstimate');
const twilioService = require('./twilioService');

class WaitTimeService {
  /**
   * Estimate wait time based on selected services and current queue
   * @param {Array} serviceNames - Array of service names
   * @param {Object} options - Options for estimation
   * @returns {Number} Estimated wait time in minutes
   */
  async estimateWaitTime(serviceNames, options = {}) {
    try {
      // Get service types with durations
      const serviceTypes = await ServiceType.find({ 
        name: { $in: serviceNames } 
      });
      
      if (!serviceTypes.length) {
        throw new Error('No valid services selected');
      }
      
      // Calculate base wait time (sum of all service durations)
      const baseWaitTime = serviceTypes.reduce((total, service) => {
        return total + service.estimatedDuration;
      }, 0);
      
      // Get current queue length (number of active jobs)
      const activeJobsCount = await Customer.countDocuments({ 
        'jobs.status': { $in: ['pending', 'in-progress'] } 
      });
      
      // Estimate wait time based on queue length and service duration
      // This is a simple calculation - you might want to make it more sophisticated
      const queueFactor = Math.max(0, activeJobsCount - 1); // Subtract 1 for current job
      const queueMultiplier = options.queueMultiplier || 0.5; // Adjust based on your needs
      
      // Calculate total wait time (base + queue factor)
      const totalWaitTime = baseWaitTime + (queueFactor * baseWaitTime * queueMultiplier);
      
      return Math.round(totalWaitTime);
    } catch (error) {
      console.error('Error estimating wait time:', error);
      throw error;
    }
  }
  
  /**
   * Store wait time estimate for a customer
   * @param {String} customerId - Customer ID
   * @param {Array} serviceNames - Services selected
   * @param {Number} estimatedTime - Estimated wait time in minutes
   */
  async saveWaitTimeEstimate(customerId, serviceNames, estimatedTime) {
    try {
      // Create or update wait time estimate
      const waitTimeEstimate = await WaitTimeEstimate.findOneAndUpdate(
        { customerId },
        {
          customerId,
          serviceTypes: serviceNames,
          estimatedWaitTime: estimatedTime
        },
        { upsert: true, new: true }
      );
      
      return waitTimeEstimate;
    } catch (error) {
      console.error('Error saving wait time estimate:', error);
      throw error;
    }
  }
  
  /**
   * Get current wait time estimate for a customer
   * @param {String} customerId - Customer ID
   * @returns {Object} Wait time estimate
   */
  async getCustomerWaitTime(customerId) {
    try {
      const waitTimeEstimate = await WaitTimeEstimate.findOne({ customerId });
      return waitTimeEstimate;
    } catch (error) {
      console.error('Error getting customer wait time:', error);
      throw error;
    }
  }
  
  /**
   * Get job status and wait time information
   * @param {String} jobId - Job ID
   * @returns {Object} Job status and wait time
   */
  async getJobStatus(jobId) {
    try {
      const customer = await Customer.findOne({ "jobs._id": jobId });
      
      if (!customer) {
        throw new Error('Job not found');
      }
      
      const job = customer.jobs.find(j => j._id.toString() === jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      // Get wait time estimate if exists
      const waitTimeEstimate = await WaitTimeEstimate.findOne({ customerId: customer._id });
      
      return {
        status: job.status,
        serviceTypes: job.serviceTypes || [],
        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone
        },
        estimatedWaitTime: waitTimeEstimate ? waitTimeEstimate.estimatedWaitTime : null,
        startTime: job.startTime,
        updatedAt: job.updatedAt
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }
  
  /**
   * Update job status and send notifications
   * @param {String} jobId - Job ID
   * @param {String} status - New status (pending, started, completed)
   */
  async updateJobStatus(jobId, status) {
    try {
      // Find customer with this job
      const customer = await Customer.findOne({ "jobs._id": jobId });
      
      if (!customer) {
        throw new Error('Job not found');
      }
      
      // Find and update the specific job
      const jobIndex = customer.jobs.findIndex(j => j._id.toString() === jobId);
      
      if (jobIndex === -1) {
        throw new Error('Job not found');
      }
      
      // Get current status before update
      const previousStatus = customer.jobs[jobIndex].status;
      
      // Update job status
      customer.jobs[jobIndex].status = status;
      
      // Set start time if job is being started
      if (status === 'started' && previousStatus !== 'started') {
        customer.jobs[jobIndex].startTime = new Date();
      }
      
      // Save customer with updated job
      await customer.save();
      
      // Get wait time estimate
      const waitTimeEstimate = await WaitTimeEstimate.findOne({ customerId: customer._id });
      const estimatedTime = waitTimeEstimate ? waitTimeEstimate.estimatedWaitTime : null;
      
      // Determine which SMS to send based on status change
      if (status === 'pending' && previousStatus !== 'pending') {
        // Job created or moved back to pending
        const waitMinutes = estimatedTime || 30; // Default 30 minutes if no estimate
        await this._sendWaitTimeSMS(customer.phone, customer.name, waitMinutes);
      } else if (status === 'started' && previousStatus !== 'started') {
        // Job started - send service time notification
        const serviceTypes = customer.jobs[jobIndex].serviceTypes || [];
        const serviceTime = await this._calculateServiceTime(serviceTypes);
        
        // Enhanced service started message with clear service time
        const formattedTime = this._formatTime(serviceTime);
        const message = `Hello ${customer.name}, your service at Nabil Auto Service has started! Estimated time to completion: ${formattedTime}.`;
        
        try {
          console.log(`Sending service started SMS to ${customer.phone}: ${message}`);
          await twilioService.sendMessage(customer.phone, message);
          console.log(`Successfully sent service started SMS to ${customer.phone}`);
        } catch (error) {
          console.error('Error sending service started SMS:', error);
        }
      } else if (status === 'completed' && previousStatus !== 'completed') {
        // Job completed
        await this._sendServiceCompletedSMS(customer.phone, customer.name);
      }
      
      return {
        customer: customer._id,
        job: customer.jobs[jobIndex],
        previousStatus,
        newStatus: status
      };
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }
  
  /**
   * Calculate service time from service types
   * @param {Array} serviceTypes - Array of service type names
   * @returns {Number} Total service time in minutes
   */
  async _calculateServiceTime(serviceTypes) {
    try {
      if (!serviceTypes || serviceTypes.length === 0) {
        return 30; // Default 30 minutes
      }
      
      const services = await ServiceType.find({ name: { $in: serviceTypes } });
      
      if (!services || services.length === 0) {
        return 30;
      }
      
      const totalTime = services.reduce((total, service) => {
        return total + service.estimatedDuration;
      }, 0);
      
      return totalTime;
    } catch (error) {
      console.error('Error calculating service time:', error);
      return 30; // Default to 30 minutes on error
    }
  }
  
  /**
   * Format time for SMS messages
   * @param {Number} minutes - Minutes to format
   * @returns {String} Formatted time
   */
  _formatTime(minutes) {
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
  
  /**
   * Send wait time SMS notification
   * @param {String} phone - Customer phone number
   * @param {String} name - Customer name
   * @param {Number} waitMinutes - Wait time in minutes
   */
  async _sendWaitTimeSMS(phone, name, waitMinutes) {
    const formattedTime = this._formatTime(waitMinutes);
    const message = `Hello ${name}, thank you for choosing Nabil Auto Service! Your estimated wait time before service begins is ${formattedTime}.`;
    
    try {
      console.log(`Sending wait time SMS to ${phone}: ${message}`);
      await twilioService.sendMessage(phone, message);
      console.log(`Successfully sent wait time SMS to ${phone}`);
    } catch (error) {
      console.error('Error sending wait time SMS:', error);
    }
  }
  
  /**
   * Send service started SMS notification
   * @param {String} phone - Customer phone number
   * @param {String} name - Customer name
   * @param {Number} serviceMinutes - Service time in minutes
   */
  async _sendServiceStartedSMS(phone, name, serviceMinutes) {
    const formattedTime = this._formatTime(serviceMinutes);
    const message = `Hello ${name}, your service at Nabil Auto Service has started! Estimated time to completion: ${formattedTime}.`;
    
    try {
      console.log(`Sending service started SMS to ${phone}: ${message}`);
      await twilioService.sendMessage(phone, message);
      console.log(`Successfully sent service started SMS to ${phone}`);
    } catch (error) {
      console.error('Error sending service started SMS:', error);
    }
  }
  
  /**
   * Send service completed SMS notification
   * @param {String} phone - Customer phone number
   * @param {String} name - Customer name
   */
  async _sendServiceCompletedSMS(phone, name) {
    const message = `Hello ${name}, your service at Nabil Auto Service has been completed. Your vehicle is ready for pickup. Thank you for your business!`;
    
    try {
      console.log(`Sending service completed SMS to ${phone}: ${message}`);
      await twilioService.sendMessage(phone, message);
      console.log(`Successfully sent service completed SMS to ${phone}`);
    } catch (error) {
      console.error('Error sending service completed SMS:', error);
    }
  }
}

module.exports = new WaitTimeService();
