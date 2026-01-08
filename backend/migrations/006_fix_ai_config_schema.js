const path = require('path');
const Database = require('better-sqlite3');

function migrate() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = OFF');

  try {
    console.log('Running migration: Fix AI config schema');

    // Detect current columns
    const columns = db.prepare("PRAGMA table_info(ai_configurations)").all();
    const hasApiKey = columns.some((c) => c.name === 'api_key');
    const hasModel = columns.some((c) => c.name === 'model');
    const needsRebuild = !hasApiKey || !hasModel || columns.some((c) => c.name === 'id' && c.type.toLowerCase().includes('integer'));

    if (!needsRebuild) {
      console.log('ai_configurations already in desired shape; skipping');
      return true;
    }

    db.exec('BEGIN TRANSACTION');

    db.exec(`
      CREATE TABLE ai_configurations_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        api_key TEXT,
        model TEXT DEFAULT 'gpt-3.5-turbo',
        temperature REAL DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 3000,
        language TEXT DEFAULT 'en',
        detail_level TEXT DEFAULT 'standard',
        prompt_template TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    const hasOldTable = columns.length > 0;
    if (hasOldTable) {
      const selectStmt = db.prepare(`
        SELECT 
          CAST(id AS TEXT) AS id,
          CAST(user_id AS TEXT) AS user_id,
          NULL AS api_key,
          'gpt-3.5-turbo' AS model,
          temperature,
          max_tokens,
          COALESCE(language, 'en') AS language,
          COALESCE(detail_level, 'standard') AS detail_level,
          prompt_template,
          is_active,
          created_at,
          updated_at
        FROM ai_configurations
      `);
      const rows = selectStmt.all();

      const insertStmt = db.prepare(`
        INSERT INTO ai_configurations_new (
          id, user_id, api_key, model, temperature, max_tokens, language, detail_level, prompt_template, is_active, created_at, updated_at
        ) VALUES (
          @id, @user_id, @api_key, @model, @temperature, @max_tokens, @language, @detail_level, @prompt_template, @is_active, @created_at, @updated_at
        );
      `);

      const insertMany = db.transaction((items) => {
        for (const item of items) {
          insertStmt.run(item);
        }
      });
      insertMany(rows);

      db.exec('DROP TABLE ai_configurations');
    }

    db.exec('ALTER TABLE ai_configurations_new RENAME TO ai_configurations');
    db.exec('CREATE INDEX IF NOT EXISTS idx_ai_config_user_id ON ai_configurations(user_id);');

    db.exec('COMMIT');
    console.log('✓ ai_configurations schema updated');
    return true;
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    db.exec('ROLLBACK');
    return false;
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
    db.close();
  }
}

if (require.main === module) {
  const success = migrate();
  process.exit(success ? 0 : 1);
}

module.exports = { migrate };
