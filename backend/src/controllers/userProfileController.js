const { updateUserProfile, getUserProfile, changePassword } = require('../services/userProfileService');
const { logUserActivity } = require('../services/activityService');

// Get current user profile
const getMyProfile = async (req, res) => {
  try {
    const user = await getUserProfile(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update current user profile
const updateMyProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile } = req.body;

    if (!firstName && !lastName && !email && !mobile) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updatedUser = await updateUserProfile(req.user.id, {
      firstName,
      lastName,
      email,
      mobile
    });

    // Log activity
    await logUserActivity(
      req.user.id,
      'PROFILE_UPDATE',
      'User updated their profile',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);

    if (err.message.includes('Email already') || err.message.includes('Mobile already')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const result = await changePassword(req.user.id, oldPassword, newPassword);

    // Log activity
    await logUserActivity(
      req.user.id,
      'PASSWORD_CHANGE',
      'User changed their password',
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('Change password error:', err);

    if (err.message === 'Current password is incorrect') {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  updatePassword
};
