const pool = require('../db/connection');
const { logUserActivity } = require('../services/activityService');

// Get system settings
const getSystemSettings = async (req, res) => {
  try {
    // Only admins can access system settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Fetch all settings from database
    const result = await pool.query(`SELECT key, value FROM system_settings ORDER BY key`);
    
    if (!result.rows || result.rows.length === 0) {
      return res.json(getDefaultSettings());
    }

    // Convert flat key-value pairs to nested object
    const settings = {};
    result.rows.forEach(row => {
      const [section, key] = row.key.split('.');
      if (!settings[section]) settings[section] = {};
      
      // Parse boolean and numeric values
      let value = row.value;
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(value) && value !== '') value = parseInt(value);
      
      settings[section][key] = value;
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error fetching system settings:', err);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
};

// Update system settings
const updateSystemSettings = async (req, res) => {
  try {
    // Only admins can update system settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { general, security, email, storage, api } = req.body;
    
    // Flatten and update settings
    const updates = [];
    
    // Helper function to add updates
    const addUpdates = (section, obj) => {
      if (obj) {
        for (const [key, value] of Object.entries(obj)) {
          updates.push({
            key: `${section}.${key}`,
            value: String(value)
          });
        }
      }
    };
    
    addUpdates('general', general);
    addUpdates('security', security);
    addUpdates('email', email);
    addUpdates('storage', storage);
    addUpdates('api', api);

    // Update all settings in database
    for (const { key, value } of updates) {
      await pool.query(
        `UPDATE system_settings SET value = $1, updated_at = datetime('now'), updated_by = $2 WHERE key = $3`,
        [value, req.user.id, key]
      );
    }

    await logUserActivity(
      req.user.id,
      'SYSTEM_SETTINGS_UPDATED',
      'System settings updated',
      {
        sections: Object.keys(req.body).filter(k => req.body[k]),
        updatedCount: updates.length
      }
    );

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: req.body
    });
  } catch (err) {
    console.error('Error updating system settings:', err);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
};

// Reset system settings to defaults
const resetSystemSettings = async (req, res) => {
  try {
    // Only admins can reset system settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const defaultSettings = getDefaultSettings();

    // Reset all settings in database
    for (const [section, settings] of Object.entries(defaultSettings)) {
      for (const [key, value] of Object.entries(settings)) {
        await pool.query(
          `UPDATE system_settings SET value = $1, updated_at = datetime('now'), updated_by = $2 WHERE key = $3`,
          [String(value), req.user.id, `${section}.${key}`]
        );
      }
    }

    await logUserActivity(
      req.user.id,
      'SYSTEM_SETTINGS_RESET',
      'System settings reset to defaults',
      { reset_by: req.user.email }
    );

    res.json({
      success: true,
      message: 'System settings reset to defaults',
      data: defaultSettings
    });
  } catch (err) {
    console.error('Error resetting system settings:', err);
    res.status(500).json({ error: 'Failed to reset system settings' });
  }
};

// Get default settings
const getDefaultSettings = () => {
  return {
    general: {
      site_name: 'Business Analyst Tool',
      site_description: 'Professional Business Analysis Platform',
      maintenance_mode: false,
      registration_enabled: true
    },
    security: {
      session_timeout: 30,
      max_login_attempts: 5,
      password_min_length: 8,
      require_2fa_for_admin: false,
      allow_password_reset: true
    },
    email: {
      smtp_host: '',
      smtp_port: 587,
      smtp_secure: true,
      smtp_user: '',
      from_email: 'noreply@businessanalyst.com',
      from_name: 'Business Analyst Tool'
    },
    storage: {
      max_file_size: 10,
      allowed_file_types: 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg',
      storage_path: '/uploads'
    },
    api: {
      rate_limit: 100,
      rate_limit_window: 15,
      api_enabled: true
    }
  };
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  resetSystemSettings
};
