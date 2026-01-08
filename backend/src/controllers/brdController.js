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
    const userIdStr = String(userId);
    const { skip = 0, limit = 20 } = req.query;

    const stmt = db.prepare(`
      SELECT id, title, content, version, created_at, updated_at 
      FROM brd_documents 
      WHERE user_id = ? 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `);

    const brds = stmt.all(userIdStr, parseInt(limit), parseInt(skip));

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM brd_documents WHERE user_id = ?');
    const { count } = countStmt.get(userIdStr);

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
    const userIdStr = String(req.user.id);

    const stmt = db.prepare(`
      SELECT * FROM brd_documents 
      WHERE id = ? AND user_id = ?
    `);

    const brd = stmt.get(id, userIdStr);

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
    const userIdStr = String(userId);
    const { story_ids = [], title, template = 'full', options = {} } = req.body;

    if (!story_ids || story_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one story is required' });
    }

    // Fetch user's AI configuration (fallback to env key if user config not set)
    const configStmt = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?');
    const config = configStmt.get(userIdStr);

    const envApiKey = process.env.OPENAI_API_KEY;
    let effectiveKey = null;

    if (config && config.api_key) {
      // Decrypt stored API key
      try {
        const crypto = require('crypto');
        const algorithm = 'aes-256-cbc';
        const secretKey = (process.env.ENCRYPTION_KEY || 'your-secret-key-change-in-production-32-chars!!')
          .slice(0, 32)
          .padEnd(32, '0');
        const parts = config.api_key.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = Buffer.from(parts[1], 'hex');

        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        effectiveKey = decrypted.toString();
      } catch (e) {
        return res.status(500).json({ success: false, error: 'Failed to decrypt API key' });
      }
    } else if (envApiKey) {
      // Fallback to backend .env key when no user-level config exists
      effectiveKey = envApiKey;
    } else {
      return res.status(400).json({
        success: false,
        error: 'AI configuration not set. Please configure OpenAI API key first.',
      });
    }

    // Initialize OpenAI
    if (!aiService.initializeOpenAI(effectiveKey)) {
      return res.status(500).json({ success: false, error: 'Failed to initialize AI service' });
    }

    // Handle Custom Template if applicable
    let templateContent = null;
    if (template && template.length > 20) { // Simple check for UUID length
      try {
        const tplStmt = db.prepare('SELECT content FROM templates WHERE id = ? AND (user_id = ? OR is_public = 1)');
        const customTpl = tplStmt.get(template, userIdStr);
        if (customTpl) {
          templateContent = customTpl.content;
          console.log(`[BRD_GEN] Using custom template: ${template}`);
        }
      } catch (err) {
        console.error('Error fetching custom template:', err);
      }
    }

    // Fetch selected user stories
    const placeholders = story_ids.map(() => '?').join(',');
    const storiesStmt = db.prepare(`
      SELECT id, title, description, acceptance_criteria, priority, status 
      FROM user_stories 
      WHERE id IN (${placeholders}) AND user_id = ?
    `);

    const stories = storiesStmt.all(...story_ids, userIdStr).map((story) => {
      // Normalize acceptance_criteria to an array for AI prompt formatting
      let criteria = story.acceptance_criteria;
      if (Array.isArray(criteria)) {
        // already array, keep as-is
      } else if (typeof criteria === 'string' && criteria.trim().length > 0) {
        // Try JSON parse first; fall back to splitting by newline/semicolon/comma
        try {
          const parsed = JSON.parse(criteria);
          if (Array.isArray(parsed)) {
            criteria = parsed;
          } else if (typeof parsed === 'string') {
            criteria = parsed.split(/\r?\n|;|,/).map((s) => s.trim()).filter(Boolean);
          }
        } catch (_) {
          criteria = criteria.split(/\r?\n|;|,/).map((s) => s.trim()).filter(Boolean);
        }
      } else {
        criteria = [];
      }

      return {
        ...story,
        acceptance_criteria: criteria,
      };
    });

    if (stories.length === 0) {
      return res.status(404).json({ success: false, error: 'No matching stories found' });
    }

    // Generate BRD using AI
    const generationOptions = {
      template,
      templateContent,
      language: (config && config.language) || 'en',
      detailLevel: (config && config.detail_level) || 'standard',
      maxTokens: (config && config.max_tokens) || 3000,
      temperature: (config && config.temperature) || 0.7,
    };

    const brdContent = await aiService.generateBRDFromStories(stories, generationOptions);

    // Save BRD to database
    const brdId = uuidv4();
    const insertStmt = db.prepare(`
      INSERT INTO brd_documents 
      (id, user_id, title, content, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertStmt.run(brdId, userIdStr, title || `BRD - ${new Date().toLocaleDateString()}`, brdContent, 1);

    // Log the action
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logStmt.run(userIdStr, 'CREATE', 'brd_document', brdId);

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
    const userIdStr = String(req.user.id);
    const { content, title } = req.body;

    // Get current BRD
    const getStmt = db.prepare('SELECT * FROM brd_documents WHERE id = ? AND user_id = ?');
    const brd = getStmt.get(id, userIdStr);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    // Update BRD
    const updateStmt = db.prepare(`
      UPDATE brd_documents 
      SET content = ?, title = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `);

    updateStmt.run(content || brd.content, title || brd.title, id, userIdStr);

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
    logStmt.run(userIdStr, 'UPDATE', 'brd_document', id);

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
    const userIdStr = String(req.user.id);

    // Check if BRD exists
    const checkStmt = db.prepare('SELECT id FROM brd_documents WHERE id = ? AND user_id = ?');
    if (!checkStmt.get(id, userIdStr)) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    // Delete versions
    db.prepare('DELETE FROM brd_versions WHERE brd_id = ?').run(id);

    // Delete BRD
    db.prepare('DELETE FROM brd_documents WHERE id = ? AND user_id = ?').run(id, userIdStr);

    // Log the action
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logStmt.run(userIdStr, 'DELETE', 'brd_document', id);

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
    const userIdStr = String(req.user.id);

    // Verify ownership
    const ownerStmt = db.prepare('SELECT user_id FROM brd_documents WHERE id = ?');
    const brd = ownerStmt.get(id);

    if (!brd || brd.user_id !== userIdStr) {
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
    const userIdStr = String(req.user.id);

    const stmt = db.prepare('SELECT * FROM brd_documents WHERE id = ? AND user_id = ?');
    const brd = stmt.get(id, userIdStr);

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
    const userIdStr = String(req.user.id);

    const stmt = db.prepare('SELECT * FROM brd_documents WHERE id = ? AND user_id = ?');
    const brd = stmt.get(id, userIdStr);

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

/**
 * AI Analyze BRD
 * GET /api/brd/:id/analyze
 */
exports.analyzeBRD = async (req, res) => {
  try {
    const { id } = req.params;
    const userIdStr = String(req.user.id);

    // 1. Get BRD
    const brd = db.prepare('SELECT content FROM brd_documents WHERE id = ? AND user_id = ?').get(id, userIdStr);
    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // 2. Check for existing analysis
    const existing = db.prepare('SELECT * FROM brd_analysis WHERE brd_id = ?').get(id);
    if (existing) {
      return res.json({
        success: true,
        data: {
          ...existing,
          strengths: JSON.parse(existing.strengths),
          gaps: JSON.parse(existing.gaps),
          suggestions: JSON.parse(existing.suggestions)
        }
      });
    }

    // 3. Get AI Config and Key
    const config = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?').get(userIdStr);
    if (!config || !config.api_key) {
      return res.status(400).json({ success: false, error: 'AI configuration not set' });
    }

    const { decryptKey } = require('../utils/encryption');
    const effectiveKey = decryptKey(config.api_key);

    if (!aiService.initializeOpenAI(effectiveKey)) {
      return res.status(500).json({ success: false, error: 'AI service initialization failed' });
    }

    const analysis = await aiService.analyzeBRD(brd.content);

    // 4. Save analysis for future
    try {
      db.prepare(`
        INSERT INTO brd_analysis (brd_id, score, risk_level, summary, strengths, gaps, suggestions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        analysis.score,
        analysis.risk_level,
        analysis.summary,
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.gaps),
        JSON.stringify(analysis.suggestions)
      );
    } catch (dbErr) {
      console.error('Failed to cache analysis:', dbErr.message);
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing BRD:', error.message);
    res.status(500).json({ success: false, error: 'Failed to analyze BRD' });
  }
};

