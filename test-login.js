const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '08080397908',
  database: 'lecture_reminder'
};

async function testLogin() {
  console.log('Testing login system...');
  
  const client = new Client(config);
  
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully!');
    
    // Test query - find all users
    console.log('Fetching users...');
    const result = await client.query('SELECT * FROM "user"');
    console.log(`✅ Found ${result.rowCount} users in the database`);
    
    // Display user information (without passwords)
    result.rows.forEach(user => {
      console.log(`User: ${user.email} (${user.role})`);
    });
    
    // Test password validation for the first user
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`\nTesting password validation for ${user.email}...`);
      
      // Test with a known password (from the database setup script)
      const testPassword = '123456';
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      console.log(`Password '${testPassword}' validation: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);
    }
    
    // Try to find the admin user specifically
    console.log('\nLooking for admin user...');
    const adminResult = await client.query('SELECT * FROM "user" WHERE email = $1', ['admin@local.com']);
    
    if (adminResult.rowCount > 0) {
      console.log('✅ Admin user found!');
      const adminUser = adminResult.rows[0];
      console.log(`Admin email: ${adminUser.email}`);
      console.log(`Admin role: ${adminUser.role}`);
    } else {
      console.log('ℹ️  Admin user not found in database');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing login system:', error.message);
    console.error('Stack:', error.stack);
    return false;
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

// Run the test
testLogin()
  .then((success) => {
    if (success) {
      console.log('\n✅ Login system test completed successfully.');
      process.exit(0);
    } else {
      console.log('\n❌ Login system test failed.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });