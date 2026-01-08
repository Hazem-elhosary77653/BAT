const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

// Create document
const createDocument = async (req, res) => {
  try {
    const { title, description, tags, accessLevel } = req.body;
    const filePath = req.file?.path || '';
    const fileSize = req.file?.size || 0;
    const fileType = req.file?.mimetype || '';

    const result = await pool.query(
      `INSERT INTO documents (user_id, title, description, file_path, file_type, file_size, tags, access_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, title, description, filePath, fileType, fileSize, tags || [], accessLevel || 'private']
    );

    await logAuditAction(req.user.id, 'DOCUMENT_CREATED', 'document', result.rows[0].id);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

// Get documents
const getDocuments = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT * FROM documents WHERE user_id = $1`;
    const params = [req.user.id];

    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Get document by ID
const getDocumentById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// Update document
const updateDocument = async (req, res) => {
  try {
    const { title, description, tags, accessLevel } = req.body;

    const result = await pool.query(
      `UPDATE documents 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           tags = COALESCE($3, tags),
           access_level = COALESCE($4, access_level),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, description, tags, accessLevel, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await logAuditAction(req.user.id, 'DOCUMENT_UPDATED', 'document', req.params.id);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await logAuditAction(req.user.id, 'DOCUMENT_DELETED', 'document', req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
};
