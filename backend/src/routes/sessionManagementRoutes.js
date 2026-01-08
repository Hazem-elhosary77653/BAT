const express = require('express');
const router = express.Router();
const sessionManagementController = require('../controllers/sessionManagementController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all user sessions
router.get('/', requirePermission('sessions', 'read'), sessionManagementController.getUserSessionList);

// Get only active sessions
router.get('/active', requirePermission('sessions', 'read'), sessionManagementController.getActiveUserSessions);

// Terminate specific session
router.post('/:sessionId/terminate', requirePermission('sessions', 'terminate'), sessionManagementController.terminateSession);

// Terminate all sessions (logout from all devices)
router.post('/terminate-all', requirePermission('sessions', 'terminate'), sessionManagementController.terminateAllSessions);

module.exports = router;
