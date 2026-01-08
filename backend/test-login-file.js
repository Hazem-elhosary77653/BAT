const axios = require('axios');
const fs = require('fs');

const testLogin = async () => {
  try {
    console.log('🔄 Testing login endpoint...\n');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      credential: 'admin@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    fs.writeFileSync('login-success.txt', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Login failed!');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      fs.writeFileSync('login-error.txt', `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Error: Cannot connect to backend on port 3001');
      fs.writeFileSync('login-error.txt', 'ECONNREFUSED: Cannot connect to backend on port 3001');
    } else {
      console.log('Error:', error.message);
      fs.writeFileSync('login-error.txt', `Error: ${error.message}`);
    }
  }
};

testLogin();
