const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

// Create user story
const createUserStory = async (req, res) => {
  try {
    const { title, description, acceptanceCriteria, priority, tags } = req.body;

    const result = await pool.query(
      `INSERT INTO user_stories (user_id, title, description, acceptance_criteria, priority, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title, description, acceptanceCriteria, priority, tags || []]
    );

    await logAuditAction(req.user.id, 'USER_STORY_CREATED', 'user_story', result.rows[0].id, null, result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user story:', err);
    res.status(500).json({ error: 'Failed to create user story' });
  }
};

// Get all user stories for user
const getUserStories = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let query = `SELECT * FROM user_stories WHERE user_id = $1`;
    const params = [req.user.id];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (priority) {
      query += ` AND priority = $${params.length + 1}`;
      params.push(priority);
    }
    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user stories:', err);
    res.status(500).json({ error: 'Failed to fetch user stories' });
  }
};

// Get user story by ID
const getUserStoryById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM user_stories WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User story not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user story:', err);
    res.status(500).json({ error: 'Failed to fetch user story' });
  }
};

// Update user story
const updateUserStory = async (req, res) => {
  try {
    const { title, description, acceptanceCriteria, priority, status, tags, azureDevOpsId } = req.body;

    const result = await pool.query(
      `UPDATE user_stories 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           acceptance_criteria = COALESCE($3, acceptance_criteria),
           priority = COALESCE($4, priority),
           status = COALESCE($5, status),
           tags = COALESCE($6, tags),
           azure_devops_id = COALESCE($7, azure_devops_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [title, description, acceptanceCriteria, priority, status, tags, azureDevOpsId, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User story not found' });
    }

    await logAuditAction(req.user.id, 'USER_STORY_UPDATED', 'user_story', req.params.id, null, result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user story:', err);
    res.status(500).json({ error: 'Failed to update user story' });
  }
};

// Delete user story
const deleteUserStory = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM user_stories WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User story not found' });
    }

    await logAuditAction(req.user.id, 'USER_STORY_DELETED', 'user_story', req.params.id);

    res.json({ message: 'User story deleted successfully' });
  } catch (err) {
    console.error('Error deleting user story:', err);
    res.status(500).json({ error: 'Failed to delete user story' });
  }
};

module.exports = {
  createUserStory,
  getUserStories,
  getUserStoryById,
  updateUserStory,
  deleteUserStory
};
