const pool = require('./src/db/connection');

async function createSystemSettingsTable() {
  try {
    console.log('Creating system_settings table...');

    // Create system_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `);

    console.log('✅ system_settings table created');

    // Insert default settings
    const defaultSettings = {
      'general.site_name': 'Business Analyst Tool',
      'general.site_description': 'Professional Business Analysis Platform',
      'general.maintenance_mode': 'false',
      'general.registration_enabled': 'true',
      'security.session_timeout': '30',
      'security.max_login_attempts': '5',
      'security.password_min_length': '8',
      'security.require_2fa_for_admin': 'false',
      'security.allow_password_reset': 'true',
      'email.smtp_host': '',
      'email.smtp_port': '587',
      'email.smtp_secure': 'true',
      'email.smtp_user': '',
      'email.from_email': 'noreply@businessanalyst.com',
      'email.from_name': 'Business Analyst Tool',
      'storage.max_file_size': '10',
      'storage.allowed_file_types': 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg',
      'storage.storage_path': '/uploads',
      'api.rate_limit': '100',
      'api.rate_limit_window': '15',
      'api.api_enabled': 'true'
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await pool.query(
        `INSERT OR IGNORE INTO system_settings (key, value) VALUES ($1, $2)`,
        [key, value]
      );
    }

    console.log('✅ Default settings inserted');
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createSystemSettingsTable();
