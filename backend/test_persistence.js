const pool = require('./src/db/connection');

const testPersistence = async () => {
    console.log('Starting persistence test...');
    try {
        // 1. Get initial user (ID 51 - Admin)
        const userId = 51;
        console.log('Fetching user', userId);
        const initial = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        console.log('Initial Name:', initial.rows[0].first_name, initial.rows[0].last_name);
        console.log('Initial Bio:', initial.rows[0].bio);

        // 2. Simulate Update
        const newBio = 'Updated Bio ' + Date.now();
        const newLocation = 'New York ' + Date.now();

        // Simulate construction of query like controller
        const updateQuery = `
      UPDATE users
      SET bio = $1, location = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, bio, location
    `;
        const params = [newBio, newLocation, userId];

        console.log('Executing UPDATE...');
        const updateResult = await pool.query(updateQuery, params);
        console.log('Update Result Rows:', updateResult.rows);

        // 3. Verify
        const verify = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        console.log('Verified Bio:', verify.rows[0].bio);
        console.log('Verified Location:', verify.rows[0].location);

        if (verify.rows[0].bio === newBio) {
            console.log('✅ Persistence SUCCESS');
        } else {
            console.log('❌ Persistence FAILED');
        }

    } catch (err) {
        console.error('Test Error:', err);
    }
};

testPersistence();
