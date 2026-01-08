const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const diagramsController = require('../controllers/diagramsController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', requirePermission('diagrams', 'create'), diagramsController.createDiagram);
router.get('/', requirePermission('diagrams', 'read'), diagramsController.getDiagrams);
router.get('/:id', requirePermission('diagrams', 'read'), diagramsController.getDiagramById);
router.put('/:id', requirePermission('diagrams', 'update'), diagramsController.updateDiagram);
router.delete('/:id', requirePermission('diagrams', 'delete'), diagramsController.deleteDiagram);

module.exports = router;
