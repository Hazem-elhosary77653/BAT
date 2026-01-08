/**
 * BRD Generation Routes
 * All routes require authentication
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const brdController = require('../controllers/brdController');

// Middleware to check authentication
router.use(authMiddleware);

/**
 * GET /api/brd
 * List all BRDs for current user
 */
router.get(
  '/',
  query('skip').optional().isInt({ min: 0 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  brdController.listBRDs
);

/**
 * GET /api/brd/:id
 * Get specific BRD by ID
 */
router.get(
  '/:id',
  param('id').isUUID(),
  brdController.getBRD
);

/**
 * POST /api/brd/generate
 * Generate BRD from user stories using AI
 */
router.post(
  '/generate',
  body('story_ids')
    .isArray({ min: 1 })
    .withMessage('At least one story ID is required'),
  body('story_ids.*').isInt({ min: 1 }).withMessage('Invalid story ID format'),
  body('title').optional().isString().trim(),
  body('template')
    .optional()
    .isIn(['full', 'executive', 'technical', 'user-focused'])
    .withMessage('Invalid template type'),
  body('options.language').optional().isString(),
  body('options.detailLevel')
    .optional()
    .isIn(['summary', 'standard', 'detailed', 'comprehensive'])
    .withMessage('Invalid detail level'),
  brdController.generateBRD
);

/**
 * PUT /api/brd/:id
 * Update BRD content
 */
router.put(
  '/:id',
  param('id').isUUID(),
  body('content').optional().isString(),
  body('title').optional().isString().trim(),
  brdController.updateBRD
);

/**
 * DELETE /api/brd/:id
 * Delete BRD
 */
router.delete(
  '/:id',
  param('id').isUUID(),
  brdController.deleteBRD
);

/**
 * GET /api/brd/:id/versions
 * Get version history for BRD
 */
router.get(
  '/:id/versions',
  param('id').isUUID(),
  brdController.getVersionHistory
);

/**
 * POST /api/brd/:id/export-pdf
 * Export BRD to PDF
 */
router.post(
  '/:id/export-pdf',
  param('id').isUUID(),
  brdController.exportPDF
);

/**
 * GET /api/brd/:id/export-text
 * Export BRD to plain text
 */
router.get(
  '/:id/export-text',
  param('id').isUUID(),
  brdController.exportText
);

/**
 * GET /api/brd/:id/analyze
 * Analyze BRD content using AI
 */
router.get(
  '/:id/analyze',
  param('id').isString(),
  brdController.analyzeBRD
);

/**
 * POST /api/brd/:id/convert-to-stories
 * Extract user stories from BRD using AI
 */
router.post(
  '/:id/convert-to-stories',
  param('id').isString(),
  brdController.convertToStories
);

/**
 * GET /api/brd/:id/versions/:versionNumber
 * Get specific version content
 */
router.get(
  '/:id/versions/:versionNumber',
  [
    param('id').isString(),
    param('versionNumber').isInt()
  ],
  brdController.getVersionContent
);

module.exports = router;
