const pool = require('./src/db/connection');

async function addAvatarColumn() {
  try {
    console.log('Adding avatar column to users table...');

    await pool.query(`ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL`);

    console.log('✅ Avatar column added successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addAvatarColumn();
