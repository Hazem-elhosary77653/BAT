const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('--- DATA RECOVERY START ---');
const rows = db.prepare("SELECT * FROM audit_logs WHERE entity_type='brd_document' AND (action='CREATE' OR action='UPDATE') ORDER BY created_at DESC").all();

let output = '';
for (const row of rows) {
    try {
        const data = JSON.parse(row.new_values || '{}');
        if (data.content && data.title) {
            output += `=== BRD RECOVERY ===\nID: ${row.entity_id}\nDATE: ${row.created_at}\nTITLE: ${data.title}\nCONTENT START: ${data.content.substring(0, 100)}...\nCONTENT FULL: ${data.content}\n\n`;
        }
    } catch (e) {
        // Not JSON
    }
}

fs.writeFileSync('restored_brds.txt', output);
console.log('--- RECOVERY END ---');
