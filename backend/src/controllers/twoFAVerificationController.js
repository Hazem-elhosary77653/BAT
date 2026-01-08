const pool = require('../db/connection');
const speakeasy = require('speakeasy');
const { generateToken } = require('../utils/auth');
const { createSession } = require('../services/sessionManagementService');
const { logAuditAction } = require('../utils/audit');

const buildUserPayload = (userRow) => ({
  id: userRow.id,
  email: userRow.email,
  username: userRow.username,
  firstName: userRow.first_name,
  lastName: userRow.last_name,
  role: userRow.role
});

// Verify 2FA code
const verify2FACode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and code required' });
    }

    const result = await pool.query(
      `SELECT secret, is_enabled FROM user_2fa WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User has not set up 2FA' });
    }

    const twoFAData = result.rows[0];

    if (!twoFAData.is_enabled) {
      return res.status(400).json({ error: '2FA is not enabled for this user' });
    }

    const userResult = await pool.query(
      `SELECT id, email, username, first_name, last_name, role, is_active
       FROM users WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    const verified = speakeasy.totp.verify({
      secret: twoFAData.secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    const session = await createSession(user.id, req.ip || '', req.headers['user-agent'] || '');
    const token = generateToken(user, session.id);

    try {
      await logAuditAction(user.id, 'USER_LOGIN_2FA', 'user', user.id, null, null, req.ip);
    } catch (auditErr) {
      console.warn('Audit log failed after 2FA login:', auditErr.message);
    }

    res.json({
      success: true,
      message: 'Code verified successfully',
      token,
      user: buildUserPayload(user)
    });
  } catch (err) {
    console.error('2FA verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Verify backup code
const verify2FABackupCode = async (req, res) => {
  try {
    const { userId, backupCode } = req.body;

    if (!userId || !backupCode) {
      return res.status(400).json({ error: 'User ID and backup code required' });
    }

    const result = await pool.query(
      `SELECT backup_codes FROM user_2fa WHERE user_id = $1 AND is_enabled = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User has not set up 2FA' });
    }

    const twoFAData = result.rows[0];
    const backupCodes = JSON.parse(twoFAData.backup_codes || '[]');

    const codeIndex = backupCodes.indexOf(backupCode);
    if (codeIndex === -1) {
      return res.status(401).json({ error: 'Invalid backup code' });
    }

    const userResult = await pool.query(
      `SELECT id, email, username, first_name, last_name, role, is_active
       FROM users WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    backupCodes.splice(codeIndex, 1);

    await pool.query(
      `UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2`,
      [JSON.stringify(backupCodes), userId]
    );

    const session = await createSession(user.id, req.ip || '', req.headers['user-agent'] || '');
    const token = generateToken(user, session.id);

    try {
      await logAuditAction(user.id, 'USER_LOGIN_2FA_BACKUP', 'user', user.id, null, null, req.ip);
    } catch (auditErr) {
      console.warn('Audit log failed after 2FA backup login:', auditErr.message);
    }

    res.json({
      success: true,
      message: 'Backup code verified successfully',
      remainingCodes: backupCodes.length,
      token,
      user: buildUserPayload(user)
    });
  } catch (err) {
    console.error('Backup code verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Get 2FA status
const get2FAStatus = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const result = await pool.query(
      `SELECT is_enabled FROM user_2fa WHERE user_id = $1`,
      [userId]
    );

    const isEnabled = result.rows.length > 0 ? result.rows[0].is_enabled : false;

    res.json({
      success: true,
      data: {
        is2FAEnabled: isEnabled
      }
    });
  } catch (err) {
    console.error('Get 2FA status error:', err);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required to disable 2FA' });
    }

    await pool.query(
      `UPDATE user_2fa SET is_enabled = false WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: '2FA has been disabled'
    });
  } catch (err) {
    console.error('Disable 2FA error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

module.exports = {
  verify2FACode,
  verify2FABackupCode,
  get2FAStatus,
  disable2FA
};
