import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

async function testDbAndCreateAdmin() {
  console.log('Testing database connection and creating admin user...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lecture_reminder',
  });

  try {
    // Connect to the database
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database successfully!');
    
    // Check if database exists by querying a simple table
    try {
      const res = await client.query('SELECT * FROM "user" LIMIT 1');
      console.log('Database tables exist.');
    } catch (error) {
      console.log('Database tables may not exist yet. Run the backend first to initialize them.');
      await client.end();
      return;
    }
    
    // Check if admin user already exists
    console.log('Checking if admin user already exists...');
    const result = await client.query('SELECT * FROM "user" WHERE email = $1', ['admin@local.com']);
    
    if (result.rows.length > 0) {
      console.log('Admin user already exists!');
      console.log('Email:', result.rows[0].email);
      await client.end();
      return;
    }
    
    // Create new admin user
    console.log('Creating new admin user...');
    
    // Hash the password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    // Insert the user into the database
    console.log('Inserting user into database...');
    const insertResult = await client.query(
      'INSERT INTO "user" (fname, lname, email, phone, password, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
      ['Admin', 'User', 'admin@local.com', '', hashedPassword, 'super_admin']
    );
    
    console.log('Admin user created successfully!');
    console.log('User ID:', insertResult.rows[0].id);
    console.log('Email:', insertResult.rows[0].email);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // If it's a connection error, provide guidance
    if (error.message.includes('connect') || error.message.includes('connection')) {
      console.log('\nTroubleshooting tips:');
      console.log('1. Make sure PostgreSQL is running on your system');
      console.log('2. Verify the database credentials in your .env file');
      console.log('3. Check if the database "lecture_reminder" exists');
      console.log('4. Ensure PostgreSQL is accepting connections on port 5432');
    }
  } finally {
    // Close the database connection
    try {
      await client.end();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error.message);
    }
  }
}

// Run the script
testDbAndCreateAdmin()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });