const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@example.com');

if (user) {
  console.log('User found:', user.email);
  console.log('Password hash:', user.password_hash.substring(0, 30) + '...');
  const match = bcrypt.compareSync('Admin@123', user.password_hash);
  console.log('Password match:', match ? '✅ YES' : '❌ NO');
} else {
  console.log('User not found');
}

db.close();
