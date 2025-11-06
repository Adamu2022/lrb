const http = require('http');

// Test login API endpoint
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const postData = JSON.stringify({
  email: 'admin@local.com',
  password: '123456'
});

console.log('Testing login API endpoint...');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:');
    console.log(data);
    
    try {
      const jsonData = JSON.parse(data);
      if (jsonData.access_token) {
        console.log('✅ Login successful! JWT token received.');
      } else {
        console.log('❌ Login failed. No access token in response.');
      }
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('This might indicate that the server is not running.');
});

req.write(postData);
req.end();