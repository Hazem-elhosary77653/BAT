const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const templateController = require('../controllers/templateController');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/templates
 */
router.get(
    '/',
    query('category').optional().isString(),
    templateController.listTemplates
);

/**
 * GET /api/templates/:id
 */
router.get(
    '/:id',
    templateController.getTemplate
);

/**
 * POST /api/templates
 */
router.post(
    '/',
    [
        body('name').isString().trim().notEmpty().withMessage('Name is required'),
        body('content').isString().notEmpty().withMessage('Content is required'),
        body('category').optional().isIn(['brd', 'story', 'document', 'email']),
        body('variables').optional().isArray()
    ],
    templateController.createTemplate
);

/**
 * PUT /api/templates/:id
 */
router.put(
    '/:id',
    [
        body('name').optional().isString().trim(),
        body('content').optional().isString(),
        body('category').optional().isIn(['brd', 'story', 'document', 'email']),
        body('variables').optional().isArray()
    ],
    templateController.updateTemplate
);

/**
 * DELETE /api/templates/:id
 */
router.delete(
    '/:id',
    templateController.deleteTemplate
);

module.exports = router;
