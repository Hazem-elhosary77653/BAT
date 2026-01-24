const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.db');
const db = new Database(dbPath);

async function testResetFlow() {
    console.log('--- Testing Password Reset Flow ---');

    // 1. Get a test user
    const user = db.prepare('SELECT id, email, username, password_hash FROM users LIMIT 1').get();
    if (!user) {
        console.error('No users found in database');
        return;
    }

    console.log(`Testing with user: ${user.username} (${user.email})`);
    const originalHash = user.password_hash;

    // 2. Simulate Reset
    const newPassword = 'NewPassword123!';
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    console.log('Generating new hash...');

    // 3. Update Database
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
    console.log('Database updated with new hash.');

    // 4. Verify Update
    const updatedUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
    console.log('New hash stored:', updatedUser.password_hash === newHash ? 'YES' : 'NO');

    // 5. Test Comparison (Login logic)
    const isMatchBefore = await bcrypt.compare(newPassword, originalHash);
    const isMatchAfter = await bcrypt.compare(newPassword, updatedUser.password_hash);

    console.log('Match with OLD hash (should be false):', isMatchBefore);
    console.log('Match with NEW hash (should be true):', isMatchAfter);

    // 6. Cleanup (Restore original hash)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(originalHash, user.id);
    console.log('Restored original hash.');

    console.log('--- Test Finished ---');
}

testResetFlow().catch(console.error);
