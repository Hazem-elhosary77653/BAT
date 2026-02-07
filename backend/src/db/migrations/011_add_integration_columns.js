const { sqlite: db } = require('../connection');

/**
 * Migration: Add Slack and Teams integration columns to notification_settings
 */
const addIntegrationColumns = () => {
  try {
    console.log('[Migration] Adding integration columns to notification_settings...');

    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(notification_settings)").all();
    const hasSlackColumn = tableInfo.some(col => col.name === 'is_enabled_slack');
    const hasTeamsColumn = tableInfo.some(col => col.name === 'is_enabled_teams');

    if (!hasSlackColumn) {
      db.prepare(`
        ALTER TABLE notification_settings 
        ADD COLUMN is_enabled_slack INTEGER DEFAULT 0
      `).run();
      console.log('✅ Added is_enabled_slack column');
    }

    if (!hasTeamsColumn) {
      db.prepare(`
        ALTER TABLE notification_settings 
        ADD COLUMN is_enabled_teams INTEGER DEFAULT 0
      `).run();
      console.log('✅ Added is_enabled_teams column');
    }

    console.log('✅ Integration columns migration complete');
    return { success: true };
  } catch (error) {
    console.error('[Migration] Error adding integration columns:', error.message);
    throw error;
  }
};

/**
 * Add integration user mapping tables
 */
const addIntegrationUserMappings = () => {
  try {
    console.log('[Migration] Adding integration user mapping tables...');

    // Check if users table has integration columns
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasSlackColumn = tableInfo.some(col => col.name === 'slack_user_id');
    const hasTeamsColumn = tableInfo.some(col => col.name === 'teams_user_id');

    if (!hasSlackColumn) {
      db.prepare(`
        ALTER TABLE users 
        ADD COLUMN slack_user_id TEXT
      `).run();
      console.log('✅ Added slack_user_id column to users');
    }

    if (!hasTeamsColumn) {
      db.prepare(`
        ALTER TABLE users 
        ADD COLUMN teams_user_id TEXT
      `).run();
      console.log('✅ Added teams_user_id column to users');
    }

    console.log('✅ Integration user mappings migration complete');
    return { success: true };
  } catch (error) {
    console.error('[Migration] Error adding user mappings:', error.message);
    throw error;
  }
};

/**
 * Run all integration migrations
 */
const migrateIntegrations = () => {
  try {
    addIntegrationColumns();
    addIntegrationUserMappings();
    return { success: true };
  } catch (error) {
    console.error('[Migration] Integration migrations failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Run migrations if executed directly
if (require.main === module) {
  migrateIntegrations();
  console.log('✅ All integration migrations completed');
}

module.exports = {
  addIntegrationColumns,
  addIntegrationUserMappings,
  migrateIntegrations
};
