const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const templatesController = require('../controllers/templatesController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', requirePermission('templates', 'create'), templatesController.createTemplate);
router.get('/', requirePermission('templates', 'read'), templatesController.getTemplates);
router.get('/:id', requirePermission('templates', 'read'), templatesController.getTemplateById);
router.put('/:id', requirePermission('templates', 'update'), templatesController.updateTemplate);
router.delete('/:id', requirePermission('templates', 'delete'), templatesController.deleteTemplate);

module.exports = router;
