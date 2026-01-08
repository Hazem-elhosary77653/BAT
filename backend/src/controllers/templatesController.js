const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

// Create template
const createTemplate = async (req, res) => {
  try {
    const { name, description, content, templateType, isPublic } = req.body;

    const result = await pool.query(
      `INSERT INTO templates (user_id, name, description, content, template_type, is_public)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, name, description, content, templateType, isPublic || false]
    );

    await logAuditAction(req.user.id, 'TEMPLATE_CREATED', 'template', result.rows[0].id);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating template:', err);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// Get templates
const getTemplates = async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = `SELECT * FROM templates WHERE user_id = $1 OR is_public = true`;
    const params = [req.user.id];

    if (type) {
      query += ` AND template_type = $${params.length + 1}`;
      params.push(type);
    }
    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// Get template by ID
const getTemplateById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM templates WHERE id = $1 AND (user_id = $2 OR is_public = true)`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching template:', err);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const { name, description, content, templateType, isPublic } = req.body;

    const result = await pool.query(
      `UPDATE templates 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           content = COALESCE($3, content),
           template_type = COALESCE($4, template_type),
           is_public = COALESCE($5, is_public),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, description, content, templateType, isPublic, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await logAuditAction(req.user.id, 'TEMPLATE_UPDATED', 'template', req.params.id);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating template:', err);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await logAuditAction(req.user.id, 'TEMPLATE_DELETED', 'template', req.params.id);

    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    console.error('Error deleting template:', err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
};
