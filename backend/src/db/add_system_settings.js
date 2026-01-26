const pool = require('./connection');

const migrateSystemSettings = async () => {
    const dbType = process.env.DB_TYPE || 'sqlite';

    const createTableSql = `
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER
    )
  `;

    const defaultSettings = [
        { key: 'general.site_name', value: 'Business Analyst Tool' },
        { key: 'general.site_description', value: 'Professional Business Analysis Platform' },
        { key: 'general.maintenance_mode', value: 'false' },
        { key: 'general.registration_enabled', value: 'true' },
        { key: 'security.session_timeout', value: '30' },
        { key: 'security.max_login_attempts', value: '5' },
        { key: 'security.password_min_length', value: '8' },
        { key: 'security.require_2fa_for_admin', value: 'false' },
        { key: 'security.allow_password_reset', value: 'true' },
        { key: 'email.smtp_host', value: '' },
        { key: 'email.smtp_port', value: '587' },
        { key: 'email.smtp_secure', value: 'true' },
        { key: 'email.from_email', value: 'noreply@businessanalyst.com' },
        { key: 'email.from_name', value: 'Business Analyst Tool' },
        { key: 'storage.max_file_size', value: '10' },
        { key: 'storage.allowed_file_types', value: 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg' },
        { key: 'storage.storage_path', value: '/uploads' },
        { key: 'api.rate_limit', value: '100' },
        { key: 'api.rate_limit_window', value: '15' },
        { key: 'api.api_enabled', value: 'true' }
    ];

    try {
        console.log('Migrating system_settings table...');

        if (dbType === 'sqlite') {
            const db = pool.sqlite;
            db.exec(createTableSql.replace('TIMESTAMP', 'DATETIME'));

            const insertStmt = db.prepare(`INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)`);
            for (const setting of defaultSettings) {
                insertStmt.run(setting.key, setting.value);
            }
        } else {
            await pool.query(createTableSql);
            for (const setting of defaultSettings) {
                await pool.query(
                    `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
                    [setting.key, setting.value]
                );
            }
        }

        console.log('✅ system_settings migration completed');
    } catch (err) {
        console.error('❌ system_settings migration error:', err.message);
        throw err;
    }
};

if (require.main === module) {
    migrateSystemSettings().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrateSystemSettings;
