import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Schedule } from '../entities/schedule.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Reminder } from '../entities/reminder.entity';
import { NotificationSettings } from '../entities/notification-settings.entity';
import { NotificationLog } from '../entities/notification-log.entity';
import { ReminderLog } from '../entities/reminder-log.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { config } from 'dotenv';

// Load environment variables
config();

async function testDbConnection() {
  console.log('Testing database connection...');
  
  // Create a DataSource instance with proper configuration
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '08080397908',
    database: process.env.DB_NAME || 'lecture_reminder',
    entities: [
      User,
      Schedule,
      Course,
      Enrollment,
      Reminder,
      NotificationSettings,
      NotificationLog,
      ReminderLog,
      AuditLog,
    ],
    synchronize: false,
    logging: true,
  });
  
  try {
    // Initialize the data source
    console.log('Initializing data source...');
    await dataSource.initialize();
    console.log('✅ Data Source has been initialized successfully!');
    
    // Test query
    const userRepository = dataSource.getRepository(User);
    const count = await userRepository.count();
    console.log(`✅ Database contains ${count} users`);
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Close the data source
    try {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        console.log('Data source destroyed.');
      }
    } catch (error) {
      console.error('Error destroying data source:', error.message);
    }
  }
}

// Run the script
testDbConnection()
  .then(() => {
    console.log('Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });