import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
config();

function verifyEnvVar(name: string, value: string | undefined): boolean {
  if (!value) {
    console.error(`❌ ${name} is not set in environment variables`);
    return false;
  }
  console.log(`✅ ${name} is set`);
  return true;
}

function main() {
  console.log('Verifying notification system configuration...\n');

  // Check if .env file exists
  if (existsSync('.env')) {
    console.log('✅ .env file exists');
  } else {
    console.error('❌ .env file not found');
    return;
  }

  // Verify Termii configuration
  console.log('\n--- Termii (SMS) Configuration ---');
  const termiiApiKeyValid = verifyEnvVar(
    'TERMII_API_KEY',
    process.env.TERMII_API_KEY,
  );
  const termiiSenderIdValid = verifyEnvVar(
    'TERMII_SENDER_ID',
    process.env.TERMII_SENDER_ID,
  );

  // Verify Brevo configuration
  console.log('\n--- Brevo (Email) Configuration ---');
  const brevoApiKeyValid = verifyEnvVar(
    'BREVO_API_KEY',
    process.env.BREVO_API_KEY,
  );
  const brevoSenderEmailValid = verifyEnvVar(
    'BREVO_SENDER_EMAIL',
    process.env.BREVO_SENDER_EMAIL,
  );
  const brevoSenderNameValid = verifyEnvVar(
    'BREVO_SENDER_NAME',
    process.env.BREVO_SENDER_NAME,
  );

  // Overall status
  console.log('\n--- Overall Status ---');
  if (
    termiiApiKeyValid &&
    termiiSenderIdValid &&
    brevoApiKeyValid &&
    brevoSenderEmailValid &&
    brevoSenderNameValid
  ) {
    console.log('✅ All notification configurations are properly set!');
    console.log('\nYou can now test the notification system by running:');
    console.log('npm run send-test-notification');
  } else {
    console.log(
      '❌ Some configuration values are missing. Please check the .env file.',
    );
  }
}

main();
