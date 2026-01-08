const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getUserSettings,
  updateUserSettings,
  resetUserSettings
} = require('../controllers/userSettingsController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get current user's settings
router.get('/', getUserSettings);

// Update current user's settings
router.put('/', updateUserSettings);

// Reset settings to default
router.post('/reset', resetUserSettings);

module.exports = router;
