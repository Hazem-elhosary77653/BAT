const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');
const { extractTextFromFile } = require('../utils/documentUtils');
const aiService = require('../services/aiService');
const { decryptKey } = require('../utils/encryption');
const fs = require('fs');
const path = require('path');
const { sendNotificationEmail } = require('../services/notificationEmailService');
const notificationService = require('../services/notificationService');

// Create document
const createDocument = async (req, res) => {
  try {
    const { title, description, tags, accessLevel } = req.body;
    const filePath = req.file?.path || '';
    const fileSize = req.file?.size || 0;
    const fileType = req.file?.mimetype || '';

    // Extract content from file
    let content = '';
    if (filePath) {
      console.log(`[createDocument] Extracting text from ${filePath} (${fileType})`);
      try {
        content = await extractTextFromFile(filePath, fileType);
        console.log(`[createDocument] Extraction successful, content length: ${content.length}`);
      } catch (extractionErr) {
        console.error(`[createDocument] Extraction failed for ${title}:`, extractionErr);
        // We continue even if extraction fails, but document will have no content
      }
    }

    console.log(`[createDocument] Inserting document into DB: ${title}`);
    const result = await pool.query(
      `INSERT INTO documents (user_id, title, description, file_path, file_type, file_size, tags, access_level, content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, title, description, filePath, fileType, fileSize, tags || [], accessLevel || 'private', content]
    );

    console.log(`[createDocument] Document saved with ID: ${result.rows[0].id}`);
    await logAuditAction(req.user.id, 'DOCUMENT_CREATED', 'document', result.rows[0].id);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[createDocument] Fatal error:', err);
    res.status(500).json({ error: 'Failed to create document', details: err.message });
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

    // Get document title and user email for notification
    const docInfo = await pool.query('SELECT title FROM documents WHERE id = $1', [req.params.id]);
    const userInfo = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);

    const docTitle = docInfo.rows[0]?.title || 'Document';
    const userEmail = userInfo.rows[0]?.email;

    await logAuditAction(req.user.id, 'DOCUMENT_DELETED', 'document', req.params.id);

    // Send notification
    if (userEmail) {
      try {
        await notificationService.createNotification(
          req.user.id,
          'Document Deleted',
          `The document "${docTitle}" has been permanently deleted from your workspace.`,
          'info'
        );

        await sendNotificationEmail(
          userEmail,
          'Document Deleted - Business Analyst Workspace',
          `Hello,\n\nThis is a confirmation that the document "${docTitle}" has been deleted from your workspace.\n\nRegards,\nTeam`
        );
      } catch (notifyErr) {
        console.warn('Failed to send delete notification:', notifyErr.message);
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

// Get document content for analysis/preview
const getDocumentContent = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, content, title, file_type, file_path, access_level, tags FROM documents WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Fetch linked assets summary
    const linkedStories = await pool.query('SELECT COUNT(*) as count FROM user_stories WHERE source_document_id = $1', [req.params.id]);
    const linkedDiagrams = await pool.query('SELECT COUNT(*) as count FROM diagrams WHERE source_document_id = $1', [req.params.id]);
    const linkedBRDs = await pool.query('SELECT COUNT(*) as count FROM brd_documents WHERE source_document_id = $1', [req.params.id]);

    const doc = result.rows[0];
    doc.linked_assets = {
      stories: linkedStories.rows[0].count,
      diagrams: linkedDiagrams.rows[0].count,
      brds: linkedBRDs.rows[0].count
    };

    res.json(doc);
  } catch (err) {
    console.error('Error fetching document content:', err);
    res.status(500).json({ error: 'Failed to fetch document content' });
  }
};

// AI Extract Insights (Preview Only)
const extractInsights = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, options = {} } = req.body;
    const userId = req.user.id;

    // 1. Fetch document content
    const docResult = await pool.query(
      'SELECT content, title FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    const doc = docResult.rows[0];
    if (!doc || !doc.content) {
      return res.status(400).json({ error: 'Document has no content to analyze' });
    }

    // 2. Initialize AI Service
    const configResult = await pool.query('SELECT api_key FROM ai_configurations WHERE user_id = $1', [String(userId)]);
    const apiKeyEnc = configResult.rows[0]?.api_key;
    const envApiKey = process.env.OPENAI_API_KEY;
    let apiKey = envApiKey;

    if (apiKeyEnc) {
      try {
        apiKey = decryptKey(apiKeyEnc);
      } catch (e) {
        console.error('API key decryption failed');
      }
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'AI configuration missing. Please add your API key.' });
    }

    if (!aiService.initializeOpenAI(apiKey)) {
      return res.status(500).json({ error: 'AI initialization failed' });
    }

    // 3. Process extraction based on type
    let result;
    if (type === 'stories') {
      result = await aiService.extractStoriesFromBRD(doc.content);
    } else if (type === 'diagram') {
      result = await aiService.generateDiagram(doc.content, options.diagramType || 'flowchart');
    } else if (type === 'brd') {
      result = await aiService.generateBRDFromText(doc.content);
    } else {
      return res.status(400).json({ error: 'Invalid extraction type' });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Extraction error:', err);
    res.status(500).json({ error: `Failed to extract ${req.body.type}: ${err.message}` });
  }
};

// Save extracted insight to respective table
const saveInsight = async (req, res) => {
  try {
    const { id: docId } = req.params;
    const { type, data } = req.body;
    const userId = req.user.id;

    if (!data) return res.status(400).json({ error: 'No data to save' });

    let savedId;
    if (type === 'stories') {
      // Data is an array
      for (const story of data) {
        const result = await pool.query(
          `INSERT INTO user_stories (user_id, title, description, acceptance_criteria, priority, status, source_document_id, generated_by_ai)
           VALUES ($1, $2, $3, $4, $5, 'draft', $6, 1)
           RETURNING id`,
          [userId, story.title, story.description, JSON.stringify(story.acceptance_criteria || []), story.priority || 'P2', docId]
        );
        savedId = result.rows[0].id;
      }
    } else if (type === 'diagram') {
      const result = await pool.query(
        `INSERT INTO diagrams (user_id, title, description, diagram_type, diagram_data, source_document_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, data.title, data.description, data.diagram_type || 'flowchart', data.mermaid_code, docId]
      );
      savedId = result.rows[0].id;
    } else if (type === 'brd') {
      const docInfo = await pool.query('SELECT title FROM documents WHERE id = $1', [docId]);
      const result = await pool.query(
        `INSERT INTO brd_documents (user_id, title, content, status, source_document_id)
         VALUES ($1, $2, $3, 'draft', $4)
         RETURNING id`,
        [userId, `BRD: ${docInfo.rows[0]?.title || 'New Document'}`, data, docId]
      );
      savedId = result.rows[0].id;
    } else {
      return res.status(400).json({ error: 'Invalid insight type' });
    }

    await logAuditAction(userId, 'INSIGHT_SAVED', type, docId);
    res.json({ success: true, id: savedId });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: `Failed to save ${req.body.type}` });
  }
};

// Stream file for inline viewing
const viewDocumentFile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT file_path, file_type FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];
    const absolutePath = path.resolve(__dirname, '../../', doc.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Use res.sendFile with explicit headers to override extension guessing
    // Using CSP frame-ancestors to allow embedding from our frontend
    res.sendFile(absolutePath, {
      headers: {
        'Content-Type': doc.file_type || 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Security-Policy': "frame-ancestors 'self' http://localhost:3000",
        'X-Frame-Options': 'ALLOWALL'
      }
    });
  } catch (err) {
    console.error('Error viewing document file:', err);
    res.status(500).json({ error: 'Failed to stream document' });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentContent,
  extractInsights,
  saveInsight,
  viewDocumentFile
};
