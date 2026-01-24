const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('--- RECOVERY SEARCH ---');
// Find the most recent deletion of a BRD
const deleted = db.prepare("SELECT * FROM audit_logs WHERE entity_type='brd_document' AND action='DELETE' ORDER BY created_at DESC LIMIT 5").all();

if (deleted.length === 0) {
    console.log('No recent deletions found in audit_logs.');
} else {
    for (const d of deleted) {
        console.log(`Found Deletion: ID=${d.entity_id}, Date=${d.created_at}`);
        // Now look for the newest state of this ID
        const state = db.prepare("SELECT * FROM audit_logs WHERE entity_id = ? AND (action='CREATE' OR action='UPDATE') ORDER BY created_at DESC LIMIT 1").get(d.entity_id);

        if (state) {
            console.log(`Found Restore Data for ${d.entity_id}: Action=${state.action}`);
            console.log('Values:', state.new_values);
        } else {
            console.log(`No restore data found for ${d.entity_id}.`);
        }
    }
}
