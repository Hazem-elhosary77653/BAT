const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

const migrate = () => {
    console.log(`Checking for missing columns in 'users' table at ${dbPath}...`);

    const columnsToAdd = [
        { name: 'bio', type: 'TEXT' },
        { name: 'location', type: 'VARCHAR(255)' },
        { name: 'avatar', type: 'VARCHAR(255)' },
        { name: 'settings', type: 'TEXT' }
    ];

    columnsToAdd.forEach(col => {
        try {
            db.prepare(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`).run();
            console.log(`✅ Added column: ${col.name}`);
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log(`ℹ️ Column '${col.name}' already exists.`);
            } else {
                console.error(`❌ Failed to add column '${col.name}':`, err.message);
            }
        }
    });

    console.log('Migration check complete.');
};

migrate();
