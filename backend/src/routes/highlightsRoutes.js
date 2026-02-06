const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const highlightsController = require('../controllers/highlightsController');
const authenticate = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Get all highlights for a BRD
router.get('/brd/:brdId/highlights', highlightsController.getHighlights);

// Create a new highlight
router.post(
  '/brd/:brdId/highlights',
  [
    body('text').notEmpty().withMessage('Text is required'),
    body('color').notEmpty().withMessage('Color is required'),
    body('position_start').isNumeric().optional(),
    body('position_end').isNumeric().optional()
  ],
  highlightsController.createHighlight
);

// Delete a highlight
router.delete('/highlights/:highlightId', highlightsController.deleteHighlight);

// Get all mentions for a BRD
router.get('/brd/:brdId/mentions', highlightsController.getMentions);

// Create a mention
router.post(
  '/brd/:brdId/mentions',
  [
    body('mentioned_user_id').notEmpty().withMessage('Mentioned user ID is required'),
    body('text').notEmpty().withMessage('Text is required')
  ],
  highlightsController.createMention
);

// Mark mention as read
router.put('/mentions/:mentionId/read', highlightsController.markMentionAsRead);

module.exports = router;
