import { NestFactory } from '@nestjs/core';
import { NotificationsService } from '../reminders/notifications.service';
import { AppModule } from '../app.module';

async function testNotifications() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);

  // Test SMS notification
  console.log('Testing SMS notification...');
  try {
    await notificationsService.sendSMSReminder(
      '+1234567890', // Replace with a valid test phone number
      'This is a test SMS from the Lecture Reminder System.',
    );
    console.log('✅ SMS test completed');
  } catch (error) {
    console.error('❌ SMS test failed:', error.message);
  }

  // Test Email notification
  console.log('Testing Email notification...');
  try {
    await notificationsService.sendEmailReminder(
      'test@example.com', // Replace with a valid test email
      'Test Email',
      'This is a test email from the Lecture Reminder System.',
    );
    console.log('✅ Email test completed');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }

  await app.close();
}

testNotifications().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
