const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

try {
  const users = db.prepare('SELECT id, email, username, role FROM users').all();
  console.log('Users in database:');
  console.log(JSON.stringify(users, null, 2));
  
  if (users.length === 0) {
    console.log('\n⚠️ No users found! Need to run migration.');
  } else {
    console.log(`\n✅ Found ${users.length} users`);
  }
} catch (err) {
  console.error('Error:', err.message);
}

db.close();
