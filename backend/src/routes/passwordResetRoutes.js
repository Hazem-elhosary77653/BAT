const express = require('express');
const { requestPasswordReset, verifyToken, resetPassword, cleanupTokens } = require('../controllers/passwordResetController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (no authentication needed)
router.post('/request', requestPasswordReset);
router.get('/verify/:token', verifyToken);
router.post('/reset', resetPassword);

// Admin routes (authentication needed)
router.post('/cleanup', authMiddleware, cleanupTokens);

module.exports = router;
