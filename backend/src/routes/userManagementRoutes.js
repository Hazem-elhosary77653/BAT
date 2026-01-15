const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userManagementController = require('../controllers/userManagementController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

// Create new user (admin only)
router.post('/', requirePermission('users', 'create'), userManagementController.createUser);

// Get all users (admin only)
router.get('/', requirePermission('users', 'read'), userManagementController.getAllUsers);

// Get all users who can be reviewers
router.get('/reviewers', userManagementController.getReviewers);

// Get permissions for a role
router.get('/permissions/:role', requirePermission('permissions', 'read'), userManagementController.getUserPermissions);

// Get user audit snapshot
router.get('/:userId/audit', requirePermission('users', 'read'), userManagementController.getUserAuditSnapshot);

// Get user by ID
router.get('/:userId', requirePermission('users', 'read'), userManagementController.getUserById);

// Update user
router.put('/:userId', requirePermission('users', 'update'), userManagementController.updateUser);

// Upload user avatar (users can update their own avatar, admins can update anyone)
router.put('/:userId/avatar', upload.single('avatar'), userManagementController.uploadAvatar);

// Delete user (soft delete)
router.delete('/:userId', requirePermission('users', 'delete'), userManagementController.deleteUser);

// Change user role (admin only)
router.patch('/:userId/role', requirePermission('users', 'manage_roles'), userManagementController.changeUserRole);

// Toggle user active status (admin only)
router.patch('/:userId/status', requirePermission('users', 'manage_status'), userManagementController.toggleUserStatus);

// Reset user password (admin only) - generate random password
router.post('/:userId/reset-password', requirePermission('users', 'reset_password'), userManagementController.resetUserPassword);

module.exports = router;
