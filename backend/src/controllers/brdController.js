/**
 * BRD Generation Controller
 * Handles BRD generation from user stories using AI
 */

const { validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const pathLib = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const aiService = require('../services/aiService');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const dbPath = process.env.DB_PATH || pathLib.join(__dirname, '../../database.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

/**
 * Get all BRDs for current user
 * GET /api/brd
 */
exports.listBRDs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skip = 0, limit = 20 } = req.query;

    const stmt = db.prepare(`
      SELECT id, title, content, version, created_at, updated_at 
      FROM brd_documents 
      WHERE user_id = ? 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `);

    const brds = stmt.all(userId, parseInt(limit), parseInt(skip));

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM brd_documents WHERE user_id = ?');
    const { count } = countStmt.get(userId);

    res.json({
      success: true,
      data: brds,
      pagination: {
        total: count,
        skip: parseInt(skip),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error listing BRDs:', error.message);
    res.status(500).json({ success: false, error: 'Failed to list BRDs' });
  }
};

/**
 * Get BRD by ID
 * GET /api/brd/:id
 */
exports.getBRD = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const stmt = db.prepare(`
      SELECT * FROM brd_documents 
      WHERE id = ? AND user_id = ?
    `);

    const brd = stmt.get(id, userId);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    res.json({
      success: true,
      data: brd,
    });
  } catch (error) {
    console.error('Error fetching BRD:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch BRD' });
  }
};

/**
 * Generate BRD from user stories
 * POST /api/brd/generate
 */
