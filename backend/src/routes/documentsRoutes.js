const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const documentsController = require('../controllers/documentsController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);

router.post('/', requirePermission('documents', 'create'), upload.single('file'), documentsController.createDocument);
router.get('/', requirePermission('documents', 'read'), documentsController.getDocuments);
router.get('/:id', requirePermission('documents', 'read'), documentsController.getDocumentById);
router.put('/:id', requirePermission('documents', 'update'), documentsController.updateDocument);
router.delete('/:id', requirePermission('documents', 'delete'), documentsController.deleteDocument);

module.exports = router;
