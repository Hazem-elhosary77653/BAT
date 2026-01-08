const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

// Create diagram
const createDiagram = async (req, res) => {
  try {
    const { title, description, diagramData, diagramType } = req.body;

    const result = await pool.query(
      `INSERT INTO diagrams (user_id, title, description, diagram_data, diagram_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, title, description, diagramData, diagramType]
    );

    await logAuditAction(req.user.id, 'DIAGRAM_CREATED', 'diagram', result.rows[0].id);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating diagram:', err);
    res.status(500).json({ error: 'Failed to create diagram' });
  }
};

// Get diagrams
const getDiagrams = async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = `SELECT * FROM diagrams WHERE user_id = $1`;
    const params = [req.user.id];

    if (type) {
      query += ` AND diagram_type = $${params.length + 1}`;
      params.push(type);
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
    console.error('Error fetching diagrams:', err);
    res.status(500).json({ error: 'Failed to fetch diagrams' });
  }
};

// Get diagram by ID
const getDiagramById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM diagrams WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Diagram not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching diagram:', err);
    res.status(500).json({ error: 'Failed to fetch diagram' });
  }
};

// Update diagram
const updateDiagram = async (req, res) => {
  try {
    const { title, description, diagramData, diagramType } = req.body;

    const result = await pool.query(
      `UPDATE diagrams 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           diagram_data = COALESCE($3, diagram_data),
           diagram_type = COALESCE($4, diagram_type),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, description, diagramData, diagramType, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Diagram not found' });
    }

    await logAuditAction(req.user.id, 'DIAGRAM_UPDATED', 'diagram', req.params.id);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating diagram:', err);
    res.status(500).json({ error: 'Failed to update diagram' });
  }
};

// Delete diagram
const deleteDiagram = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM diagrams WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Diagram not found' });
    }

    await logAuditAction(req.user.id, 'DIAGRAM_DELETED', 'diagram', req.params.id);

    res.json({ message: 'Diagram deleted successfully' });
  } catch (err) {
    console.error('Error deleting diagram:', err);
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
};

module.exports = {
  createDiagram,
  getDiagrams,
  getDiagramById,
  updateDiagram,
  deleteDiagram
};