/**
 * Convert BRD into User Stories (Reverse Engineering)
 * POST /api/brd/:id/convert-to-stories
 */
exports.convertToStories = async (req, res) => {
  try {
    const { id } = req.params;
    const userIdStr = String(req.user.id);

    // 1. Get BRD
    const brd = db.prepare('SELECT content FROM brd_documents WHERE id = ? AND user_id = ?').get(id, userIdStr);
    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // 2. Setup AI
    const config = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?').get(userIdStr);
    if (!config || !config.api_key) return res.status(400).json({ success: false, error: 'AI config missing' });

    const { decryptKey } = require('../utils/encryption');
    aiService.initializeOpenAI(decryptKey(config.api_key));

    // 3. Extract Stories
    const stories = await aiService.extractStoriesFromBRD(brd.content);

    // 4. Save to database (ai_stories table)
    const insertStmt = db.prepare(`
      INSERT INTO ai_stories (user_id, title, description, acceptance_criteria, priority, estimated_points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const savedStories = [];
    db.transaction(() => {
      for (const story of stories) {
        const result = insertStmt.run(
          userIdStr,
          story.title,
          story.description,
          JSON.stringify(story.acceptance_criteria || []),
          story.priority || 'P2',
          story.estimated_points || 0
        );
        savedStories.push({ ...story, id: result.lastInsertRowid });
      }
    })();

    res.json({
      success: true,
      message: `Successfully extracted ${savedStories.length} stories`,
      data: savedStories
    });
  } catch (error) {
    console.error('Error converting BRD to stories:', error.message);
    res.status(500).json({ success: false, error: 'Failed to extract stories' });
  }
};

/**
 * Get specific version content for comparison
 * GET /api/brd/:id/versions/:versionNumber
 */
exports.getVersionContent = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const userIdStr = String(req.user.id);

    const stmt = db.prepare(`
      SELECT v.content, b.title, v.version_number
      FROM brd_versions v
      JOIN brd_documents b ON v.brd_id = b.id
      WHERE v.brd_id = ? AND b.user_id = ? AND v.version_number = ?
    `);

    const version = stmt.get(id, userIdStr, versionNumber);
    if (!version) return res.status(404).json({ success: false, error: 'Version not found' });

    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error fetching version:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch version content' });
  }
};


