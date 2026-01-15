const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

try {
    const tableInfo = db.prepare("PRAGMA table_info(user_stories)").all();
    const hasGroupId = tableInfo.some(col => col.name === 'group_id');

    if (!hasGroupId) {
        console.log('Column group_id missing in user_stories. Adding it...');
        db.exec('ALTER TABLE user_stories ADD COLUMN group_id INTEGER REFERENCES story_groups(id) ON DELETE SET NULL');
        console.log('Column group_id added successfully.');
    } else {
        console.log('Column group_id already exists in user_stories.');
    }
} catch (error) {
    console.error('Error checking/updating user_stories table:', error.message);
} finally {
    db.close();
}
