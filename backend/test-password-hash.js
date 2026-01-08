const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');
const db = new Database(dbPath);

// Get admin user
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@example.com');

if (!user) {
  console.log('❌ Admin user not found');
  process.exit(1);
}

console.log('✅ Admin user found:');
console.log('  Email:', user.email);
console.log('  Password hash:', user.password_hash);

// Test different passwords
const testPasswords = [
  'Admin@123',
  'admin@123',
  'Password123!',
  'Test@123',
  ''
];

console.log('\n🔐 Testing password comparisons:');
testPasswords.forEach(pwd => {
  const match = bcrypt.compareSync(pwd, user.password_hash);
  console.log(`  "${pwd}" -> ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
});

// Try to hash a password the same way and compare
console.log('\n🔑 Testing fresh hash:');
const testPwd = 'Admin@123';
const hash = bcrypt.hashSync(testPwd, 10);
const match = bcrypt.compareSync(testPwd, hash);
console.log(`  Fresh hash of "${testPwd}": ${hash}`);
console.log(`  Comparison with original: ${match ? '✅ MATCH' : '❌ NO MATCH'}`);

db.close();
