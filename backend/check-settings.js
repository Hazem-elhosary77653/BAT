const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking user_settings table...\n');

// Check if table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'", (err, row) => {
  if (err) {
    console.error('Error checking table:', err);
    return;
  }
  
  if (!row) {
    console.log('❌ user_settings table does not exist');
    db.close();
    return;
  }
  
  console.log('✅ user_settings table exists\n');
  
  // Get all settings
  db.all('SELECT * FROM user_settings LIMIT 10', (err, rows) => {
    if (err) {
      console.error('Error fetching settings:', err);
      db.close();
      return;
    }
    
    console.log(`Found ${rows.length} user settings records:\n`);
    rows.forEach(record => {
      console.log('User ID:', record.user_id);
      console.log('Settings:', JSON.stringify(JSON.parse(record.settings || '{}'), null, 2));
      console.log('Last Updated:', record.updated_at);
      console.log('---');
    });
    
    // Get count
    db.get('SELECT COUNT(*) as count FROM user_settings', (err, result) => {
      if (err) {
        console.error('Error counting settings:', err);
      } else {
        console.log(`\n✅ Total settings records: ${result.count}`);
      }
      db.close();
    });
  });
});
