#!/usr/bin/env node
/**
 * Test user creation endpoint
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Test data
const testUser = {
  email: 'testuser@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  password: 'TestPass123',
  role: 'analyst'
};

async function testUserCreation() {
  try {
    console.log('🧪 Testing user creation...\n');
    
    // First, we need to login to get a token
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      credential: 'admin@example.com',
      password: 'Admin@123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful. Token obtained.\n');
    
    // Now create a user
    console.log('2️⃣ Creating new user...');
    const createResponse = await axios.post(
      `${API_URL}/users`,
      testUser,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ User created successfully!');
    console.log('\n📋 User details:');
    console.log(JSON.stringify(createResponse.data.data, null, 2));
    
    console.log('\n🎉 Test passed! User creation is working.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('\nFull error response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testUserCreation();
