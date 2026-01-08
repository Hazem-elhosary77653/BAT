const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Chat with AI
router.post('/chat', requirePermission('ai', 'generate'), chatController.chat);

// Generate user story
router.post('/generate-user-story', requirePermission('ai', 'generate'), chatController.generateUserStory);

// Generate BRD
router.post('/generate-brd', requirePermission('ai', 'generate'), chatController.generateBRD);

module.exports = router;