exports.generateBRD = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const { story_ids = [], title, template = 'full', options = {} } = req.body;

    if (!story_ids || story_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one story is required' });
    }

    // Fetch user's AI configuration
    const configStmt = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?');
    const config = configStmt.get(userId);

    if (!config || !config.api_key) {
      return res.status(400).json({
        success: false,
        error: 'AI configuration not set. Please configure OpenAI API key first.',
      });
    }

    // Decrypt API key and initialize OpenAI
    let decryptedKey;
    try {
      const crypto = require('crypto');
      const algorithm = 'aes-256-cbc';
      const secretKey = (process.env.ENCRYPTION_KEY || 'your-secret-key-change-in-production-32-chars!!').slice(0, 32).padEnd(32, '0');
      const parts = config.api_key.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = Buffer.from(parts[1], 'hex');

      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      decryptedKey = decrypted.toString();
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Failed to decrypt API key' });
    }

    // Initialize OpenAI
    if (!aiService.initializeOpenAI(decryptedKey)) {
      return res.status(500).json({ success: false, error: 'Failed to initialize AI service' });
    }

    // Fetch selected user stories
    const placeholders = story_ids.map(() => '?').join(',');
    const storiesStmt = db.prepare(`
      SELECT id, title, description, acceptance_criteria, priority, status 
      FROM user_stories 
      WHERE id IN (${placeholders}) AND user_id = ?
    `);

    const stories = storiesStmt.all(...story_ids, userId);

    if (stories.length === 0) {
      return res.status(404).json({ success: false, error: 'No matching stories found' });
    }

    // Generate BRD using AI
    const generationOptions = {
      template,
      language: config.language || 'en',
      detailLevel: config.detail_level || 'standard',
      maxTokens: config.max_tokens || 3000,
      temperature: config.temperature || 0.7,
    };

    const brdContent = await aiService.generateBRDFromStories(stories, generationOptions);

    // Save BRD to database
    const brdId = uuidv4();
    const insertStmt = db.prepare(`
      INSERT INTO brd_documents 
      (id, user_id, title, content, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertStmt.run(brdId, userId, title || `BRD - ${new Date().toLocaleDateString()}`, brdContent, 1);

    // Log the action
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logStmt.run(userId, 'CREATE', 'brd_document', brdId);

    res.json({
      success: true,
      message: 'BRD generated successfully',
      data: {
        id: brdId,
        title: title || `BRD - ${new Date().toLocaleDateString()}`,
        content: brdContent,
        version: 1,
      },
    });
  } catch (error) {
    console.error('Error generating BRD:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate BRD',
      details: error.message,
    });
  }
};

/**
 * Update BRD content
 * PUT /api/brd/:id
 */
exports.updateBRD = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, title } = req.body;

    // Get current BRD
    const getStmt = db.prepare('SELECT * FROM brd_documents WHERE id = ? AND user_id = ?');
    const brd = getStmt.get(id, userId);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    // Update BRD
    const updateStmt = db.prepare(`
      UPDATE brd_documents 
      SET content = ?, title = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `);

    updateStmt.run(content || brd.content, title || brd.title, id, userId);

    // Save to version history
    const versionStmt = db.prepare(`
      INSERT INTO brd_versions (brd_id, content, version_number, created_at)
      SELECT id, content, version, CURRENT_TIMESTAMP FROM brd_documents WHERE id = ?
    `);
    versionStmt.run(id);

    // Log the action
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logStmt.run(userId, 'UPDATE', 'brd_document', id);

    res.json({
      success: true,
      message: 'BRD updated successfully',
    });
  } catch (error) {
    console.error('Error updating BRD:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update BRD' });
  }
};

/**
 * Delete BRD
 * DELETE /api/brd/:id
 */
exports.deleteBRD = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if BRD exists
    const checkStmt = db.prepare('SELECT id FROM brd_documents WHERE id = ? AND user_id = ?');
    if (!checkStmt.get(id, userId)) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    // Delete versions
    db.prepare('DELETE FROM brd_versions WHERE brd_id = ?').run(id);

    // Delete BRD
    db.prepare('DELETE FROM brd_documents WHERE id = ? AND user_id = ?').run(id, userId);

    // Log the action
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logStmt.run(userId, 'DELETE', 'brd_document', id);

    res.json({
      success: true,
      message: 'BRD deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting BRD:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete BRD' });
  }
};

/**
 * Get BRD version history
 * GET /api/brd/:id/versions
 */
exports.getVersionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const ownerStmt = db.prepare('SELECT user_id FROM brd_documents WHERE id = ?');
    const brd = ownerStmt.get(id);

    if (!brd || brd.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    const versionStmt = db.prepare(`
      SELECT version_number, created_at 
      FROM brd_versions 
      WHERE brd_id = ? 
      ORDER BY version_number DESC
    `);

    const versions = versionStmt.all(id);

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('Error fetching versions:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch version history' });
  }
};

/**
 * Export BRD to PDF
 * POST /api/brd/:id/export-pdf
 */
exports.exportPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const stmt = db.prepare('SELECT * FROM brd_documents WHERE id = ? AND user_id = ?');
    const brd = stmt.get(id, userId);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `BRD_${Date.now()}.pdf`;
    const filepath = pathLib.join(__dirname, '../../uploads', filename);

    // Ensure uploads directory exists
    if (!fs.existsSync(pathLib.dirname(filepath))) {
      fs.mkdirSync(pathLib.dirname(filepath), { recursive: true });
    }

    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Add title
    doc.fontSize(24).text(brd.title, { underline: true });
    doc.moveDown();

    // Add generated date
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Add content
    doc.fontSize(12).text(brd.content);

    doc.end();

    stream.on('finish', () => {
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
        // Clean up file after download
        fs.unlink(filepath, (err) => {
          if (err) console.error('Error cleaning up file:', err);
        });
      });
    });
  } catch (error) {
    console.error('Error exporting PDF:', error.message);
    res.status(500).json({ success: false, error: 'Failed to export PDF' });
  }
};

/**
 * Export BRD to plain text
 * GET /api/brd/:id/export-text
 */
exports.exportText = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const stmt = db.prepare('SELECT * FROM brd_documents WHERE id = ? AND user_id = ?');
    const brd = stmt.get(id, userId);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="BRD_${Date.now()}.txt"`);
    res.send(`${brd.title}\n\nGenerated: ${new Date().toLocaleString()}\n\n${brd.content}`);
  } catch (error) {
    console.error('Error exporting text:', error.message);
    res.status(500).json({ success: false, error: 'Failed to export text' });
  }
};
