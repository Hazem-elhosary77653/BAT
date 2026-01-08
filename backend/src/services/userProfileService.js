const pool = require('../db/connection');
const { hashPassword, comparePassword } = require('../utils/auth');
const { logAuditAction } = require('../utils/audit');

// Get user profile by ID
const getUserProfile = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, mobile, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Get user profile error:', err);
    throw err;
  }
};

// Update user profile (name, email)
const updateUserProfile = async (userId, updateData, adminId = null) => {
  try {
    const { firstName, lastName, email, mobile } = updateData;
    const currentUser = await getUserProfile(userId);

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Check if email is already in use by another user
    if (email && email !== currentUser.email) {
      const existingEmail = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND id != $2`,
        [email, userId]
      );
      if (existingEmail.rows.length > 0) {
        throw new Error('Email already in use');
      }
    }

    // Check if mobile is already in use by another user
    if (mobile && mobile !== currentUser.mobile) {
      const existingMobile = await pool.query(
        `SELECT id FROM users WHERE mobile = $1 AND id != $2`,
        [mobile, userId]
      );
      if (existingMobile.rows.length > 0) {
        throw new Error('Mobile number already in use');
      }
    }

    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, email = $3, mobile = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, username, first_name, last_name, mobile, role, is_active, updated_at`,
      [firstName || currentUser.first_name, lastName || currentUser.last_name, email || currentUser.email, mobile || currentUser.mobile, userId]
    );

    const updatedUser = result.rows[0];

    // Log audit
    await logAuditAction(
      adminId || userId,
      'PROFILE_UPDATED',
      'user',
      userId,
      null,
      { updated_fields: Object.keys(updateData), by_admin: !!adminId }
    );

    return updatedUser;
  } catch (err) {
    console.error('Update user profile error:', err);
    throw err;
  }
};

// Change password
const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (!user.rows.length) {
      throw new Error('User not found');
    }

    // Verify old password
    const passwordMatch = await comparePassword(oldPassword, user.rows[0].password_hash);
    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [newPasswordHash, userId]
    );

    // Log audit
    await logAuditAction(
      userId,
      'PASSWORD_CHANGED',
      'user',
      userId,
      null,
      {}
    );

    return { success: true, message: 'Password changed successfully' };
  } catch (err) {
    console.error('Change password error:', err);
    throw err;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword
};
