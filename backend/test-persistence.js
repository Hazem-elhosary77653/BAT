const pool = require('./src/db/connection');

async function testDataPersistence() {
  try {
    console.log('Testing data persistence...\n');

    // Test 1: Check user settings
    console.log('1️⃣ Checking user settings:');
    const userSettings = await pool.query(`SELECT id, email, settings FROM users LIMIT 1`);
    if (userSettings.rows.length > 0) {
      const user = userSettings.rows[0];
      console.log(`   User: ${user.email}`);
      console.log(`   Settings stored: ${user.settings ? 'Yes' : 'No'}`);
      if (user.settings) {
        try {
          const parsed = JSON.parse(user.settings);
          console.log(`   Settings keys: ${Object.keys(parsed).join(', ')}`);
        } catch (e) {
          console.log(`   Settings: ${user.settings.substring(0, 100)}...`);
        }
      }
    }

    // Test 2: Check system settings
    console.log('\n2️⃣ Checking system settings table:');
    const systemSettings = await pool.query(`SELECT COUNT(*) as count FROM system_settings`);
    console.log(`   Total settings: ${systemSettings.rows[0].count}`);
    
    const sampleSettings = await pool.query(`SELECT key, value FROM system_settings LIMIT 5`);
    console.log(`   Sample settings:`);
    sampleSettings.rows.forEach(row => {
      console.log(`     ${row.key}: ${row.value}`);
    });

    // Test 3: Check users table structure
    console.log('\n3️⃣ Checking users table columns:');
    const columns = await pool.query(`PRAGMA table_info(users)`);
    const columnNames = columns.rows.map(c => c.name);
    console.log(`   Columns: ${columnNames.join(', ')}`);
    console.log(`   Has avatar: ${columnNames.includes('avatar') ? 'Yes ✅' : 'No ❌'}`);
    console.log(`   Has settings: ${columnNames.includes('settings') ? 'Yes ✅' : 'No ❌'}`);

    // Test 4: Check uploads folder
    console.log('\n4️⃣ Checking uploads folder:');
    const fs = require('fs');
    const path = require('path');
    const uploadsPath = path.join(__dirname, 'uploads');
    const avatarsPath = path.join(uploadsPath, 'avatars');
    
    console.log(`   Uploads folder exists: ${fs.existsSync(uploadsPath) ? 'Yes ✅' : 'No ❌'}`);
    console.log(`   Avatars folder exists: ${fs.existsSync(avatarsPath) ? 'Yes ✅' : 'No ❌'}`);

    // Test 5: Database connection
    console.log('\n5️⃣ Database connection:');
    const testQuery = await pool.query(`SELECT COUNT(*) as users FROM users`);
    console.log(`   Total users: ${testQuery.rows[0].users}`);
    console.log(`   Database working: Yes ✅`);

    console.log('\n✅ All checks completed!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testDataPersistence();
