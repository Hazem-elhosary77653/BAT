const pool = require('../db/connection');
const { generateResetToken, resetPasswordWithToken, verifyResetToken, cleanupExpiredTokens } = require('../services/passwordResetService');
const { logUserActivity } = require('../services/activityService');
const { logAuditAction } = require('../utils/audit');

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const result = await pool.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );

    if (!result.rows.length) {
      // Don't reveal if email exists for security reasons
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const token = await generateResetToken(user.id);

    // Log activity
    await logUserActivity(
      user.id,
      'PASSWORD_RESET_REQUESTED',
      'User requested password reset',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    // In a real application, send email with token
    // For now, return the token (in production, use nodemailer to send email)
    console.log(`Password reset token for ${email}: ${token.token}`);

    res.json({
      success: true,
      message: 'Password reset email sent',
      // For development only - in production, token should be sent via email
      token: process.env.NODE_ENV === 'development' ? token.token : undefined
    });
  } catch (err) {
    console.error('Request password reset error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// Verify reset token
const verifyToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const tokenData = await verifyResetToken(token);

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: tokenData.user_id,
        expiresAt: tokenData.expires_at
      }
    });
  } catch (err) {
    console.error('Verify token error:', err);

    if (err.message.includes('Invalid token') || err.message.includes('expired') || err.message.includes('already')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to verify token' });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Verify token first
    const tokenData = await verifyResetToken(token);

    // Reset password
    const result = await resetPasswordWithToken(token, newPassword);

    // Log audit
    await logAuditAction(
      tokenData.user_id,
      'PASSWORD_RESET_COMPLETED',
      'user',
      tokenData.user_id,
      null,
      { method: 'reset_token' }
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('Reset password error:', err);

    if (err.message.includes('Invalid') || err.message.includes('expired') || err.message.includes('already')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Cleanup expired tokens (can be called via cron job)
const cleanupTokens = async (req, res) => {
  try {
    // Check if request is from admin or internal
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can perform cleanup' });
    }

    const cleaned = await cleanupExpiredTokens();

    res.json({
      success: true,
      message: `Cleaned up ${cleaned} expired tokens`
    });
  } catch (err) {
    console.error('Cleanup tokens error:', err);
    res.status(500).json({ error: 'Failed to cleanup tokens' });
  }
};

module.exports = {
  requestPasswordReset,
  verifyToken,
  resetPassword,
  cleanupTokens
};
