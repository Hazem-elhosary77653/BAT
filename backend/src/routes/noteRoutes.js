const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', noteController.listNotes);
router.get('/tags', noteController.getAllTags);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);
router.post('/ai', noteController.aiRefineNote);

// New feature endpoints
router.patch('/:id/pin', noteController.togglePin);
router.patch('/:id/favorite', noteController.toggleFavorite);
router.patch('/:id/archive', noteController.toggleArchive);
router.patch('/:id/todos', noteController.updateTodoItems);

module.exports = router;
