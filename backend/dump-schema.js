const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

function getColumns(table) {
    try {
        const info = db.prepare(`PRAGMA table_info(${table})`).all();
        return info.map(c => `${c.name} (${c.type})`).join(', ');
    } catch (e) {
        return `ERROR: ${e.message}`;
    }
}

const out = `
DIAGRAMS: ${getColumns('diagrams')}
DOCUMENTS: ${getColumns('documents')}
`;

fs.writeFileSync('schema_dump.txt', out);
console.log('Done');
process.exit(0);
