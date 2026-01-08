#!/usr/bin/env node

/**
 * Migration Script: Add settings column to users table
 * Run this once to prepare the database for user settings functionality
 * 
 * Usage:
 *   node migrate-add-settings.js
 */

const db = require('./src/db/connection');

const migrateSettings = () => {
  console.log('🔄 Starting migration: Add settings column to users table...\n');

  try {
    // Check if settings column exists
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const hasSettingsColumn = columns.some(col => col.name === 'settings');

    if (hasSettingsColumn) {
      console.log('✅ Settings column already exists in users table');
      console.log('   Migration skipped (already applied)\n');
      return;
    }

    // Add settings column if it doesn't exist
    console.log('📝 Adding settings column to users table...');
    db.prepare(`
      ALTER TABLE users 
      ADD COLUMN settings TEXT DEFAULT NULL
    `).run();
    
    console.log('✅ Settings column added successfully\n');

    // Initialize default settings for existing users (optional)
    console.log('📊 Initializing default settings for existing users...');
    
    const defaultSettings = JSON.stringify({
      notifications: {
        email_login: true,
        email_security: true,
        email_updates: true,
        email_weekly: true,
        push_enabled: true,
        sms_enabled: false
      },
      privacy: {
        profile_public: false,
        show_online_status: true,
        allow_messages: true
      },
      display: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY'
      },
      accessibility: {
        high_contrast: false,
        reduce_motion: false,
        large_text: false,
        screen_reader: false
      },
      security: {
        two_factor: false,
        sessions_timeout: '30',
        remember_device: true
      }
    });

    const stmt = db.prepare(`
      UPDATE users 
      SET settings = ? 
      WHERE settings IS NULL
    `);
    
    const result = stmt.run(defaultSettings);
    console.log(`✅ Default settings applied to ${result.changes} users\n`);

    // Verify migration
    const verifyColumns = db.prepare("PRAGMA table_info(users)").all();
    const settingsCol = verifyColumns.find(col => col.name === 'settings');
    
    if (settingsCol) {
      console.log('🎉 Migration completed successfully!\n');
      console.log('📋 Summary:');
      console.log(`   - Settings column type: ${settingsCol.type}`);
      console.log(`   - Default value: NULL (settings initialized on first load)`);
      console.log(`   - Users initialized: ${result.changes}\n`);
      
      return true;
    } else {
      console.log('❌ Migration verification failed');
      return false;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📝 Error details:', error);
    process.exit(1);
  }
};

// Run migration
if (require.main === module) {
  const success = migrateSettings();
  process.exit(success ? 0 : 1);
}

module.exports = { migrateSettings };
