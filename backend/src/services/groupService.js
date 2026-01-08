const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

// Create user group
const createGroup = async (name, description, createdBy) => {
  try {
    // Check if group already exists
    const existing = await pool.query(
      `SELECT id FROM user_groups WHERE name = $1`,
      [name]
    );

    if (existing.rows.length > 0) {
      throw new Error('Group already exists');
    }

    const result = await pool.query(
      `INSERT INTO user_groups (name, description, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, description, created_by, created_at`,
      [name, description, createdBy]
    );

    const group = result.rows[0];

    // Log audit
    await logAuditAction(
      createdBy,
      'GROUP_CREATED',
      'group',
      group.id,
      null,
      { name, description }
    );

    return group;
  } catch (err) {
    console.error('Create group error:', err);
    throw err;
  }
};

// Get all groups
const getAllGroups = async (limit = 100, offset = 0) => {
  try {
    const groupsResult = await pool.query(
      `SELECT g.*, u.email as created_by_email, COUNT(m.id) as member_count
       FROM user_groups g
       LEFT JOIN users u ON g.created_by = u.id
       LEFT JOIN user_group_members m ON g.id = m.group_id
       GROUP BY g.id
       ORDER BY g.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM user_groups`
    );

    return {
      groups: groupsResult.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    };
  } catch (err) {
    console.error('Get all groups error:', err);
    throw err;
  }
};

// Get group by ID
const getGroupById = async (groupId) => {
  try {
    const result = await pool.query(
      `SELECT g.*, u.email as created_by_email
       FROM user_groups g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = $1`,
      [groupId]
    );

    return result.rows[0] || null;
  } catch (err) {
    console.error('Get group error:', err);
    throw err;
  }
};

// Update group
const updateGroup = async (groupId, name, description, updatedBy) => {
  try {
    const result = await pool.query(
      `UPDATE user_groups
       SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, description, updated_at`,
      [name, description, groupId]
    );

    if (!result.rows.length) {
      throw new Error('Group not found');
    }

    await logAuditAction(
      updatedBy,
      'GROUP_UPDATED',
      'group',
      groupId,
      null,
      { name, description }
    );

    return result.rows[0];
  } catch (err) {
    console.error('Update group error:', err);
    throw err;
  }
};

// Delete group
const deleteGroup = async (groupId, deletedBy) => {
  try {
    const result = await pool.query(
      `DELETE FROM user_groups WHERE id = $1`,
      [groupId]
    );

    if (result.rowCount === 0) {
      throw new Error('Group not found');
    }

    await logAuditAction(
      deletedBy,
      'GROUP_DELETED',
      'group',
      groupId,
      null,
      {}
    );

    return { success: true, message: 'Group deleted' };
  } catch (err) {
    console.error('Delete group error:', err);
    throw err;
  }
};

// Add member to group
const addMemberToGroup = async (groupId, userId, role = 'member') => {
  try {
    // Check if group exists
    const group = await getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user exists
    const userResult = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) {
      throw new Error('User not found');
    }

    // Check if user already in group
    const existing = await pool.query(
      `SELECT id FROM user_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );

    if (existing.rows.length > 0) {
      throw new Error('User already in group');
    }

    const result = await pool.query(
      `INSERT INTO user_group_members (group_id, user_id, role, added_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, group_id, user_id, role`,
      [groupId, userId, role]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Add member error:', err);
    throw err;
  }
};

// Remove member from group
const removeMemberFromGroup = async (groupId, userId) => {
  try {
    const result = await pool.query(
      `DELETE FROM user_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Member not found in group');
    }

    return { success: true, message: 'Member removed from group' };
  } catch (err) {
    console.error('Remove member error:', err);
    throw err;
  }
};

// Get group members
const getGroupMembers = async (groupId) => {
  try {
    const result = await pool.query(
      `SELECT ugm.id, u.id as user_id, u.email, u.username, u.first_name, u.last_name, ugm.role, ugm.added_at
       FROM user_group_members ugm
       JOIN users u ON ugm.user_id = u.id
       WHERE ugm.group_id = $1
       ORDER BY ugm.added_at DESC`,
      [groupId]
    );

    return result.rows;
  } catch (err) {
    console.error('Get group members error:', err);
    throw err;
  }
};

// Get user groups
const getUserGroups = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT g.*, ugm.role as user_role
       FROM user_group_members ugm
       JOIN user_groups g ON ugm.group_id = g.id
       WHERE ugm.user_id = $1
       ORDER BY ugm.added_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (err) {
    console.error('Get user groups error:', err);
    throw err;
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupMembers,
  getUserGroups
};
