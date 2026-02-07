const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');

/**
 * Microsoft Teams Integration Routes
 */

// Incoming webhook endpoint
router.post('/webhook',
  teamsController.verifyTeamsRequest,
  teamsController.handleWebhook
);

// Bot messages endpoint
router.post('/messages',
  teamsController.verifyTeamsRequest,
  teamsController.handleBotMessage
);

// Card actions endpoint
router.post('/actions',
  teamsController.verifyTeamsRequest,
  teamsController.handleCardAction
);

// Search endpoint
router.post('/search',
  teamsController.verifyTeamsRequest,
  teamsController.handleSearch
);

// Test notification endpoint
router.post('/test', teamsController.sendTestNotification);

// Status endpoint
router.get('/status', teamsController.getStatus);

// Tab configuration endpoint
router.get('/tab/config', teamsController.getTabConfig);

// Compose extension query endpoint
router.post('/compose-extension/query',
  teamsController.verifyTeamsRequest,
  teamsController.handleComposeExtensionQuery
);

module.exports = router;
