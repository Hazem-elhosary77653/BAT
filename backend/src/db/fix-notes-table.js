const { sqlite: db } = require('./connection');

async function fixNotesTable() {
    try {
        console.log('--- START FIXING user_notes TABLE ---');

        // 1. Rename existing table
        console.log('Renaming existing user_notes table to user_notes_old...');
        db.exec('ALTER TABLE user_notes RENAME TO user_notes_old');

        // 2. Create new table with correct SQLite syntax
        console.log('Creating new user_notes table with correct syntax...');
        db.exec(`
            CREATE TABLE user_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255),
                content TEXT,
                color VARCHAR(50) DEFAULT '#ffffff',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Copy data and recover IDs
        console.log('Copying data and recovering IDs...');
        // We exclude 'id' from the INSERT to let SQLite auto-generate it
        db.exec(`
            INSERT INTO user_notes (user_id, title, content, color, created_at, updated_at)
            SELECT user_id, title, content, color, 
                   COALESCE(created_at, CURRENT_TIMESTAMP), 
                   COALESCE(updated_at, CURRENT_TIMESTAMP)
            FROM user_notes_old
        `);

        // 4. Drop old table
        console.log('Dropping old table...');
        db.exec('DROP TABLE user_notes_old');

        console.log('✅ table fix completed successfully');

        // Final check
        const count = db.prepare('SELECT COUNT(*) as total FROM user_notes').get().total;
        console.log(`Verified: ${count} notes transferred to the new table.`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Fix failed:', err.message);
        // Attempt to rollback by renaming back if it failed after rename but before drop
        try {
            const hasOld = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_notes_old'").get();
            if (hasOld) {
                console.log('Attempting to rollback: renaming user_notes_old back to user_notes');
                db.exec('DROP TABLE IF EXISTS user_notes');
                db.exec('ALTER TABLE user_notes_old RENAME TO user_notes');
            }
        } catch (rollbackErr) {
            console.error('Rollback failed:', rollbackErr.message);
        }
        process.exit(1);
    }
}

fixNotesTable();
