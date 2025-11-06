import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

async function createAdminUser() {
  console.log('Creating admin user...');
  
  // Create a DataSource instance with proper configuration
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '08080397908',
    database: process.env.DB_NAME || 'lecture_reminder',
    entities: [User],
    synchronize: false,
    logging: true,
  });
  
  try {
    // Initialize the data source
    console.log('Initializing data source...');
    await dataSource.initialize();
    console.log('Data Source has been initialized!');
    
    // Create repository for User entity
    const userRepository = dataSource.getRepository(User);
    
    // Check if admin user already exists
    console.log('Checking if admin user already exists...');
    const existingUser = await userRepository.findOne({
      where: { email: 'admin@local.com' }
    });
    
    if (existingUser) {
      console.log('Admin user already exists!');
      await dataSource.destroy();
      return;
    }
    
    // Create new admin user
    console.log('Creating new admin user...');
    const adminUser = new User();
    adminUser.firstName = 'Admin';
    adminUser.lastName = 'User';
    adminUser.email = 'admin@local.com';
    adminUser.role = 'super_admin';
    adminUser.phone = '';
    
    // Hash the password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    adminUser.password = await bcrypt.hash('123456', salt);
    
    // Save the user to database
    console.log('Saving user to database...');
    await userRepository.save(adminUser);
    
    console.log('Admin user created successfully!');
    console.log('Email: admin@local.com');
    console.log('Password: 123456');
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
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
createAdminUser()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });