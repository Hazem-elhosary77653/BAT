const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

// Register route
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').optional().trim(),
    body('lastName').optional().trim()
  ],
  authController.register
);

// Login route
router.post(
  '/login',
  [
    body('credential').notEmpty(),
    body('password').notEmpty()
  ],
  authController.login
);

// Get current user
router.get('/me', authMiddleware, authController.getCurrentUser);

// Refresh token for active session
router.post('/refresh', authMiddleware, authController.refreshToken);

// Logout current session
router.post('/logout', authMiddleware, authController.logout);

// Logout all sessions for current user
router.post('/logout-all', authMiddleware, authController.logoutAll);

module.exports = router;
