const pool = require('./src/db/connection');

async function testUserQuery() {
  try {
    console.log('Testing getUserByCredential query...');
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR username = $1 OR mobile = $1`,
      ['admin@example.com']
    );
    console.log('Result:', result);
    console.log('Rows:', result.rows);
    if (result.rows && result.rows.length > 0) {
      console.log('First user:', result.rows[0]);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testUserQuery();
