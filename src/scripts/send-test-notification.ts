import { config } from 'dotenv';
import axios from 'axios';

// Load environment variables
config();

async function sendTestSMS() {
  const termiiApiKey = process.env.TERMII_API_KEY;
  const termiiSenderId = process.env.TERMII_SENDER_ID;

  if (!termiiApiKey || !termiiSenderId) {
    console.error(
      '❌ TERMII_API_KEY or TERMII_SENDER_ID not found in environment variables',
    );
    return;
  }

  try {
    const url = 'https://api.ng.termii.com/api/sms/send';
    const payload = {
      to: '+1234567890', // Replace with your phone number for testing
      from: termiiSenderId,
      sms: 'This is a test SMS from the Lecture Reminder System.',
      type: 'plain',
      channel: 'generic',
      api_key: termiiApiKey,
    };

    const response = await axios.post(url, payload);
    console.log('✅ SMS sent successfully:', response.data);
  } catch (error: any) {
    console.error(
      '❌ Failed to send SMS:',
      error?.response?.data || error?.message || error,
    );
  }
}

async function sendTestEmail() {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;
  const brevoSenderName = process.env.BREVO_SENDER_NAME;

  if (!brevoApiKey || !brevoSenderEmail || !brevoSenderName) {
    console.error(
      '❌ BREVO_API_KEY, BREVO_SENDER_EMAIL, or BREVO_SENDER_NAME not found in environment variables',
    );
    return;
  }

  try {
    const url = 'https://api.brevo.com/v3/smtp/email';
    const payload = {
      sender: { email: brevoSenderEmail, name: brevoSenderName },
      to: [{ email: 'test@example.com' }], // Replace with your email for testing
      subject: 'Test Email from Lecture Reminder System',
      htmlContent:
        '<p>This is a test email from the Lecture Reminder System.</p>',
    };

    const response = await axios.post(url, payload, {
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Email sent successfully:', response.data);
  } catch (error: any) {
    console.error(
      '❌ Failed to send Email:',
      error?.response?.data || error?.message || error,
    );
  }
}

async function main() {
  console.log('Testing SMS notification...');
  await sendTestSMS();

  console.log('\nTesting Email notification...');
  await sendTestEmail();
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
