const pool = require('../db/connection');
const aiService = require('../services/aiService');

/**
 * Generate wireframe from text/BRD/story
 */
const generateWireframe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompt, brd_id, story_id, wireframe_type = 'ui_mockup', complexity = 'standard' } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        console.log('[WIREFRAME] Generating wireframe for user:', userId);
        console.log('[WIREFRAME] Prompt:', prompt.substring(0, 100) + '...');

        // Generate wireframe using AI service
        const wireframeData = await aiService.generateWireframe(prompt, {
            type: wireframe_type,
            complexity,
            context: { brd_id, story_id }
        });

        if (!wireframeData) {
            return res.status(500).json({ success: false, error: 'Failed to generate wireframe' });
        }

        res.json({ success: true, data: wireframeData });
    } catch (error) {
        console.error('[WIREFRAME] Error generating wireframe:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate wireframe' });
    }
};

/**
 * Create a new wireframe
 */
const createWireframe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, canvas_json, wireframe_type = 'ui_mockup', brd_id } = req.body;

        if (!title || !canvas_json) {
            return res.status(400).json({ success: false, error: 'Title and canvas_json are required' });
        }

        console.log('[WIREFRAME] Creating wireframe for user:', userId);

        const result = await pool.query(
            `INSERT INTO wireframes (user_id, title, description, canvas_json, wireframe_type, brd_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'draft')
             RETURNING *`,
            [userId, title, description || null, canvas_json, wireframe_type, brd_id || null]
        );

        console.log('[WIREFRAME] Created wireframe ID:', result.rows[0]?.id);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[WIREFRAME] Error creating wireframe:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to create wireframe' });
    }
};

/**
 * Get all wireframes for user
 */
const listWireframes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { brd_id, status } = req.query;

        let query = 'SELECT * FROM wireframes WHERE user_id = ?';
        const params = [userId];

        if (brd_id) {
            query += ' AND brd_id = ?';
            params.push(brd_id);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY updated_at DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('[WIREFRAME] Error listing wireframes:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch wireframes' });
    }
};

/**
 * Get single wireframe
 */
const getWireframe = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT * FROM wireframes WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Wireframe not found' });
        }

        // Get linked stories
        const storiesResult = await pool.query(
            `SELECT us.* FROM user_stories us
             INNER JOIN wireframe_stories ws ON us.id = ws.story_id
             WHERE ws.wireframe_id = ?`,
            [id]
        );

        const wireframe = result.rows[0];
        wireframe.linked_stories = storiesResult.rows || [];

        res.json({ success: true, data: wireframe });
    } catch (error) {
        console.error('[WIREFRAME] Error getting wireframe:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch wireframe' });
    }
};

/**
 * Update wireframe
 */
const updateWireframe = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, canvas_json, status } = req.body;

        // Verify ownership
        const checkResult = await pool.query(
            'SELECT user_id FROM wireframes WHERE id = ?',
            [id]
        );

        if (!checkResult.rows || checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Wireframe not found' });
        }

        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const result = await pool.query(
            `UPDATE wireframes SET
             title = ?, description = ?, canvas_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?
             RETURNING *`,
            [title, description || null, canvas_json, status || 'draft', id, userId]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[WIREFRAME] Error updating wireframe:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to update wireframe' });
    }
};

/**
 * Delete wireframe
 */
const deleteWireframe = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const checkResult = await pool.query(
            'SELECT user_id FROM wireframes WHERE id = ?',
            [id]
        );

        if (!checkResult.rows || checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Wireframe not found' });
        }

        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM wireframes WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ success: true, message: 'Wireframe deleted' });
    } catch (error) {
        console.error('[WIREFRAME] Error deleting wireframe:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to delete wireframe' });
    }
};

/**
 * Link story to wireframe
 */
const linkStory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { story_id } = req.body;

        if (!story_id) {
            return res.status(400).json({ success: false, error: 'Story ID is required' });
        }

        // Verify wireframe ownership
        const wireframeResult = await pool.query(
            'SELECT user_id FROM wireframes WHERE id = ?',
            [id]
        );

        if (!wireframeResult.rows || wireframeResult.rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // Verify story ownership
        const storyResult = await pool.query(
            'SELECT user_id FROM user_stories WHERE id = ?',
            [story_id]
        );

        if (!storyResult.rows || storyResult.rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Story not found or unauthorized' });
        }

        // Link story
        await pool.query(
            `INSERT OR IGNORE INTO wireframe_stories (wireframe_id, story_id, linked_by_user_id)
             VALUES (?, ?, ?)`,
            [id, story_id, userId]
        );

        res.json({ success: true, message: 'Story linked to wireframe' });
    } catch (error) {
        console.error('[WIREFRAME] Error linking story:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to link story' });
    }
};

/**
 * Unlink story from wireframe
 */
const unlinkStory = async (req, res) => {
    try {
        const { id, story_id } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const wireframeResult = await pool.query(
            'SELECT user_id FROM wireframes WHERE id = ?',
            [id]
        );

        if (!wireframeResult.rows || wireframeResult.rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await pool.query(
            'DELETE FROM wireframe_stories WHERE wireframe_id = ? AND story_id = ?',
            [id, story_id]
        );

        res.json({ success: true, message: 'Story unlinked from wireframe' });
    } catch (error) {
        console.error('[WIREFRAME] Error unlinking story:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to unlink story' });
    }
};

module.exports = {
    generateWireframe,
    createWireframe,
    listWireframes,
    getWireframe,
    updateWireframe,
    deleteWireframe,
    linkStory,
    unlinkStory
};
