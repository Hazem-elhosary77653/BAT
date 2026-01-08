const express = require('express');
const { checkUserPermission, getMyPermissions, getAllRolePermissions, getAccessible, listPermissions, addPermission, removePermission } = require('../controllers/permissionsController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Check if user has permission
router.get('/check', checkUserPermission);

// Get user's permissions
router.get('/my-permissions', getMyPermissions);

// Get accessible resources
router.get('/accessible', getAccessible);

// Get all role permissions (admin only)
router.get('/all', getAllRolePermissions);

// List current permissions (DB)
router.get('/', requirePermission('permissions', 'read'), listPermissions);

// Add or remove permissions (admin manage roles)
router.post('/', requirePermission('settings', 'manage_roles'), addPermission);
router.delete('/', requirePermission('settings', 'manage_roles'), removePermission);

module.exports = router;
