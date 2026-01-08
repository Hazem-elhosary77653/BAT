const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const azureDevOpsController = require('../controllers/azureDevOpsController');

const router = express.Router();

router.use(authMiddleware);

router.post('/configure', requirePermission('azure_devops', 'configure'), azureDevOpsController.configureAzureDevOps);
router.get('/config', requirePermission('azure_devops', 'read'), azureDevOpsController.getAzureDevOpsConfig);
router.post('/sync', requirePermission('azure_devops', 'sync'), azureDevOpsController.syncWithAzureDevOps);

module.exports = router;
