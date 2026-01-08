/**
 * Migration: Add story AI support
 * - Adds story templates table
 * - Adds AI-related columns to user_stories
 */

const db = require('better-sqlite3')('database.db');

function migrate() {
  try {
    console.log('Running migration: Add story AI tables...');

    // Add AI columns to user_stories if they do not exist
    const columns = db.prepare("PRAGMA table_info(user_stories)").all();
    const existing = columns.map((c) => c.name);

    if (!existing.includes('estimated_points')) {
      db.exec(`ALTER TABLE user_stories ADD COLUMN estimated_points INTEGER`);
      console.log('  - Added column user_stories.estimated_points');
    }

    if (!existing.includes('business_value')) {
      db.exec(`ALTER TABLE user_stories ADD COLUMN business_value TEXT`);
      console.log('  - Added column user_stories.business_value');
    }

    if (!existing.includes('generated_by_ai')) {
      db.exec(`ALTER TABLE user_stories ADD COLUMN generated_by_ai INTEGER DEFAULT 0`);
      console.log('  - Added column user_stories.generated_by_ai');
    }

    // Create story_templates table
    db.exec(`
      CREATE TABLE IF NOT EXISTS story_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        template_content TEXT,
        fields_definition TEXT,
        category TEXT,
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_story_templates_category ON story_templates(category);
      CREATE INDEX IF NOT EXISTS idx_story_templates_is_default ON story_templates(is_default);
      CREATE INDEX IF NOT EXISTS idx_user_stories_user_id ON user_stories(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_stories_status ON user_stories(status);
      CREATE INDEX IF NOT EXISTS idx_user_stories_created_at ON user_stories(created_at);
    `);

    // Seed default templates if table is empty
    const count = db.prepare('SELECT COUNT(*) as count FROM story_templates').get().count;
    if (count === 0) {
      const insert = db.prepare(`
        INSERT INTO story_templates (id, name, description, template_content, fields_definition, category, is_default)
        VALUES (@id, @name, @description, @template_content, @fields_definition, @category, @is_default)
      `);

      const templates = [
        {
          id: 'template-user-story',
          name: 'User Story',
          description: 'Standard end-user facing story with acceptance criteria.',
          template_content: JSON.stringify({
            title: 'As a [role], I want [capability] so that [benefit]',
            acceptance_criteria: [
              'Given [context], when [action], then [outcome]',
              'Edge cases are handled',
              'Validation errors are shown clearly'
            ],
            priority: 'P2',
            estimated_points: 5
          }),
          fields_definition: JSON.stringify({
            required: ['title', 'description', 'acceptance_criteria'],
            optional: ['estimated_points', 'priority', 'business_value']
          }),
          category: 'user',
          is_default: 1,
        },
        {
          id: 'template-technical-task',
          name: 'Technical Task',
          description: 'Engineering-focused task with technical acceptance criteria.',
          template_content: JSON.stringify({
            title: 'Implement [component] to support [feature]',
            acceptance_criteria: [
              'Code is covered by automated tests',
              'Performance budget is met',
              'Logs and metrics are added'
            ],
            priority: 'P2',
            estimated_points: 3
          }),
          fields_definition: JSON.stringify({
            required: ['title', 'description', 'acceptance_criteria'],
            optional: ['estimated_points', 'priority', 'business_value']
          }),
          category: 'technical',
          is_default: 0,
        },
        {
          id: 'template-bug-fix',
          name: 'Bug Fix',
          description: 'Bug report with reproduction steps and expected behavior.',
          template_content: JSON.stringify({
            title: 'Fix: [short summary]',
            acceptance_criteria: [
              'Repro steps no longer reproduce the issue',
              'Regression tests added',
              'Monitoring alerts configured if applicable'
            ],
            priority: 'P1',
            estimated_points: 2
          }),
          fields_definition: JSON.stringify({
            required: ['title', 'description', 'acceptance_criteria'],
            optional: ['estimated_points', 'priority', 'business_value']
          }),
          category: 'bug',
          is_default: 0,
        },
        {
          id: 'template-enhancement',
          name: 'Enhancement',
          description: 'Small UX/content improvement.',
          template_content: JSON.stringify({
            title: 'Improve [area] to help users [benefit]',
            acceptance_criteria: [
              'User flow is simplified',
              'Copy is clear and concise',
              'No performance regressions'
            ],
            priority: 'P3',
            estimated_points: 2
          }),
          fields_definition: JSON.stringify({
            required: ['title', 'description', 'acceptance_criteria'],
            optional: ['estimated_points', 'priority', 'business_value']
          }),
          category: 'enhancement',
          is_default: 0,
        },
      ];

      const seedTransaction = db.transaction((rows) => {
        rows.forEach((row) => insert.run(row));
      });

      seedTransaction(templates);
      console.log('  - Seeded default story templates');
    }

    console.log('✓ Migration completed successfully');
    return true;
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  const success = migrate();
  process.exit(success ? 0 : 1);
}

module.exports = { migrate };
