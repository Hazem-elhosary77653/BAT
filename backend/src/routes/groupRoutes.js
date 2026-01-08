const express = require('express');
const { createUserGroup, getGroups, getGroup, updateUserGroup, deleteUserGroup, addGroupMember, removeGroupMember, getMembers, getMyGroups } = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's groups
router.get('/my-groups', requirePermission('groups', 'read'), getMyGroups);

// CRUD operations (admin only)
router.post('/', requirePermission('groups', 'create'), createUserGroup);
router.get('/', requirePermission('groups', 'read'), getGroups);
router.get('/:groupId', requirePermission('groups', 'read'), getGroup);
router.put('/:groupId', requirePermission('groups', 'update'), updateUserGroup);
router.delete('/:groupId', requirePermission('groups', 'delete'), deleteUserGroup);

// Member management
router.get('/:groupId/members', requirePermission('groups', 'read'), getMembers);
router.post('/:groupId/members', requirePermission('groups', 'manage_members'), addGroupMember);
router.delete('/:groupId/members/:userId', requirePermission('groups', 'manage_members'), removeGroupMember);

module.exports = router;
