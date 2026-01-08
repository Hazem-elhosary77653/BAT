/**
 * Migration: Add AI Configuration Tables
 * Creates tables for AI settings, BRD documents, and version history
 * 
 * Tables Created:
 * - ai_configurations: User's OpenAI API settings
 * - brd_documents: Generated Business Requirements Documents
 * - brd_versions: BRD version history
 */

const db = require('better-sqlite3')('database.db');

function migrate() {
  try {
    console.log('Running migration: Add AI Configuration Tables...');

    // Create ai_configurations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_configurations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        api_key TEXT NOT NULL,
        model TEXT DEFAULT 'gpt-3.5-turbo',
        temperature REAL DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 3000,
        language TEXT DEFAULT 'en',
        detail_level TEXT DEFAULT 'standard',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create brd_documents table
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create brd_versions table for version history
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL,
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brd_id) REFERENCES brd_documents(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ai_config_user_id ON ai_configurations(user_id);
      CREATE INDEX IF NOT EXISTS idx_brd_user_id ON brd_documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_brd_status ON brd_documents(status);
      CREATE INDEX IF NOT EXISTS idx_brd_created_at ON brd_documents(created_at);
      CREATE INDEX IF NOT EXISTS idx_brd_versions_brd_id ON brd_versions(brd_id);
    `);

    console.log('✓ Migration completed successfully');
    console.log('  - Created ai_configurations table');
    console.log('  - Created brd_documents table');
    console.log('  - Created brd_versions table');
    console.log('  - Created indexes for performance');

    return true;
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    return false;
  }
}

// Run migration
if (require.main === module) {
  const success = migrate();
  process.exit(success ? 0 : 1);
}

module.exports = { migrate };
