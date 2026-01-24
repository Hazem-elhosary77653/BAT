const pool = require('../db/connection');
const crypto = require('crypto');
const { hashPassword } = require('../utils/auth');
const { logAuditAction } = require('../utils/audit');

// Generate 6-character alphanumeric OTP
const generateOTP = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: I, O, 0, 1
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
};

// Generate password reset token and OTP
const generateResetToken = async (userId) => {
  try {
    // Generate random token and OTP
    const token = crypto.randomBytes(32).toString('hex');
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(); // 1 hour from now

    // Store token and OTP in database
    const result = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, otp_code, expires_at, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id, token, otp_code, expires_at`,
      [userId, token, otpCode, expiresAt]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Generate reset token error:', err);
    throw err;
  }
};

// Verify reset token
const verifyResetToken = async (token) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, otp_code, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (!result.rows.length) {
      throw new Error('Invalid token');
    }

    const tokenData = result.rows[0];

    // Check if token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Token has expired');
    }

    // Check if token has already been used
    if (tokenData.used_at) {
      throw new Error('Token has already been used');
    }

    return tokenData;
  } catch (err) {
    console.error('Verify reset token error:', err);
    throw err;
  }
};

// Verify OTP and return the token data
const verifyOTP = async (email, otpCode) => {
  try {
    // Find the latest unused OTP for this email
    const result = await pool.query(
      `SELECT prt.id, prt.user_id, prt.token, prt.otp_code, prt.expires_at, prt.used_at
       FROM password_reset_tokens prt
       INNER JOIN users u ON prt.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1) AND prt.otp_code = $2 AND prt.used_at IS NULL
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [email, otpCode.toUpperCase()]
    );

    if (!result.rows.length) {
      throw new Error('Invalid OTP code');
    }

    const tokenData = result.rows[0];

    // Check if OTP has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('OTP has expired');
    }

    return tokenData;
  } catch (err) {
    console.error('Verify OTP error:', err);
    throw err;
  }
};

// Reset password with token
const resetPasswordWithToken = async (token, newPassword) => {
  try {
    const tokenData = await verifyResetToken(token);

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, tokenData.user_id]
    );

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [tokenData.id]
    );

    // Log audit
    await logAuditAction(
      tokenData.user_id,
      'PASSWORD_RESET',
      'user',
      tokenData.user_id,
      null,
      { method: 'reset_token' }
    );

    return { success: true, message: 'Password reset successfully' };
  } catch (err) {
    console.error('Reset password error:', err);
    throw err;
  }
};

// Clean up expired tokens
const cleanupExpiredTokens = async () => {
  try {
    const result = await pool.query(
      `DELETE FROM password_reset_tokens
       WHERE expires_at < CURRENT_TIMESTAMP AND used_at IS NULL`
    );

    console.log(`Cleaned up ${result.rowCount} expired tokens`);
    return result.rowCount;
  } catch (err) {
    console.error('Cleanup expired tokens error:', err);
    throw err;
  }
};

module.exports = {
  generateOTP,
  generateResetToken,
  verifyResetToken,
  verifyOTP,
  resetPasswordWithToken,
  cleanupExpiredTokens
};

