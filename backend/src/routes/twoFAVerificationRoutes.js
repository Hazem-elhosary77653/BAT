const express = require('express');
const { verify2FACode, verify2FABackupCode, get2FAStatus, disable2FA } = require('../controllers/twoFAVerificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public endpoint - verify code during login (no auth required)
router.post('/verify-code', verify2FACode);

// Public endpoint - verify backup code during login (no auth required)
router.post('/verify-backup-code', verify2FABackupCode);

// All routes below require authentication
router.use(authMiddleware);

// Get 2FA status
router.get('/status/:userId?', get2FAStatus);

// Disable 2FA
router.post('/disable', disable2FA);

module.exports = router;
