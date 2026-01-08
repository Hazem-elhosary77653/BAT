/**
 * Template Management Controller
 * Handles CRUD operations for document and story templates
 */

const { validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

/**
 * List all templates for current user
 * GET /api/templates
 */
exports.listTemplates = (req, res) => {
    try {
        const userIdStr = String(req.user.id);
        const { category } = req.query;

        let query = 'SELECT * FROM templates WHERE (user_id = ? OR is_public = 1)';
        const params = [userIdStr];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const templates = db.prepare(query).all(...params);

        // Format variables from JSON string
        const formatted = templates.map(tpl => ({
            ...tpl,
            variables: tpl.variables ? JSON.parse(tpl.variables) : []
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('Error listing templates:', error.message);
        res.status(500).json({ success: false, error: 'Failed to list templates' });
    }
};

/**
 * Get single template
 * GET /api/templates/:id
 */
exports.getTemplate = (req, res) => {
    try {
        const { id } = req.params;
        const userIdStr = String(req.user.id);

        const template = db.prepare('SELECT * FROM templates WHERE id = ? AND (user_id = ? OR is_public = 1)').get(id, userIdStr);

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        res.json({
            success: true,
            data: {
                ...template,
                variables: template.variables ? JSON.parse(template.variables) : []
            }
        });
    } catch (error) {
        console.error('Error fetching template:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch template' });
    }
};

/**
 * Create new template
 * POST /api/templates
 */
exports.createTemplate = (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const userIdStr = String(req.user.id);
        const { name, description, content, category, variables = [], is_public = 0 } = req.body;

        const id = uuidv4();
        const stmt = db.prepare(`
      INSERT INTO templates (id, user_id, name, description, content, category, variables, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            userIdStr,
            name,
            description || '',
            content,
            category || 'brd',
            JSON.stringify(variables),
            is_public ? 1 : 0
        );

        res.status(201).json({
            success: true,
            data: { id, name, category }
        });
    } catch (error) {
        console.error('Error creating template:', error.message);
        res.status(500).json({ success: false, error: 'Failed to create template' });
    }
};

/**
 * Update template
 * PUT /api/templates/:id
 */
exports.updateTemplate = (req, res) => {
    try {
        const { id } = req.params;
        const userIdStr = String(req.user.id);
        const { name, description, content, category, variables, is_public } = req.body;

        // Check ownership
        const existing = db.prepare('SELECT user_id FROM templates WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        if (existing.user_id !== userIdStr) {
            return res.status(403).json({ success: false, error: 'Unauthorized to update this template' });
        }

        const updates = [];
        const params = [];

        if (name) { updates.push('name = ?'); params.push(name); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (content) { updates.push('content = ?'); params.push(content); }
        if (category) { updates.push('category = ?'); params.push(category); }
        if (variables) { updates.push('variables = ?'); params.push(JSON.stringify(variables)); }
        if (is_public !== undefined) { updates.push('is_public = ?'); params.push(is_public ? 1 : 0); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        const query = `UPDATE templates SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
        params.push(id, userIdStr);

        db.prepare(query).run(...params);

        res.json({
            success: true,
            message: 'Template updated successfully'
        });
    } catch (error) {
        console.error('Error updating template:', error.message);
        res.status(500).json({ success: false, error: 'Failed to update template' });
    }
};

/**
 * Delete template
 * DELETE /api/templates/:id
 */
exports.deleteTemplate = (req, res) => {
    try {
        const { id } = req.params;
        const userIdStr = String(req.user.id);

        const result = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?').run(id, userIdStr);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Template not found or unauthorized' });
        }

        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting template:', error.message);
        res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
};
