const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

const checkAvatars = () => {
    console.log(`Checking avatars in 'users' table at ${dbPath}...`);
    const rows = db.prepare('SELECT id, email, avatar FROM users WHERE avatar IS NOT NULL').all();

    if (rows.length === 0) {
        console.log('No users with avatars found.');
    } else {
        rows.forEach(row => {
            console.log(`User ${row.email} (ID: ${row.id}): Avatar='${row.avatar}'`);
        });
    }
};

checkAvatars();
