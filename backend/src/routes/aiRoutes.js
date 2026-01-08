const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.use(authMiddleware);

router.post('/configure', requirePermission('ai', 'configure'), aiController.configureAI);
router.get('/config', requirePermission('ai', 'read'), aiController.getAIConfig);

module.exports = router;
