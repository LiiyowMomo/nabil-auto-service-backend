const twilio = require('twilio');

// Initialize Twilio client only if credentials are provided
let client = null;

const initializeTwilio = () => {
  console.log('Environment variables check:');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Found (masked for security)' : 'Missing');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Found (masked for security)' : 'Missing');
  console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'Missing');

  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('Twilio client initialized successfully');
    } else {
      console.warn('Twilio credentials not found. SMS functionality will be disabled.');
    }
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
    client = null;
  }
};

const sendSMS = async (to, message) => {
  // Initialize Twilio client if not already done
  if (!client) {
    initializeTwilio();
  }

  if (!client) {
    console.warn('Twilio client not initialized. SMS not sent.');
    return null;
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    
    console.log(`SMS sent successfully: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

// Alias sendMessage to sendSMS for compatibility with waitTimeService
const sendMessage = sendSMS;

// Format time for SMS messages similar to waitTimeService
const formatWaitTime = (minutes) => {
  if (minutes >= 1440) {
    const days = Math.ceil(minutes / 1440);
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

const generateStatusMessage = (customerName, jobStatus, customerID, waitTimeMinutes = null, serviceTimeMinutes = null) => {
  // Convert times to formatted strings if provided
  const waitTimeText = waitTimeMinutes ? formatWaitTime(waitTimeMinutes) : "unknown";
  const serviceTimeText = serviceTimeMinutes ? formatWaitTime(serviceTimeMinutes) : "unknown";
  
  const messages = {
    'pending': `Hello ${customerName}, thank you for choosing Nabil Auto Service! Your service request (ID: ${customerID}) has been received. Your estimated wait time before service begins is ${waitTimeText}.`,
    'started': `Hello ${customerName}, your service at Nabil Auto Service has started! Estimated time to completion: ${serviceTimeText}.`,
    'completed': `Hello ${customerName}, your service at Nabil Auto Service has been completed. Your vehicle is ready for pickup, Please contact us to schedule a pickup time. Thank you for choosing Nabil Auto Service!`
  };
  
  // Fallback message if status is not recognized
  return messages[jobStatus.toLowerCase()] || `Hi ${customerName}, your auto service request #${customerID} status has been updated to: ${jobStatus}.`;
};

// Test function to quickly test SMS functionality
const testSendSMS = async () => {
  try {
    console.log('Running Twilio SMS test...');
    const testNumber = process.env.TEST_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;
    
    if (!testNumber) {
      console.error('No test phone number available');
      return false;
    }
    
    // Initialize client if needed
    if (!client) {
      initializeTwilio();
    }
    
    if (!client) {
      console.error('No Twilio client available');
      return false;
    }
    
    console.log(`Sending test SMS to ${testNumber}`);
    const result = await sendSMS(testNumber, 'This is a test SMS from Nabil Auto Service');
    console.log('Test SMS result:', result ? result.sid : 'Failed');
    return !!result;
  } catch (error) {
    console.error('Test SMS failed:', error);
    return false;
  }
};

// Run the test when the server starts
// Uncomment the line below to test SMS when server starts
// setTimeout(testSendSMS, 3000);

module.exports = {
  sendSMS,
  sendMessage,
  generateStatusMessage,
  testSendSMS
};
