const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

const checkAvatars = () => {
    const rows = db.prepare("SELECT id, email, avatar FROM users WHERE avatar IS NOT NULL AND avatar != ''").all();
    rows.forEach(row => {
        console.log(`ID: ${row.id} | Email: ${row.email} | Avatar: [${row.avatar}]`);
    });
};

checkAvatars();
