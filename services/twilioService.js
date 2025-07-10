const twilio = require('twilio');

// Initialize Twilio client only if credentials are provided
let client = null;

const initializeTwilio = () => {
  console.log('Environment variables check:');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID || 'Missing');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN || 'Missing');
  console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client initialized successfully');
  } else {
    console.warn('Twilio credentials not found. SMS functionality will be disabled.');
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

const generateStatusMessage = (customerName, jobStatus, customerID) => {
  const messages = {
    'Pending': `Hi ${customerName}, your auto service request #${customerID} is pending. We'll start working on it soon. Thank you for choosing Nabil Auto Service!`,
    'Started': `Hi ${customerName}, good news! We've started working on your auto service request #${customerID}. We'll keep you updated on the progress.`,
    'Completed': `Hi ${customerName}, your auto service request #${customerID} has been completed! Please contact us to schedule pickup. Thank you for choosing Nabil Auto Service!`
  };
  
  return messages[jobStatus] || `Hi ${customerName}, your auto service request #${customerID} status has been updated to: ${jobStatus}`;
};

module.exports = {
  sendSMS,
  generateStatusMessage
};
