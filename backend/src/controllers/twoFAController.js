const { generateTwoFASetup, enableTwoFA, verifyTwoFACode, verifyBackupCode, disableTwoFA, getTwoFAStatus } = require('../services/twoFAService');
const { logUserActivity } = require('../services/activityService');
const { logAuditAction } = require('../utils/audit');

// Generate 2FA setup QR code
const generateSetup = async (req, res) => {
  try {
    const user = req.user;

    const setup = await generateTwoFASetup(user.id, user.email);

    res.json({
      success: true,
      data: {
        secret: setup.secret,
        qrCode: setup.qrCode,
        backupCodes: setup.backupCodes,
        manualEntry: setup.manualEntry
      }
    });
  } catch (err) {
    console.error('Generate 2FA setup error:', err);
    res.status(500).json({ error: 'Failed to generate 2FA setup' });
  }
};

// Enable 2FA
const enableTFA = async (req, res) => {
  try {
    const { secret, verificationCode, backupCodes } = req.body;

    if (!secret || !verificationCode || !backupCodes) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await enableTwoFA(req.user.id, secret, backupCodes, verificationCode);

    // Log activity
    await logUserActivity(
      req.user.id,
      '2FA_ENABLED',
      'User enabled 2-factor authentication',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    // Log audit
    await logAuditAction(
      req.user.id,
      '2FA_ENABLED',
      'user',
      req.user.id,
      null,
      {}
    );

    res.json({
      success: true,
      message: '2-factor authentication enabled successfully',
      data: result
    });
  } catch (err) {
    console.error('Enable 2FA error:', err);

    if (err.message === 'Invalid verification code') {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
};

// Verify 2FA code during login
const verifyCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and code are required' });
    }

    const isValid = await verifyTwoFACode(userId, code);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // Log activity
    await logUserActivity(
      userId,
      '2FA_VERIFIED',
      '2-factor authentication code verified',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    res.json({
      success: true,
      message: 'Code verified'
    });
  } catch (err) {
    console.error('Verify 2FA code error:', err);

    if (err.message.includes('not enabled')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to verify code' });
  }
};

// Verify backup code
const verifyCode2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and code are required' });
    }

    const result = await verifyBackupCode(userId, code);

    // Log activity
    await logUserActivity(
      userId,
      '2FA_BACKUP_CODE_USED',
      'Backup code used for 2-factor authentication',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    res.json({
      success: true,
      message: 'Backup code verified',
      data: result
    });
  } catch (err) {
    console.error('Verify backup code error:', err);

    if (err.message.includes('not enabled') || err.message.includes('Invalid')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to verify backup code' });
  }
};

// Disable 2FA
const disableTFA = async (req, res) => {
  try {
    const result = await disableTwoFA(req.user.id);

    // Log activity
    await logUserActivity(
      req.user.id,
      '2FA_DISABLED',
      'User disabled 2-factor authentication',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    // Log audit
    await logAuditAction(
      req.user.id,
      '2FA_DISABLED',
      'user',
      req.user.id,
      null,
      {}
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('Disable 2FA error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

// Get 2FA status
const getStatus = async (req, res) => {
  try {
    const status = await getTwoFAStatus(req.user.id);

    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    console.error('Get 2FA status error:', err);
    res.status(500).json({ error: 'Failed to fetch 2FA status' });
  }
};

module.exports = {
  generateSetup,
  enableTFA,
  verifyCode,
  verifyCode2FA,
  disableTFA,
  getStatus
};
