const db = require('better-sqlite3')('database.db');

console.log('=== 🔍 Testing All Fixes ===\n');

// 0. Check users table structure first
const usersCols = db.prepare('PRAGMA table_info(users)').all();
console.log('Users table columns:', usersCols.map(c => c.name).join(', '));

// 1. Check users with avatars
console.log('\n1️⃣ Users with Avatars:');
const users = db.prepare('SELECT id, email, avatar, LENGTH(settings) as settings_size FROM users LIMIT 5').all();
users.forEach(u => {
  console.log(`  - ${u.email}`);
  console.log(`    Avatar: ${u.avatar ? '✅ Has avatar' : '❌ No avatar'}`);
  console.log(`    Settings: ${u.settings_size} bytes`);
});

// 2. Check 2FA status
console.log('\n2️⃣ 2FA Status:');
const twoFA = db.prepare(`
  SELECT u.email, t.is_enabled, t.secret 
  FROM users u 
  LEFT JOIN user_2fa t ON u.id = t.user_id 
  LIMIT 5
`).all();
twoFA.forEach(t => {
  console.log(`  - ${t.email}: ${t.is_enabled === 1 ? '✅ Enabled' : '❌ Disabled'} | Secret: ${t.secret ? 'Yes' : 'No'}`);
});

// 3. Check active sessions
console.log('\n3️⃣ Active Sessions:');
const sessions = db.prepare(`
  SELECT u.email, s.login_time, s.last_activity, s.is_active 
  FROM users u 
  JOIN user_sessions s ON u.id = s.user_id 
  WHERE s.is_active = 1 
  LIMIT 5
`).all();
if (sessions.length > 0) {
  sessions.forEach(s => {
    console.log(`  - ${s.email}`);
    console.log(`    Login: ${s.login_time}`);
    console.log(`    Last Activity: ${s.last_activity}`);
  });
} else {
  console.log('  ⚠️ No active sessions');
}

// 4. Check admin settings in detail
console.log('\n4️⃣ Admin User Settings:');
const settingsUser = db.prepare('SELECT email, settings FROM users WHERE email = ?').get('admin@example.com');
if (settingsUser) {
  const settings = JSON.parse(settingsUser.settings);
  console.log(`  Email: ${settingsUser.email}`);
  console.log(`  Session Timeout: ${settings.security?.sessions_timeout || 'Not set'} minutes`);
  console.log(`  Theme: ${settings.display?.theme || 'Not set'}`);
  console.log(`  Language: ${settings.display?.language || 'Not set'}`);
  console.log(`  Email Alerts: ${settings.notifications?.email_login_alerts ? '✅ ON' : '❌ OFF'}`);
  console.log(`  Push Notifications: ${settings.notifications?.push_notifications ? '✅ ON' : '❌ OFF'}`);
}

// 5. Verify database schema for last_activity
console.log('\n5️⃣ Database Schema Verification:');
const sessionColumns = db.prepare('PRAGMA table_info(user_sessions)').all();
const hasLastActivity = sessionColumns.find(col => col.name === 'last_activity');
console.log(`  last_activity column: ${hasLastActivity ? '✅ Exists' : '❌ Missing'}`);

// 6. Check user_2fa table structure
console.log('\n6️⃣ 2FA Table Structure:');
const twoFAColumns = db.prepare('PRAGMA table_info(user_2fa)').all();
console.log(`  Columns: ${twoFAColumns.map(col => col.name).join(', ')}`);

db.close();
console.log('\n✅ All checks complete!\n');
