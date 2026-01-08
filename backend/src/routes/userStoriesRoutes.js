const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const userStoriesController = require('../controllers/userStoriesController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', requirePermission('user_stories', 'create'), userStoriesController.createUserStory);
router.get('/', requirePermission('user_stories', 'read'), userStoriesController.getUserStories);
router.get('/:id', requirePermission('user_stories', 'read'), userStoriesController.getUserStoryById);
router.put('/:id', requirePermission('user_stories', 'update'), userStoriesController.updateUserStory);
router.delete('/:id', requirePermission('user_stories', 'delete'), userStoriesController.deleteUserStory);

module.exports = router;
