// Test Twilio configuration
const twilio = require('twilio');

// Load environment variables
require('dotenv').config();

// Twilio configuration from environment variables
const accountSid = process.env.TWILLIO_SID;
const authToken = process.env.TWILLIO_TOKEN;
const phoneNumber = process.env.TWILLIO_PHONE_NUMBER;

console.log('Twilio Configuration:');
console.log('Account SID:', accountSid);
console.log('Auth Token:', authToken ? '****' + authToken.substring(authToken.length - 4) : 'Not set');
console.log('Phone Number:', phoneNumber);

// Create Twilio client
if (accountSid && authToken) {
  const client = twilio(accountSid, authToken);
  
  console.log('\nTwilio client created successfully!');
  
  // Test sending a message (commented out to prevent actual sending)
  /*
  client.messages
    .create({
      body: 'Test message from Lecture Reminder System',
      from: phoneNumber,
      to: '+1234567890' // Replace with your test phone number
    })
    .then(message => console.log('Message sent successfully:', message.sid))
    .catch(error => console.error('Error sending message:', error));
  */
} else {
  console.log('\nTwilio configuration is incomplete. Please check your environment variables.');
}