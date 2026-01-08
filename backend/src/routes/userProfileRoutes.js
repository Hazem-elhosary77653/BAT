const express = require('express');
const { getMyProfile, updateMyProfile, updatePassword } = require('../controllers/userProfileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get current user profile
router.get('/me', getMyProfile);

// Update current user profile
router.put('/me', updateMyProfile);

// Change password
router.post('/change-password', updatePassword);

module.exports = router;
