/**
 * AI Story Routes
 */

const express = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middleware/authMiddleware');
const aiStoryController = require('../controllers/aiStoryController');

const router = express.Router();

router.use(authenticate);

// Manual/list CRUD (unified store)
router.get('/all', aiStoryController.listStories);
router.post(
  '/manual',
  body('title').isString().isLength({ min: 3, max: 200 }),
  body('description').optional().isString(),
  body('acceptanceCriteria').optional().isArray(),
  body('priority').optional().isString().isLength({ min: 1, max: 20 }),
  body('status').optional().isString().isLength({ min: 1, max: 20 }),
  body('estimated_points').optional().isInt({ min: 0, max: 1000 }),
  body('business_value').optional().isString().isLength({ max: 200 }),
  aiStoryController.createManualStory
);
router.put(
  '/:id',
  param('id').isInt({ min: 1 }),
  body('title').optional().isString().isLength({ min: 3, max: 200 }),
  body('description').optional().isString(),
  body('acceptanceCriteria').optional().isArray(),
  body('priority').optional().isString().isLength({ min: 1, max: 20 }),
  body('status').optional().isString().isLength({ min: 1, max: 20 }),
  body('estimated_points').optional().isInt({ min: 0, max: 1000 }),
  body('business_value').optional().isString().isLength({ max: 200 }),
  aiStoryController.updateStory
);
router.delete('/:id', param('id').isInt({ min: 1 }), aiStoryController.deleteStory);

router.post(
  '/generate',
  body('requirementsText').isString().isLength({ min: 30, max: 6000 }),
  body('storyCount').optional().isInt({ min: 1, max: 15 }),
  body('complexity').optional().isIn(['simple', 'standard', 'complex']),
  body('language').optional().isString().isLength({ min: 2, max: 5 }),
  body('templateId').optional().isString(),
  aiStoryController.generateStories
);

router.post(
  '/:id/refine',
  param('id').isInt({ min: 1 }),
  body('feedback').isString().isLength({ min: 10, max: 2000 }),
  aiStoryController.refineStory
);

router.post(
  '/estimate',
  body('story_ids').isArray({ min: 1 }),
  body('story_ids.*').isInt({ min: 1 }),
  aiStoryController.estimateStoryPoints
);

router.get('/templates', aiStoryController.getTemplates);

module.exports = router;
