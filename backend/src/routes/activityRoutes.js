const express = require('express');
const { getMyActivity, getMyLoginHistory, getMyActivitySummary, getAllActivities, getUserActivitiesAdmin, exportActivitiesCsv } = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get current user's activity
router.get('/my-activity', requirePermission('activity', 'read'), getMyActivity);

// Get current user's login history
router.get('/my-login-history', requirePermission('activity', 'read'), getMyLoginHistory);

// Get current user's activity summary
router.get('/my-summary', requirePermission('activity', 'read'), getMyActivitySummary);

// Get all activities (admin only)
router.get('/all', requirePermission('activity', 'read_all'), getAllActivities);

// Export activities CSV (admin only)
router.get('/export', requirePermission('activity', 'export'), exportActivitiesCsv);

// Get specific user's activities (admin only)
router.get('/user/:userId', requirePermission('activity', 'read_all'), getUserActivitiesAdmin);

module.exports = router;
