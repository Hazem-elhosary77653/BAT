const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const db = new Database('./database.db');
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@example.com');
db.close();

if (!user) {
  console.log('❌ No user found');
  process.exit(1);
}

const testPassword = 'Admin@123';
const storedHash = user.password_hash;

console.log('Testing bcrypt password verification:');
console.log('Stored hash:', storedHash);
console.log('Test password:', testPassword);

const match = bcrypt.compareSync(testPassword, storedHash);
console.log('Match result:', match);

if (!match) {
  console.log('\n⚠️ Password doesn\'t match. Trying to hash the test password and compare:');
  const freshHash = bcrypt.hashSync(testPassword, 10);
  console.log('Fresh hash:', freshHash);
  const freshMatch = bcrypt.compareSync(testPassword, freshHash);
  console.log('Fresh hash match:', freshMatch);
}
