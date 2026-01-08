const express = require('express');
const { generateSetup, enableTFA, verifyCode, verifyCode2FA, disableTFA, getStatus } = require('../controllers/twoFAController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes (require authentication)
router.use(authMiddleware);

// Get setup information for 2FA
router.get('/setup', generateSetup);

// Enable 2FA
router.post('/enable', enableTFA);

// Verify 2FA code
router.post('/verify', verifyCode);

// Verify backup code
router.post('/verify-backup', verifyCode2FA);

// Disable 2FA
router.post('/disable', disableTFA);

// Get 2FA status
router.get('/status', getStatus);

module.exports = router;
