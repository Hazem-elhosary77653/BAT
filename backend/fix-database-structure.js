const db = require('./src/db/connection');

console.log('=== Checking and Fixing Database Structure ===\n');

async function checkAndFix() {
  try {
    // 1. Check users table structure
    console.log('1. Current users table structure:');
    const columnsResult = await db.query('PRAGMA table_info(users)');
    const columns = columnsResult.rows;
    
    const columnNames = columns.map(c => c.name);
    console.log('   Columns:', columnNames.join(', '));
    
    // 2. Check if settings column exists
    const hasSettings = columnNames.includes('settings');
    console.log(`\n2. Settings column exists: ${hasSettings ? '✅ YES' : '❌ NO'}`);
    
    if (!hasSettings) {
      console.log('\n3. Adding settings column...');
      await db.query('ALTER TABLE users ADD COLUMN settings TEXT DEFAULT NULL');
      console.log('   ✅ Settings column added successfully!');
      
      // Set default settings for existing users
      const defaultSettings = JSON.stringify({
        notifications: {
          email_login: true,
          email_security: true,
          email_updates: false,
          email_weekly: false,
          push_enabled: true,
          sms_enabled: false
        },
        display: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          date_format: 'DD/MM/YYYY'
        },
        privacy: {
          profile_public: false,
          show_online_status: true,
          allow_messages: true
        },
        accessibility: {
          high_contrast: false,
          reduce_motion: false,
          large_text: false,
          screen_reader: false
        },
        security: {
          two_factor: false,
          sessions_timeout: 30,
          remember_device: false
        }
      });
      
      console.log('\n4. Setting default settings for existing users...');
      await db.query(`UPDATE users SET settings = $1 WHERE settings IS NULL`, [defaultSettings]);
      console.log('   ✅ Default settings applied to all users!');
    }
    
    // 3. Verify final structure
    console.log('\n5. Final users table structure:');
    const finalColumns = await db.query('PRAGMA table_info(users)');
    finalColumns.rows.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    
    // 4. Test settings retrieval
    console.log('\n6. Testing settings retrieval...');
    const testUser = await db.query('SELECT id, email, settings FROM users LIMIT 1');
    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      console.log(`   User: ${user.email}`);
      console.log(`   Has settings: ${user.settings ? '✅ YES' : '❌ NO'}`);
      if (user.settings) {
        const settings = JSON.parse(user.settings);
        console.log(`   Settings sections: ${Object.keys(settings).join(', ')}`);
      }
    }
    
    console.log('\n=== ✅ Database Structure Fixed Successfully! ===\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAndFix().then(() => {
  console.log('Done!');
  process.exit(0);
});
