const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend/database.db');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

const expectedTables = ['brd_collaborators', 'brd_documents', 'users'];
expectedTables.forEach(t => {
    const exists = tables.find(tbl => tbl.name === t);
    if (exists) {
        console.log(`✅ Table ${t} exists`);
        const columns = db.prepare(`PRAGMA table_info(${t})`).all();
        console.log(`   Columns: ${columns.map(c => c.name).join(', ')}`);
    } else {
        console.log(`❌ Table ${t} MISSING`);
    }
});
