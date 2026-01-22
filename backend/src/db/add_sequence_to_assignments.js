const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

console.log('Starting migration: Add sequence_order to brd_review_assignments...');

try {
    // Check if column exists
    const info = db.prepare("PRAGMA table_info(brd_review_assignments)").all();
    const columnExists = info.some(col => col.name === 'sequence_order');

    if (!columnExists) {
        db.exec("ALTER TABLE brd_review_assignments ADD COLUMN sequence_order INTEGER DEFAULT 1;");
        console.log('Successfully added sequence_order column.');
    } else {
        console.log('Column sequence_order already exists.');
    }
} catch (err) {
    console.error('Error during migration:', err.message);
}

console.log('Migration completed.');
process.exit(0);
