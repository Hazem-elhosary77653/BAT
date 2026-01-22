const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('--- DATABASE STRUCTURE AUDIT ---');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables found:', tables.map(t => t.name).join(', '));

tables.forEach(table => {
    console.log(`\nTable: ${table.name}`);
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
    });
});

process.exit(0);
