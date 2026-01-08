const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, role, is_active, created_at FROM users ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, role`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAuditAction(req.user.id, 'USER_ROLE_UPDATED', 'user', userId, { role: null }, { role });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Deactivate user
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await pool.query(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, is_active`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAuditAction(req.user.id, 'USER_DEACTIVATED', 'user', userId);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error deactivating user:', err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// Get system settings
const getSystemSettings = async (req, res) => {
  try {
    res.json({
      supportedLanguages: ['English', 'Spanish', 'French', 'German'],
      defaultLanguage: 'English',
      roles: ['admin', 'analyst', 'viewer'],
      features: {
        aiIntegration: true,
        azureDevOpsIntegration: true,
        documentManagement: true,
        reporting: true
      }
    });
  } catch (err) {
    console.error('Error fetching system settings:', err);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  deactivateUser,
  getAuditLogs,
  getSystemSettings
};
