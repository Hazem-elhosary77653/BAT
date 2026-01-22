const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/stats', authMiddleware, requirePermission('dashboard', 'read'), dashboardController.getDashboardStats);
router.get('/analytics', authMiddleware, requirePermission('dashboard', 'read'), dashboardController.getBusinessAnalytics);

module.exports = router;
