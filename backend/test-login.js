const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

const testPassword = 'password123';
const credential = 'admin@example.com';

try {
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ? OR mobile = ?').get(credential, credential, credential);
  
  if (!user) {
    console.log('❌ User not found');
  } else {
    console.log('✅ User found:', user.email);
    console.log('Password hash:', user.password_hash.substring(0, 20) + '...');
    
    // Test password comparison
    const match = bcrypt.compareSync(testPassword, user.password_hash);
    console.log(`\nPassword match for "${testPassword}": ${match ? '✅ YES' : '❌ NO'}`);
  }
} catch (err) {
  console.error('Error:', err.message);
}

db.close();
