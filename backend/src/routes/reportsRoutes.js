const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const reportsController = require('../controllers/reportsController');

const router = express.Router();

router.use(authMiddleware);

router.post('/generate', requirePermission('reports', 'create'), reportsController.generateReport);
router.get('/', requirePermission('reports', 'read'), reportsController.getReports);
router.get('/:id', requirePermission('reports', 'read'), reportsController.getReportById);
router.get('/:id/export', requirePermission('reports', 'export'), reportsController.exportReport);

module.exports = router;
