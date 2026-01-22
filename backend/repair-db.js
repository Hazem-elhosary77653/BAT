const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('--- REPAIRING DIAGRAMS TABLE ---');

try {
    const info = db.prepare("PRAGMA table_info(diagrams)").all();
    const colNames = info.map(c => c.name);
    console.log('Existing columns:', colNames.join(', '));

    if (!colNames.includes('diagram_data')) {
        console.log('Adding diagram_data column...');
        db.exec("ALTER TABLE diagrams ADD COLUMN diagram_data TEXT;");

        if (colNames.includes('mermaid_code')) {
            console.log('Copying data from mermaid_code to diagram_data...');
            db.exec("UPDATE diagrams SET diagram_data = mermaid_code;");
        }
    }

    if (!colNames.includes('source_document_id')) {
        console.log('Adding source_document_id column...');
        db.exec("ALTER TABLE diagrams ADD COLUMN source_document_id INTEGER;");
    }

    // Ensure documents table exists (it should, but safety first)
    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        tags TEXT,
        access_level VARCHAR(50) DEFAULT 'private',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('Verification:');
    const finalInfo = db.prepare("PRAGMA table_info(diagrams)").all();
    console.log('Final columns:', finalInfo.map(c => c.name).join(', '));

    console.log('--- SUCCESS ---');
} catch (e) {
    console.error('ERROR during repair:', e.message);
} finally {
    db.close();
}
