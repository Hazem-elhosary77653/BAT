const { createGroup, getAllGroups, getGroupById, updateGroup, deleteGroup, addMemberToGroup, removeMemberFromGroup, getGroupMembers, getUserGroups } = require('../services/groupService');

// Create group (permission-based access)
const createUserGroup = async (req, res) => {
  try {
    // Permission already checked by middleware (groups:create required)

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await createGroup(name, description, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (err) {
    console.error('Create group error:', err);

    if (err.message.includes('already exists')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to create group' });
  }
};

// Get all groups (permission-based access)
const getGroups = async (req, res) => {
  try {
    // Permission already checked by middleware (groups:read required)

    const { limit = 100, offset = 0 } = req.query;

    const result = await getAllGroups(parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: result.groups,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

// Get group by ID (permission-based access)
const getGroup = async (req, res) => {
  try {
    // Permission already checked by middleware (groups:read required)

    const { groupId } = req.params;

    const group = await getGroupById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (err) {
    console.error('Get group error:', err);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
};

// Update group (permission-based access)
const updateUserGroup = async (req, res) => {
  try {
    // Permission already checked by middleware (groups:update required)

    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await updateGroup(groupId, name, description, req.user.id);

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: group
    });
  } catch (err) {
    console.error('Update group error:', err);

    if (err.message === 'Group not found') {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to update group' });
  }
};

// Delete group (permission-based access)
const deleteUserGroup = async (req, res) => {
  try {
    // Permission already checked by middleware (groups:delete required)

    const { groupId } = req.params;

    const result = await deleteGroup(groupId, req.user.id);

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('Delete group error:', err);

    if (err.message === 'Group not found') {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to delete group' });
  }
};

// Add member to group (permission-based access)
const addGroupMember = async (req, res) => {
  try {
    // Permission already checked by middleware (groups:manage_members required)

    const { groupId } = req.params;
    const { userId, role = 'member' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const member = await addMemberToGroup(groupId, userId, role);

    res.status(201).json({
      success: true,
      message: 'Member added to group',
      data: member
    });
  } catch (err) {
    console.error('Add member error:', err);

    if (err.message.includes('not found') || err.message.includes('already')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to add member' });
  }
};

// Remove member from group (permission-based access)
const removeGroupMember = async (req, res) => {
  try {
    // Permission already checked by middleware (groups:manage_members required)

    const { groupId, userId } = req.params;

    const result = await removeMemberFromGroup(groupId, userId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('Remove member error:', err);

    if (err.message === 'Member not found in group') {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to remove member' });
  }
};

// Get group members (permission-based access)
const getMembers = async (req, res) => {
  try {
    // Permission already checked by middleware (groups:read required)

    const { groupId } = req.params;

    const members = await getGroupMembers(groupId);

    res.json({
      success: true,
      data: members
    });
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// Get user's groups
const getMyGroups = async (req, res) => {
  try {
    const groups = await getUserGroups(req.user.id);

    res.json({
      success: true,
      data: groups
    });
  } catch (err) {
    console.error('Get user groups error:', err);
    res.status(500).json({ error: 'Failed to fetch user groups' });
  }
};

module.exports = {
  createUserGroup,
  getGroups,
  getGroup,
  updateUserGroup,
  deleteUserGroup,
  addGroupMember,
  removeGroupMember,
  getMembers,
  getMyGroups
};
