import { config } from 'dotenv';

// Load environment variables
config();

console.log('TERMII_API_KEY:', process.env.TERMII_API_KEY ? 'SET' : 'NOT SET');
console.log(
  'TERMII_SENDER_ID:',
  process.env.TERMII_SENDER_ID ? 'SET' : 'NOT SET',
);
console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'SET' : 'NOT SET');
console.log(
  'BREVO_SENDER_EMAIL:',
  process.env.BREVO_SENDER_EMAIL ? 'SET' : 'NOT SET',
);
console.log(
  'BREVO_SENDER_NAME:',
  process.env.BREVO_SENDER_NAME ? 'SET' : 'NOT SET',
);
