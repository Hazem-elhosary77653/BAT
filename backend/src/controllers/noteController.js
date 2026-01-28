const pool = require('../db/connection');
const aiService = require('../services/aiService');

/**
 * List all notes for the authenticated user
 */
const listNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT * FROM user_notes WHERE user_id = $1 ORDER BY updated_at DESC',
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error listing notes:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch notes' });
    }
};

/**
 * Create a new note
 */
const createNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content, color } = req.body;

        const result = await pool.query(
            'INSERT INTO user_notes (user_id, title, content, color) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, title, content, color || '#ffffff']
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating note:', error.message);
        res.status(500).json({ success: false, error: 'Failed to create note' });
    }
};

/**
 * Update an existing note
 */
const updateNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, content, color } = req.body;

        const result = await pool.query(
            'UPDATE user_notes SET title = $1, content = $2, color = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
            [title, content, color, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating note:', error.message);
        res.status(500).json({ success: false, error: 'Failed to update note' });
    }
};

/**
 * Delete a note
 */
const deleteNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM user_notes WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error.message);
        res.status(500).json({ success: false, error: 'Failed to delete note' });
    }
};

/**
 * Refine note content using AI
 */
const aiRefineNote = async (req, res) => {
    try {
        const { text, instruction } = req.body;
        const userId = req.user.id;

        if (!text) {
            return res.status(400).json({ success: false, error: 'Text is required for AI refinement' });
        }

        // Get user's AI config for the API key
        const config = await pool.query('SELECT api_key FROM ai_configurations WHERE user_id = $1', [userId]);
        let apiKey = process.env.OPENAI_API_KEY;

        if (config.rows.length > 0 && config.rows[0].api_key) {
            const { decryptKey } = require('../utils/encryption');
            apiKey = decryptKey(config.rows[0].api_key);
        }

        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'OpenAI API key not configured' });
        }

        aiService.initializeOpenAI(apiKey);
        const refinedText = await aiService.smartEditText(text, instruction || 'Improve the clarity and flow of this note');

        res.json({ success: true, data: refinedText });
    } catch (error) {
        console.error('AI Refinement Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to refine note with AI' });
    }
};

module.exports = {
    listNotes,
    createNote,
    updateNote,
    deleteNote,
    aiRefineNote
};
