// Test Script for Settings & 2FA APIs
// Run: node test-settings-apis.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let userId = '';

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.yellow);
  log(`  ${message}`, colors.yellow);
  log(`${'='.repeat(60)}`, colors.yellow);
}

// Test 1: Login
async function testLogin() {
  logSection('TEST 1: Login');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      credential: 'admin@example.com',
      password: 'Admin@123'
    });

    if (response.data.token) {
      authToken = response.data.token;
      userId = response.data.user.id;
      logSuccess('Login successful');
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      logInfo(`User ID: ${userId}`);
      return true;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 2: Get Profile
async function testGetProfile() {
  logSection('TEST 2: Get Profile');
  try {
    const response = await axios.get(`${BASE_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const user = response.data.data;
      logSuccess('Profile fetched successfully');
      logInfo(`Name: ${user.first_name} ${user.last_name}`);
      logInfo(`Email: ${user.email}`);
      logInfo(`Role: ${user.role}`);
      logInfo(`Mobile: ${user.mobile || 'Not set'}`);
      return true;
    }
  } catch (error) {
    logError(`Get profile failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 3: Update Profile
async function testUpdateProfile() {
  logSection('TEST 3: Update Profile');
  try {
    const response = await axios.put(`${BASE_URL}/profile/me`, {
      firstName: 'Admin',
      lastName: 'Updated'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      logSuccess('Profile updated successfully');
      logInfo(`Updated user: ${JSON.stringify(response.data.data, null, 2)}`);
      return true;
    }
  } catch (error) {
    logError(`Update profile failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 4: Get User Settings
async function testGetUserSettings() {
  logSection('TEST 4: Get User Settings');
  try {
    const response = await axios.get(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const settings = response.data.data;
      logSuccess('User settings fetched successfully');
      logInfo(`Notifications: ${JSON.stringify(settings.notifications, null, 2)}`);
      logInfo(`Display: ${JSON.stringify(settings.display, null, 2)}`);
      logInfo(`Security: ${JSON.stringify(settings.security, null, 2)}`);
      return true;
    }
  } catch (error) {
    logError(`Get settings failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 5: Update User Settings
async function testUpdateUserSettings() {
  logSection('TEST 5: Update User Settings');
  try {
    const response = await axios.put(`${BASE_URL}/settings`, {
      notifications: {
        email_login: true,
        email_security: true,
        email_updates: false,
        email_weekly: false,
        push_enabled: true,
        sms_enabled: false
      },
      display: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        date_format: 'DD/MM/YYYY'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      logSuccess('User settings updated successfully');
      logInfo(`Theme changed to: dark`);
      return true;
    }
  } catch (error) {
    logError(`Update settings failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 6: Get 2FA Status
async function testGet2FAStatus() {
  logSection('TEST 6: Get 2FA Status');
  try {
    const response = await axios.get(`${BASE_URL}/2fa/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success || response.data.data) {
      const status = response.data.data;
      logSuccess('2FA status fetched successfully');
      logInfo(`Enabled: ${status.enabled}`);
      if (status.enabled) {
        logInfo(`Backup codes remaining: ${status.backupCodesRemaining}`);
      }
      return true;
    }
  } catch (error) {
    logError(`Get 2FA status failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 7: Generate 2FA Setup
async function testGenerate2FASetup() {
  logSection('TEST 7: Generate 2FA Setup');
  try {
    const response = await axios.get(`${BASE_URL}/2fa/setup`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const setup = response.data.data;
      logSuccess('2FA setup generated successfully');
      logInfo(`Secret: ${setup.secret}`);
      logInfo(`QR Code generated: ${setup.qrCode.substring(0, 50)}...`);
      logInfo(`Backup codes (${setup.backupCodes.length}): ${setup.backupCodes.slice(0, 3).join(', ')}...`);
      return true;
    }
  } catch (error) {
    logError(`Generate 2FA setup failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 8: Get System Settings (Admin only)
async function testGetSystemSettings() {
  logSection('TEST 8: Get System Settings (Admin Only)');
  try {
    const response = await axios.get(`${BASE_URL}/settings/system`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data) {
      logSuccess('System settings fetched successfully');
      logInfo(`Supported Languages: ${response.data.supportedLanguages.join(', ')}`);
      logInfo(`Roles: ${response.data.roles.join(', ')}`);
      logInfo(`Features: ${JSON.stringify(response.data.features, null, 2)}`);
      return true;
    }
  } catch (error) {
    logError(`Get system settings failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 9: Check Avatar in Database
async function testCheckAvatar() {
  logSection('TEST 9: Check Avatar in Database');
  try {
    const response = await axios.get(`${BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const user = response.data.data;
      if (user.avatar) {
        logSuccess('Avatar found in database');
        logInfo(`Avatar path: ${user.avatar}`);
      } else {
        logInfo('No avatar set for this user');
      }
      return true;
    }
  } catch (error) {
    logError(`Check avatar failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 10: Database Verification
async function testDatabaseVerification() {
  logSection('TEST 10: Database Verification');
  
  const Database = require('better-sqlite3');
  const path = require('path');
  
  try {
    const db = new Database(path.join(__dirname, 'database.db'));
    
    // Check users table
    const users = db.prepare('SELECT id, email, first_name, last_name, avatar, settings FROM users WHERE id = ?').get(userId);
    
    if (users) {
      logSuccess('User data found in database');
      logInfo(`Email: ${users.email}`);
      logInfo(`Name: ${users.first_name} ${users.last_name}`);
      logInfo(`Avatar: ${users.avatar || 'Not set'}`);
      
      if (users.settings) {
        try {
          const settings = JSON.parse(users.settings);
          logInfo(`Settings stored as JSON: ✓`);
          logInfo(`Theme: ${settings.display?.theme || 'Not set'}`);
        } catch (e) {
          logError('Settings JSON parse error');
        }
      }
    }
    
    // Check 2FA table
    const twoFA = db.prepare('SELECT * FROM user_2fa WHERE user_id = ?').get(userId);
    if (twoFA) {
      logSuccess('2FA data found in database');
      logInfo(`Enabled: ${twoFA.is_enabled}`);
      logInfo(`Backup codes stored: ${twoFA.backup_codes ? 'Yes' : 'No'}`);
    } else {
      logInfo('No 2FA configured for this user');
    }
    
    db.close();
    return true;
  } catch (error) {
    logError(`Database verification failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════════╗', colors.blue);
  log('║     SETTINGS & 2FA API TESTING SUITE                     ║', colors.blue);
  log('╚═══════════════════════════════════════════════════════════╝\n', colors.blue);

  const results = {
    passed: 0,
    failed: 0,
    total: 10
  };

  // Run tests
  const tests = [
    { name: 'Login', func: testLogin },
    { name: 'Get Profile', func: testGetProfile },
    { name: 'Update Profile', func: testUpdateProfile },
    { name: 'Get User Settings', func: testGetUserSettings },
    { name: 'Update User Settings', func: testUpdateUserSettings },
    { name: 'Get 2FA Status', func: testGet2FAStatus },
    { name: 'Generate 2FA Setup', func: testGenerate2FASetup },
    { name: 'Get System Settings', func: testGetSystemSettings },
    { name: 'Check Avatar', func: testCheckAvatar },
    { name: 'Database Verification', func: testDatabaseVerification }
  ];

  for (const test of tests) {
    const result = await test.func();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait between tests
  }

  // Print summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, colors.cyan);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%\n`, colors.cyan);

  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED! 🎉\n', colors.green);
  } else {
    log('⚠️  SOME TESTS FAILED ⚠️\n', colors.red);
  }
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite error: ${error.message}`);
  process.exit(1);
});
