/**
 * AI Configuration Routes
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const aiConfigController = require('../controllers/aiConfigController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/ai-config
 * Get current AI configuration
 */
router.get('/', aiConfigController.getConfiguration);

/**
 * PUT /api/ai-config
 * Update AI configuration
 */
router.put(
  '/',
  [
    body('model').optional().isIn(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k']),
    body('temperature').optional().isFloat({ min: 0, max: 2 }),
    body('max_tokens').optional().isInt({ min: 100 }),
    body('language').optional().isIn(['en', 'es', 'fr', 'de', 'ar', 'zh']),
    body('detail_level').optional().isIn(['brief', 'standard', 'detailed']),
    body('api_key').optional().isString().trim(),
  ],
  aiConfigController.updateConfiguration
);

/**
 * POST /api/ai-config/test
 * Test OpenAI connection with provided API key (or use saved key if not provided)
 */
router.post(
  '/test',
  body('api_key').optional().isString().trim(),
  aiConfigController.testConnection
);

/**
 * GET /api/ai-config/models
 * Get list of available OpenAI models
 */
router.get('/models', aiConfigController.getAvailableModels);

/**
 * POST /api/ai-config/reset
 * Reset configuration to defaults
 */
router.post('/reset', aiConfigController.resetConfiguration);

module.exports = router;
