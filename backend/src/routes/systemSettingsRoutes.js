const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const systemSettingsController = require('../controllers/systemSettingsController');

// Publicly available settings (no auth required)
router.get('/public', systemSettingsController.getPublicSettings);

// All routes below require admin permission
router.get('/', authMiddleware, requirePermission('settings', 'read'), systemSettingsController.getSystemSettings);
router.put('/', authMiddleware, requirePermission('settings', 'update'), systemSettingsController.updateSystemSettings);
router.post('/reset', authMiddleware, requirePermission('settings', 'update'), systemSettingsController.resetSystemSettings);

module.exports = router;
