const crypto = require('crypto');
const pool = require('../db/connection');
const { hashPassword } = require('../utils/auth');
const { logAuditAction } = require('../utils/audit');
const { sendEmail } = require('../services/emailService');
const { getAllRoles } = require('../utils/permissionChecker');

// Create user (permission-based access)
const createUser = async (req, res) => {
  try {
    // Permission already checked by middleware (users:create required)

    const { email, username, mobile, firstName, lastName, password, role = 'analyst' } = req.body;

    // Validate required fields
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    // Validate role against known roles (includes custom roles)
    const validRoles = getAllRoles();
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1 OR username = $2 OR mobile = $3`,
      [email, username, mobile || null]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, username, mobile, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, username, mobile, first_name, last_name, role, is_active, created_at`,
      [email, username, mobile || null, passwordHash, firstName || '', lastName || '', role, 1]
    );

    const newUser = result.rows[0];

    await logAuditAction(
      req.user.id,
      'USER_CREATED',
      'user',
      newUser.id,
      null,
      { email, username, role, created_by_admin: true }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Get all users (permission-based access)
const getAllUsers = async (req, res) => {
  try {
    // Permission already checked by middleware (users:read required)
    // Remove hardcoded admin-only check since permission middleware handles this

    const includeInactive = req.query.includeInactive === 'true';

    const users = await pool.query(
      `SELECT id, email, username, mobile, first_name, last_name, role, is_active, created_at, updated_at
       FROM users
       ${includeInactive ? '' : 'WHERE is_active = 1'}
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: users.rows,
      total: users.rows.length
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get all reviewers (users who can review BRDs)
const getReviewers = async (req, res) => {
  try {
    // For now, any active user can be a reviewer
    // In a mature app, we might check for specific roles like 'manager' or 'senior_analyst'
    const users = await pool.query(
      `SELECT id, first_name, last_name, email, role
       FROM users
       WHERE is_active = 1
       ORDER BY first_name ASC`
    );

    res.json({
      success: true,
      data: users.rows
    });
  } catch (err) {
    console.error('Get reviewers error:', err);
    res.status(500).json({ error: 'Failed to fetch reviewers' });
  }
};

// Get user by ID (admin or self)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await pool.query(
      `SELECT id, email, username, mobile, first_name, last_name, role, is_active, bio, location, avatar, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user.rows[0];

    res.json({
      success: true,
      data: {
        ...userData,
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
        phone: userData.mobile // Frontend expects 'phone'
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user (admin only, except for self profile)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, name, email, username, mobile, phone, bio, location, role, isActive } = req.body;

    // Handle combined name if provided
    let finalFirstName = firstName;
    let finalLastName = lastName;

    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length > 0) {
        finalFirstName = parts[0];
        finalLastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
      }
    }

    // Handle phone/mobile mapping
    const finalMobile = mobile || phone;

    // Permission checks
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.id === parseInt(userId);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Only admin can change role and active status
    if ((role || isActive !== undefined) && !isAdmin) {
      return res.status(403).json({ error: 'Only admins can change role and active status' });
    }

    // Build update query
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (finalFirstName !== undefined) {
      updateFields.push(`first_name = $${paramCount}`);
      values.push(finalFirstName);
      paramCount++;
    }
    if (finalLastName !== undefined) {
      updateFields.push(`last_name = $${paramCount}`);
      values.push(finalLastName);
      paramCount++;
    }
    if (email !== undefined && isAdmin) {
      // Ensure email is not used by another user
      const emailCheck = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND id <> $2`,
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updateFields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (username !== undefined && isAdmin) {
      const usernameCheck = await pool.query(
        `SELECT id FROM users WHERE username = $1 AND id <> $2`,
        [username, userId]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username already in use' });
      }
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }
    if (finalMobile !== undefined && (isAdmin || isSelf)) {
      if (isAdmin) {
        const mobileCheck = await pool.query(
          `SELECT id FROM users WHERE mobile = $1 AND id <> $2`,
          [finalMobile, userId]
        );
        if (mobileCheck.rows.length > 0) {
          return res.status(400).json({ error: 'Mobile already in use' });
        }
      }
      updateFields.push(`mobile = $${paramCount}`);
      values.push(finalMobile);
      paramCount++;
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }
    if (location !== undefined) {
      updateFields.push(`location = $${paramCount}`);
      values.push(location);
      paramCount++;
    }
    if (role !== undefined && isAdmin) {
      updateFields.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    if (isActive !== undefined && isAdmin) {
      const activeValue = isActive === true ? 1 : isActive === false ? 0 : isActive;
      updateFields.push(`is_active = $${paramCount}`);
      values.push(activeValue);
      paramCount++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, username, mobile, first_name, last_name, bio, location, avatar, role, is_active`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAuditAction(req.user.id, 'USER_UPDATED', 'user', userId, null, { updated_by_admin: isAdmin });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        ...result.rows[0],
        name: `${result.rows[0].first_name} ${result.rows[0].last_name}`.trim(),
        phone: result.rows[0].mobile // Map mobile back to phone for frontend consistency
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Permission already checked by middleware (users:delete required)

    // Prevent deleting yourself
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Soft delete by marking inactive
    const result = await pool.query(
      `UPDATE users
       SET is_active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, username`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAuditAction(req.user.id, 'USER_DELETED', 'user', userId, null, { soft_delete: true });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Change user role (permission-based access)
const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Permission already checked by middleware (users:manage_roles required)

    const validRoles = getAllRoles();
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Prevent removing your own admin status
    if (req.user.id === parseInt(userId) && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin status' });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, username, role`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAuditAction(req.user.id, 'USER_ROLE_CHANGED', 'user', userId, null, { new_role: role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Change role error:', err);
    res.status(500).json({ error: 'Failed to change user role' });
  }
};

// Toggle user active status (permission-based access)
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Permission already checked by middleware (users:manage_status required)

    // Prevent deactivating yourself
    if (req.user.id === parseInt(userId) && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, username, mobile, is_active`,
      [isActive, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAuditAction(req.user.id, 'USER_STATUS_TOGGLED', 'user', userId, null, { is_active: isActive });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Toggle status error:', err);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};

// Get user role permissions
const getUserPermissions = async (req, res) => {
  try {
    const { role } = req.params;

    const permissions = {
      admin: [
        'view_users',
        'create_user',
        'edit_user',
        'delete_user',
        'change_user_role',
        'view_analytics',
        'view_audit_logs',
        'manage_settings',
        'create_user_stories',
        'edit_user_stories',
        'delete_user_stories',
        'create_brds',
        'edit_brds',
        'delete_brds',
        'create_documents',
        'edit_documents',
        'delete_documents',
        'create_templates',
        'edit_templates',
        'delete_templates',
        'export_reports'
      ],
      analyst: [
        'view_users',
        'create_user_stories',
        'edit_user_stories',
        'delete_user_stories',
        'create_brds',
        'edit_brds',
        'delete_brds',
        'create_documents',
        'edit_documents',
        'delete_documents',
        'create_templates',
        'edit_templates',
        'export_reports'
      ],
      viewer: [
        'view_users',
        'view_user_stories',
        'view_brds',
        'view_documents',
        'view_templates',
        'view_reports'
      ]
    };

    res.json({
      success: true,
      data: {
        role,
        permissions: permissions[role] || []
      }
    });
  } catch (err) {
    console.error('Get permissions error:', err);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

// Generate random password (permission-based access)
const resetUserPassword = async (req, res) => {
  try {
    // Permission already checked by middleware (users:reset_password required)

    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user exists
    const userResult = await pool.query(
      `SELECT id, email, username FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate random password (12 characters)
    const randomPassword = crypto.randomBytes(9).toString('base64url');
    const passwordHash = await hashPassword(randomPassword);

    // Update user password
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [passwordHash, userId]
    );

    // Log audit action
    await logAuditAction(req.user.id, 'USER_PASSWORD_RESET', 'user', userId, null, { user_email: user.email });

    // Attempt to notify user via email if configured
    if (user.email) {
      try {
        const loginUrl = `${process.env.APP_URL || 'http://localhost:3000'}/login`;
        await sendEmail(
          user.email,
          'Your password has been reset',
          `<p>Hello ${user.username || user.email},</p>
           <p>An administrator reset your password. Use the temporary password below to sign in, then change it immediately:</p>
           <p style="font-size:16px;font-weight:bold;">${randomPassword}</p>
           <p>Login: <a href="${loginUrl}">${loginUrl}</a></p>
           <p>If you did not request this, contact support.</p>`,
          `Hello ${user.username || user.email},
An administrator reset your password.
Temporary password: ${randomPassword}
Login: ${loginUrl}
If you did not request this, contact support.`
        );
      } catch (emailErr) {
        console.warn('Password reset email failed to send:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        userId,
        userEmail: user.email,
        newPassword: randomPassword,
        note: 'Share this password with the user and ask them to change it on first login'
      }
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Get audit highlights for a user (permission-based access)
const getUserAuditSnapshot = async (req, res) => {
  try {
    // Permission already checked by middleware (users:read required)

    const { userId } = req.params;

    // Use audit_logs (we consistently write here)
    const lastLoginResult = await pool.query(
      `SELECT created_at FROM audit_logs
       WHERE user_id = $1 AND action IN ('USER_LOGIN', 'LOGIN_SUCCESS', 'LOGIN')
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const lastResetResult = await pool.query(
      `SELECT created_at FROM audit_logs
         WHERE (user_id = $1 OR entity_id = $1)
           AND action IN ('PASSWORD_RESET', 'USER_PASSWORD_RESET')
         ORDER BY created_at DESC
         LIMIT 1`,
      [userId]
    );

    const activeSessionsResult = await pool.query(
      `SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1 AND is_active = 1`,
      [userId]
    );

    const recentActionsResult = await pool.query(
      `SELECT action, entity_type, entity_id, created_at
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        lastLogin: lastLoginResult.rows[0]?.created_at || null,
        lastPasswordReset: lastResetResult.rows[0]?.created_at || null,
        activeSessions: parseInt(activeSessionsResult.rows[0]?.count || 0),
        recentActions: recentActionsResult.rows || []
      }
    });
  } catch (err) {
    console.error('Get audit snapshot error:', err);
    res.status(500).json({ error: 'Failed to fetch audit snapshot' });
  }
};

// Upload user avatar
const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is updating their own avatar or has permission
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own avatar' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create avatar URL (relative path)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user avatar in database
    await pool.query(
      `UPDATE users SET avatar = $1 WHERE id = $2`,
      [avatarUrl, userId]
    );

    await logAuditAction(
      req.user.id,
      'AVATAR_UPDATED',
      'user',
      userId,
      null,
      { filename: req.file.filename }
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatar: avatarUrl }
    });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getReviewers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  toggleUserStatus,
  getUserPermissions,
  resetUserPassword,
  getUserAuditSnapshot,
  uploadAvatar
};
