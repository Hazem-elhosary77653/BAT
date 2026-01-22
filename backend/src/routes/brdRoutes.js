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
  body('story_ids.*')
    .custom((value) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num > 0;
    })
    .withMessage('Invalid story ID format'),
  body('title').optional().isString().trim(),
  body('template')
    .optional()
    .isString()
    .withMessage('Invalid template type'),
  body('tone').optional().isString(),
  body('target_audience').optional().isString(),
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
 * POST /api/brd/:id/export-docx
 * Export BRD to DOCX
 */
router.post(
  '/:id/export-docx',
  param('id').isUUID(),
  brdController.exportDOCX
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
 * POST /api/brd/:id/export-excel
 * Export BRD to Excel
 */
router.post(
  '/:id/export-excel',
  param('id').isUUID(),
  brdController.exportExcel
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
 * GET /api/brd/:id/estimate
 * Estimate project effort using AI
 */
router.get(
  '/:id/estimate',
  authMiddleware,
  param('id').isString(),
  brdController.estimateBRD
);

/**
 * POST /api/brd/:id/convert-to-stories
 * Extract user stories from BRD using AI
 */
router.post(
  '/:id/convert-to-stories',
  param('id').isUUID(),
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

/**
 * WORKFLOW ROUTES
 */

/**
 * POST /api/brd/:id/request-review
 * Request review for BRD (draft → in-review)
 */
router.post(
  '/:id/request-review',
  param('id').isUUID(),
  body('assigned_to').isInt().withMessage('Reviewer ID must be an integer'),
  body('reason').optional().isString(),
  brdController.requestReview
);

/**
 * POST /api/brd/:id/approve
 * Approve BRD (in-review → approved)
 */
router.post(
  '/:id/approve',
  param('id').isUUID(),
  body('reason').optional().isString(),
  brdController.approveBRD
);

/**
 * POST /api/brd/:id/reject
 * Reject BRD for revisions (in-review → draft)
 */
router.post(
  '/:id/reject',
  param('id').isUUID(),
  body('reason').optional().isString(),
  brdController.rejectBRD
);

/**
 * GET /api/brd/:id/workflow-history
 * Get workflow history
 */
router.get(
  '/:id/workflow-history',
  param('id').isUUID(),
  brdController.getWorkflowHistory
);

/**
 * GET /api/brd/:id/review-assignments
 * Get review assignments
 */
router.get(
  '/:id/review-assignments',
  param('id').isUUID(),
  brdController.getReviewAssignments
);

/**
 * POST /api/brd/:id/collaborators
 * Add collaborator to BRD
 */
router.post(
  '/:id/collaborators',
  param('id').isUUID(),
  body('user_id').isInt().withMessage('User ID must be an integer'),
  body('permission_level').optional().isIn(['view', 'comment', 'edit']),
  brdController.addCollaborator
);

/**
 * DELETE /api/brd/:id/collaborators/:collaboratorId
 * Remove collaborator from BRD
 */
router.delete(
  '/:id/collaborators/:collaboratorId',
  param('id').isUUID(),
  param('collaboratorId').isInt(),
  brdController.removeCollaborator
);

/**
 * GET /api/brd/:id/collaborators
 * Get collaborators for BRD
 */
router.get(
  '/:id/collaborators',
  param('id').isUUID(),
  brdController.getCollaborators
);

/**
 * GET /api/brd/:id/activity-log
 * Get activity log for BRD
 */
router.get(
  '/:id/activity-log',
  param('id').isUUID(),
  brdController.getActivityLog
);

/**
 * GET /api/brd/:id/comments
 * Get comments for BRD
 */
router.get(
  '/:id/comments',
  param('id').isUUID(),
  brdController.getComments
);

/**
 * POST /api/brd/:id/comments
 * Add comment to BRD
 */
router.post(
  '/:id/comments',
  param('id').isUUID(),
  body('section_id').notEmpty().withMessage('Section ID is required'),
  body('comment_text').trim().notEmpty().withMessage('Comment text is required'),
  brdController.addComment
);

/**
 * PUT /api/brd/:id/comments/:commentId
 * Update comment
 */
router.put(
  '/:id/comments/:commentId',
  param('id').isUUID(),
  param('commentId').isInt(),
  body('comment_text').optional().trim(),
  body('is_resolved').optional().isBoolean(),
  brdController.updateComment
);

/**
 * DELETE /api/brd/:id/comments/:commentId
 * Delete comment
 */
router.delete(
  '/:id/comments/:commentId',
  param('id').isUUID(),
  param('commentId').isInt(),
  brdController.deleteComment
);

module.exports = router;
