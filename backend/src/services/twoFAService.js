const pool = require('../db/connection');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate 2FA setup
const generateTwoFASetup = async (userId, userEmail) => {
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Business Analyst Assistant (${userEmail})`,
      issuer: 'Business Analyst Assistant',
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
      manualEntry: secret.otpauth_url
    };
  } catch (err) {
    console.error('Generate 2FA setup error:', err);
    throw err;
  }
};

// Enable 2FA
const enableTwoFA = async (userId, secret, backupCodes, verificationCode) => {
  try {
    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: verificationCode,
      window: 2
    });

    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Save 2FA to database
    const result = await pool.query(
      `INSERT INTO user_2fa (user_id, secret, is_enabled, backup_codes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET secret = $2, is_enabled = $3, backup_codes = $4, updated_at = NOW()
       RETURNING id, user_id, is_enabled`,
      [userId, secret, 1, JSON.stringify(backupCodes)]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Enable 2FA error:', err);
    throw err;
  }
};

// Verify 2FA code
const verifyTwoFACode = async (userId, code) => {
  try {
    const result = await pool.query(
      `SELECT secret FROM user_2fa WHERE user_id = $1 AND is_enabled = 1`,
      [userId]
    );

    if (!result.rows.length) {
      throw new Error('2FA not enabled for this user');
    }

    const secret = result.rows[0].secret;

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    return isValid;
  } catch (err) {
    console.error('Verify 2FA code error:', err);
    throw err;
  }
};

// Verify backup code
const verifyBackupCode = async (userId, code) => {
  try {
    const result = await pool.query(
      `SELECT backup_codes FROM user_2fa WHERE user_id = $1 AND is_enabled = 1`,
      [userId]
    );

    if (!result.rows.length) {
      throw new Error('2FA not enabled for this user');
    }

    const backupCodes = JSON.parse(result.rows[0].backup_codes);
    const codeIndex = backupCodes.indexOf(code.toUpperCase());

    if (codeIndex === -1) {
      throw new Error('Invalid backup code');
    }

    // Remove used code
    backupCodes.splice(codeIndex, 1);

    // Update database
    await pool.query(
      `UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2`,
      [JSON.stringify(backupCodes), userId]
    );

    return { success: true, remaining: backupCodes.length };
  } catch (err) {
    console.error('Verify backup code error:', err);
    throw err;
  }
};

// Disable 2FA
const disableTwoFA = async (userId) => {
  try {
    const result = await pool.query(
      `UPDATE user_2fa SET is_enabled = 0 WHERE user_id = $1
       RETURNING id`,
      [userId]
    );

    return { success: true, message: '2FA disabled' };
  } catch (err) {
    console.error('Disable 2FA error:', err);
    throw err;
  }
};

// Get 2FA status
const getTwoFAStatus = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, is_enabled, backup_codes FROM user_2fa WHERE user_id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return { enabled: false, backupCodesRemaining: 0 };
    }

    const twoFa = result.rows[0];
    const backupCodes = JSON.parse(twoFa.backup_codes || '[]');

    return {
      enabled: twoFa.is_enabled === 1,
      backupCodesRemaining: backupCodes.length
    };
  } catch (err) {
    console.error('Get 2FA status error:', err);
    throw err;
  }
};

module.exports = {
  generateTwoFASetup,
  enableTwoFA,
  verifyTwoFACode,
  verifyBackupCode,
  disableTwoFA,
  getTwoFAStatus
};
