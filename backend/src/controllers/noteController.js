const pool = require('../db/connection');
const aiService = require('../services/aiService');

const isSqlite = (process.env.DB_TYPE || 'sqlite') === 'sqlite';
const toSqliteBool = (value) => (value ? 1 : 0);
const toSqliteJson = (value) => (value == null ? null : JSON.stringify(value));
const fs = require('fs');
const path = require('path');

// Log file path
const logFile = path.join(__dirname, '../../note-errors.log');

const log = (message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n---\n`;
    fs.appendFileSync(logFile, logMessage, 'utf8');
    console.log(message, data);
};

/**
 * List all notes for the authenticated user
 * Supports filtering by: archived, pinned, favorite, tags, priority
 */
const listNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { archived, pinned, favorite, tags, priority } = req.query;
        
        let query = 'SELECT * FROM user_notes WHERE user_id = $1';
        const params = [userId];
        let paramCount = 1;
        
        // Filter archived notes
        if (archived !== undefined) {
            paramCount++;
            query += ` AND is_archived = $${paramCount}`;
            params.push(archived === 'true' ? true : false);
        } else {
            // By default, don't show archived notes
            query += ' AND (is_archived IS NULL OR is_archived = false)';
        }
        
        // Filter pinned notes
        if (pinned === 'true') {
            query += ' AND is_pinned = true';
        }
        
        // Filter favorite notes
        if (favorite === 'true') {
            query += ' AND is_favorite = true';
        }
        
        // Filter by priority
        if (priority) {
            paramCount++;
            query += ` AND priority = $${paramCount}`;
            params.push(priority);
        }
        
        // Order: pinned first, then by updated_at
        query += ' ORDER BY is_pinned DESC NULLS LAST, updated_at DESC';
        
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error listing notes:', error.message, error.stack);
        console.error('List notes query:', query);
        console.error('List notes params:', params);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch notes' });
    }
};

/**
 * Create a new note with enhanced features
 */
const createNote = async (req, res) => {
    try {
        console.log('[NOTE CREATE] Incoming request...');
        console.log('[NOTE CREATE] User ID:', req.user?.id);
        console.log('[NOTE CREATE] Request body:', JSON.stringify(req.body, null, 2));
        
        const userId = req.user.id;
        const { 
            title, content, color, 
            is_pinned, is_favorite, is_archived,
            tags, priority, due_date,
            is_todo, todo_items 
        } = req.body;

        // Handle tags/todo_items for SQLite
        const tagsValue = isSqlite ? toSqliteJson(tags) : tags;
        const todoValue = isSqlite ? toSqliteJson(todo_items) : todo_items;
        const pinnedValue = isSqlite ? toSqliteBool(is_pinned) : is_pinned;
        const favoriteValue = isSqlite ? toSqliteBool(is_favorite) : is_favorite;
        const archivedValue = isSqlite ? toSqliteBool(is_archived) : is_archived;
        const isTodoValue = isSqlite ? toSqliteBool(is_todo) : is_todo;

        console.log('[NOTE CREATE] About to execute query with params:', {
            userId,
            title,
            content: (content || '').substring(0, 50) + '...',
            color,
            is_pinned,
            is_favorite,
            is_archived,
            tagsValue,
            priority,
            due_date,
            is_todo,
            todoValue
        });

        const result = await pool.query(
            `INSERT INTO user_notes 
            (user_id, title, content, color, is_pinned, is_favorite, is_archived, 
             tags, priority, due_date, is_todo, todo_items) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING *`,
            [
                userId, 
                title, 
                content, 
                color || '#ffffff',
                pinnedValue ?? false,
                favoriteValue ?? false,
                archivedValue ?? false,
                tagsValue,
                priority || null,
                due_date || null,
                isTodoValue ?? false,
                todoValue
            ]
        );

        console.log('[NOTE CREATE] Success! Note created with ID:', result.rows[0]?.id);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('[NOTE CREATE] Error creating note:', error.message);
        console.error('[NOTE CREATE] Error details:', error);
        console.error('[NOTE CREATE] Request body:', req.body);
        res.status(500).json({ success: false, error: error.message || 'Failed to create note' });
    }
};

/**
 * Update an existing note with all features
 */
const updateNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { 
            title, content, color,
            is_pinned, is_favorite, is_archived,
            tags, priority, due_date,
            is_todo, todo_items 
        } = req.body;

        // Handle tags/todo_items for SQLite
        const tagsValue = isSqlite ? toSqliteJson(tags) : tags;
        const todoValue = isSqlite ? toSqliteJson(todo_items) : todo_items;
        const pinnedValue = isSqlite ? toSqliteBool(is_pinned) : is_pinned;
        const favoriteValue = isSqlite ? toSqliteBool(is_favorite) : is_favorite;
        const archivedValue = isSqlite ? toSqliteBool(is_archived) : is_archived;
        const isTodoValue = isSqlite ? toSqliteBool(is_todo) : is_todo;

        const result = await pool.query(
            `UPDATE user_notes SET 
             title = $1, content = $2, color = $3,
             is_pinned = $4, is_favorite = $5, is_archived = $6,
             tags = $7, priority = $8, due_date = $9,
             is_todo = $10, todo_items = $11,
             updated_at = CURRENT_TIMESTAMP 
             WHERE id = $12 AND user_id = $13 RETURNING *`,
            [
                title, content, color,
                pinnedValue, favoriteValue, archivedValue,
                tagsValue, priority, due_date,
                isTodoValue, todoValue,
                id, userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating note:', error.message, error.stack);
        console.error('Request body:', req.body);
        res.status(500).json({ success: false, error: error.message || 'Failed to update note' });
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

/**
 * Toggle pin status for a note
 */
const togglePin = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE user_notes 
             SET is_pinned = NOT COALESCE(is_pinned, false), updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error toggling pin:', error.message);
        res.status(500).json({ success: false, error: 'Failed to toggle pin' });
    }
};

/**
 * Toggle favorite status for a note
 */
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE user_notes 
             SET is_favorite = NOT COALESCE(is_favorite, false), updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error toggling favorite:', error.message);
        res.status(500).json({ success: false, error: 'Failed to toggle favorite' });
    }
};

/**
 * Toggle archive status for a note
 */
const toggleArchive = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE user_notes 
             SET is_archived = NOT COALESCE(is_archived, false), updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error toggling archive:', error.message);
        res.status(500).json({ success: false, error: 'Failed to toggle archive' });
    }
};

/**
 * Update todo items in a note
 */
const updateTodoItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { todo_items } = req.body;

        // Handle todo_items for SQLite
        const todoValue = isSqlite ? toSqliteJson(todo_items) : todo_items;

        const result = await pool.query(
            `UPDATE user_notes 
             SET todo_items = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND user_id = $3 RETURNING *`,
            [todoValue, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating todo items:', error.message);
        res.status(500).json({ success: false, error: 'Failed to update todo items' });
    }
};

/**
 * Get all unique tags from user's notes
 */
const getAllTags = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (isSqlite) {
            // SQLite: tags stored as JSON strings
            const result = await pool.query(
                'SELECT DISTINCT tags FROM user_notes WHERE user_id = $1 AND tags IS NOT NULL',
                [userId]
            );
            
            const allTags = new Set();
            result.rows.forEach(row => {
                try {
                    const tags = JSON.parse(row.tags);
                    if (Array.isArray(tags)) {
                        tags.forEach(tag => allTags.add(tag));
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            });
            
            res.json({ success: true, data: Array.from(allTags) });
        } else {
            // PostgreSQL: use unnest for arrays
            const result = await pool.query(
                'SELECT DISTINCT unnest(tags) as tag FROM user_notes WHERE user_id = $1 AND tags IS NOT NULL',
                [userId]
            );
            
            const tags = result.rows.map(row => row.tag);
            res.json({ success: true, data: tags });
        }
    } catch (error) {
        console.error('Error getting tags:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get tags' });
    }
};

module.exports = {
    listNotes,
    createNote,
    updateNote,
    deleteNote,
    aiRefineNote,
    togglePin,
    toggleFavorite,
    toggleArchive,
    updateTodoItems,
    getAllTags
};
