const pool = require('../db/connection');
const { logUserActivity } = require('../services/activityService');

/**
 * Get user settings
 * GET /api/user-settings
 */
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get settings from database
    const result = await pool.query(
      `SELECT settings FROM users WHERE id = $1`,
      [userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Parse settings JSON
    let settings = {};
    try {
      settings = user.settings ? JSON.parse(user.settings) : getDefaultSettings();
    } catch (e) {
      settings = getDefaultSettings();
    }

    // Flatten display settings for frontend (theme, language)
    const flattenedSettings = {
      ...settings,
      theme: settings.display?.theme || 'light',
      language: settings.display?.language || 'en'
    };

    res.json({
      success: true,
      data: flattenedSettings
    });
  } catch (err) {
    console.error('Get user settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

/**
 * Update user settings
 * PUT /api/user-settings
 */
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, privacy, display, accessibility, security, theme, language } = req.body;

    if (!notifications && !privacy && !display && !accessibility && !security && !theme && !language) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Get current settings
    const currentResult = await pool.query(
      `SELECT settings FROM users WHERE id = $1`,
      [userId]
    );

    if (!currentResult.rows || currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = currentResult.rows[0];

    let currentSettings = {};
    try {
      currentSettings = user.settings ? JSON.parse(user.settings) : getDefaultSettings();
    } catch (e) {
      currentSettings = getDefaultSettings();
    }

    // Merge new settings with existing ones
    // Handle flat theme/language from frontend by merging into display
    const mergedDisplay = {
      ...(currentSettings.display || {}),
      ...(display || {})
    };

    if (theme) mergedDisplay.theme = theme;
    if (language) mergedDisplay.language = language;

    const updatedSettings = {
      notifications: notifications || currentSettings.notifications || {},
      privacy: privacy || currentSettings.privacy || {},
      display: mergedDisplay,
      accessibility: accessibility || currentSettings.accessibility || {},
      security: security || currentSettings.security || {}
    };

    // Validate security settings
    if (security && security.sessions_timeout) {
      const timeout = parseInt(security.sessions_timeout);
      if (timeout < 5 || timeout > 1440) {
        return res.status(400).json({
          error: 'Session timeout must be between 5 and 1440 minutes'
        });
      }
    }

    // Update database
    await pool.query(
      `UPDATE users SET settings = $1 WHERE id = $2`,
      [JSON.stringify(updatedSettings), userId]
    );

    // Log activity
    await logUserActivity(
      userId,
      'SETTINGS_UPDATE',
      'User updated their settings',
      {
        sections: Object.keys(updatedSettings).filter(k => updatedSettings[k]),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (err) {
    console.error('Update user settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

/**
 * Reset settings to default
 * POST /api/user-settings/reset
 */
const resetUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const defaultSettings = getDefaultSettings();

    // Update database
    const updateQuery = `
      UPDATE users 
      SET settings = ? 
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(JSON.stringify(defaultSettings), userId);

    // Log activity
    await logUserActivity(
      userId,
      'SETTINGS_RESET',
      'User reset their settings to default',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    res.json({
      success: true,
      message: 'Settings reset to default',
      data: defaultSettings
    });
  } catch (err) {
    console.error('Reset user settings error:', err);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
};

/**
 * Get default settings
 */
const getDefaultSettings = () => {
  return {
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
  };
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
  getDefaultSettings
};
