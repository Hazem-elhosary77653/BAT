const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const settingsController = require('../controllers/settingsController');
const userSettingsController = require('../controllers/userSettingsController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User settings routes (for both /api/settings and /api/user-settings)
router.get('/', userSettingsController.getUserSettings);
router.put('/', userSettingsController.updateUserSettings);
router.post('/reset', userSettingsController.resetUserSettings);

// Admin settings routes
router.get('/users', requirePermission('users', 'read'), settingsController.getAllUsers);
router.put('/users/role', requirePermission('settings', 'manage_roles'), settingsController.updateUserRole);
router.put('/users/deactivate', requirePermission('users', 'manage_status'), settingsController.deactivateUser);
router.get('/audit-logs', requirePermission('settings', 'manage_audit_logs'), settingsController.getAuditLogs);
router.get('/system', requirePermission('settings', 'read'), settingsController.getSystemSettings);

module.exports = router;
