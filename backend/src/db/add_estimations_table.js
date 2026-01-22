const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

console.log('Migrating: Adding brd_estimations table...');

try {
    db.exec(`
    CREATE TABLE IF NOT EXISTS brd_estimations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brd_id TEXT NOT NULL,
      man_hours INTEGER,
      complexity_score INTEGER,
      estimated_duration VARCHAR(100),
      recommended_team TEXT, -- JSON
      key_challenges TEXT,   -- JSON
      rationale TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(brd_id),
      FOREIGN KEY (brd_id) REFERENCES brd_documents(id) ON DELETE CASCADE
    )
  `);
    console.log('Success: brd_estimations table created.');
} catch (error) {
    console.error('Error creating brd_estimations table:', error.message);
}
