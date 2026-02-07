const express = require('express');
const router = express.Router();
const slackController = require('../controllers/slackController');

/**
 * Slack Integration Routes
 */

// Slash commands endpoint
router.post('/commands', 
  slackController.verifySlackRequest,
  slackController.handleSlashCommand
);

// Interactive components endpoint (buttons, menus, etc.)
router.post('/interactions',
  slackController.verifySlackRequest,
  slackController.handleInteraction
);

// Events API endpoint
router.post('/events',
  slackController.verifySlackRequest,
  slackController.handleEvent
);

// Test notification endpoint
router.post('/test', slackController.sendTestNotification);

// Status endpoint
router.get('/status', slackController.getStatus);

module.exports = router;
