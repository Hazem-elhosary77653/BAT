const pool = require('./src/db/connection');

async function dropTables() {
  try {
    console.log('Dropping brd_highlights table...');
    await pool.query('DROP TABLE IF EXISTS brd_highlights');
    console.log('✅ Dropped brd_highlights table');

    console.log('Dropping brd_mentions table...');
    await pool.query('DROP TABLE IF EXISTS brd_mentions');
    console.log('✅ Dropped brd_mentions table');

    console.log('\n✨ Tables dropped successfully! They will be recreated without FOREIGN KEY constraints on next API call.');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
  }
}

dropTables();
