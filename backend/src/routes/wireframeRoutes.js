const express = require('express');
const router = express.Router();
const wireframeController = require('../controllers/wireframeController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Wireframe CRUD
router.get('/', wireframeController.listWireframes);
router.post('/', wireframeController.createWireframe);
router.get('/:id', wireframeController.getWireframe);
router.put('/:id', wireframeController.updateWireframe);
router.delete('/:id', wireframeController.deleteWireframe);

// AI Generation
router.post('/generate', wireframeController.generateWireframe);

// Story Linking
router.post('/:id/stories/:story_id', wireframeController.linkStory);
router.delete('/:id/stories/:story_id', wireframeController.unlinkStory);

module.exports = router;
