const db = require('better-sqlite3')('database.db');

console.log('🔍 Testing Active Users Query\n');

// Test 1: Count users with active sessions
const activeUsers = db.prepare(`
  SELECT COUNT(DISTINCT user_id) as count 
  FROM user_sessions 
  WHERE is_active = 1
`).get();

console.log('1️⃣ Active Users Count:', activeUsers.count);

// Test 2: List all active sessions
const activeSessions = db.prepare(`
  SELECT u.email, s.login_time, s.last_activity, s.is_active
  FROM users u
  JOIN user_sessions s ON u.id = s.user_id
  WHERE s.is_active = 1
`).all();

console.log('\n2️⃣ Active Sessions Details:');
activeSessions.forEach(session => {
  console.log(`  - ${session.email}`);
  console.log(`    Login: ${session.login_time}`);
  console.log(`    Last Activity: ${session.last_activity}`);
  console.log(`    Active: ${session.is_active === 1 ? '✅' : '❌'}`);
});

// Test 3: Total users
const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log('\n3️⃣ Total Users:', totalUsers.count);

console.log('\n✅ Query test complete!');

db.close();
