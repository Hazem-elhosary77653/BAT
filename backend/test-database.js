const db = require('./src/db/connection');

console.log('=== Testing Database Storage ===\n');

async function testDatabase() {
  try {
    // 1. Check users table
    console.log('1. Checking users table...');
    const usersResult = await db.query('SELECT id, email, username, role FROM users LIMIT 5');
    const users = usersResult.rows;
    console.log(`   ✅ Found ${users.length} users`);
    if (users.length > 0) {
      console.log('   Sample user:', users[0]);
    }

    // 2. Check user_settings in users table
    console.log('\n2. Checking user settings storage...');
    const settingsResult = await db.query('SELECT id, email, settings FROM users WHERE settings IS NOT NULL LIMIT 1');
    const userWithSettings = settingsResult.rows[0];
    if (userWithSettings) {
      console.log('   ✅ User has settings stored:');
      console.log('   User ID:', userWithSettings.id);
      console.log('   Email:', userWithSettings.email);
      const settings = JSON.parse(userWithSettings.settings || '{}');
      console.log('   Settings keys:', Object.keys(settings));
    } else {
      console.log('   ℹ️  No users with settings found yet');
    }

    // 3. Check activity_logs table
    console.log('\n3. Checking activity logs...');
    const activitiesResult = await db.query('SELECT COUNT(*) as count FROM activity_logs');
    const activities = activitiesResult.rows[0];
    console.log(`   ✅ Found ${activities.count} activity records`);
    
    if (activities.count > 0) {
      const recentResult = await db.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1');
      const recentActivity = recentResult.rows[0];
      console.log('   Latest activity:', {
        action: recentActivity.action,
        user_id: recentActivity.user_id,
        created_at: recentActivity.created_at
      });
    }

    // 4. Check if tables exist
    console.log('\n4. Checking table structure...');
    const tablesResult = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
    const tables = tablesResult.rows;
    console.log('   Available tables:', tables.map(t => t.name).join(', '));

    // 5. Check users table columns
    console.log('\n5. Checking users table structure...');
    const columnsResult = await db.query('PRAGMA table_info(users)');
    const columns = columnsResult.rows;
    console.log('   Users table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });

    console.log('\n=== Database Connection Test: ✅ SUCCESSFUL ===\n');

  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testDatabase().then(() => {
  console.log('Test completed!');
  process.exit(0);
});
