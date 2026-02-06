/**
 * BRD Generation Controller
 * Handles BRD generation from user stories using AI
 */

const { validationResult } = require('express-validator');
const pathLib = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const aiService = require('../services/aiService');
const notificationService = require('../services/notificationService');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { Document, Paragraph, HeadingLevel, TextRun, TableOfContents, Packer, AlignmentType, UnderlineType } = require('docx');
const MarkdownIt = require('markdown-it');
const excel = require('excel4node');
const { sqlite: db } = require('../db/connection');

/**
 * Decrypt API key from database
 */
function decryptApiKey(encryptedKey) {
  try {
    const secretKey = (process.env.ENCRYPTION_KEY || 'your-secret-key-change-in-production-32-chars!!').slice(0, 32).padEnd(32, '0');
    const [ivHex, cipherHex] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(cipherHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('API key decryption failed:', error.message);
    return null;
  }
}

/**
 * Get all BRDs for current user
 * GET /api/brd
 */
exports.listBRDs = async (req, res) => {
  try {
    const userId = req.user.id;
    const userIdStr = String(userId);
    const userIdInt = Number(userId);
    const { skip = 0, limit = 20 } = req.query;

    // Include documents the user owns, is assigned to review, or is a collaborator on
    // Include documents the user owns, is assigned to review, or is a collaborator on
    const stmt = db.prepare(`
      SELECT DISTINCT 
        b.id, b.user_id, b.title, b.content, b.version, b.status, b.assigned_to, b.created_at, b.updated_at,
        b.source_document_id, d.title as source_document_title,
        c.permission_level as collaborator_permission,
        CASE WHEN ra.assigned_to IS NOT NULL THEN 1 ELSE 0 END as is_reviewer_assignment
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      LEFT JOIN documents d ON d.id = b.source_document_id
      LEFT JOIN brd_review_assignments ra ON ra.brd_id = b.id AND ra.assigned_to = ? AND ra.status = 'pending'
      WHERE b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL OR ra.assigned_to IS NOT NULL
      ORDER BY b.updated_at DESC
      LIMIT ? OFFSET ?
    `);

    // Added userId for joining brd_review_assignments
    let brds = stmt.all(userIdStr, userIdInt, userIdStr, userIdInt, parseInt(limit), parseInt(skip));

    // Add a helper field for the frontend to know the user's role on this specific BRD
    brds = brds.map(brd => {
      let permission = 'view';
      if (brd.collaborator_permission) {
        // Team Role assigned explicitly - this takes priority
        permission = brd.collaborator_permission;
      } else if (brd.user_id && String(brd.user_id) === userIdStr) {
        permission = 'owner';
      } else if (req.user.role === 'admin') {
        permission = 'admin';
      } else if ((brd.assigned_to && Number(brd.assigned_to) === userIdInt) || brd.is_reviewer_assignment) {
        permission = 'reviewer';
      }

      // Safety check: Prevent viewers from being owners if their role is restricted
      if (permission === 'owner' && req.user.role === 'viewer') {
        console.warn(`[SECURITY] Viewer user ${userIdStr} identified as owner of BRD ${brd.id}. Forcing view-only.`);
        permission = 'view';
      }

      return { ...brd, user_permission: permission };
    });

    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT b.id) as count
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL
    `);
    const { count } = countStmt.get(userIdStr, userIdStr, userIdInt);

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
    const userIdStr = String(userId);
    const userIdInt = Number(userId);

    const stmt = db.prepare(`
      SELECT 
        b.*, 
        c.permission_level as collaborator_permission,
        u_owner.first_name as owner_first_name,
        u_owner.last_name as owner_last_name,
        u_appr.first_name as approver_first_name,
        u_appr.last_name as approver_last_name,
        ra.reviewer_signature,
        CASE WHEN ra_pending.assigned_to IS NOT NULL THEN 1 ELSE 0 END as is_reviewer_assignment
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      LEFT JOIN users u_owner ON b.user_id = u_owner.id
      LEFT JOIN users u_appr ON b.approved_by = u_appr.id
      LEFT JOIN brd_review_assignments ra ON ra.brd_id = b.id AND ra.assigned_to = b.assigned_to AND ra.status = 'approved'
      LEFT JOIN brd_review_assignments ra_pending ON ra_pending.brd_id = b.id AND ra_pending.assigned_to = ? AND ra_pending.status = 'pending'
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL OR ra_pending.assigned_to IS NOT NULL)
    `);

    const brd = stmt.get(userIdStr, userIdInt, id, userIdStr, userIdInt);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    // Add a helper field for the frontend
    let permission = 'view';
    if (brd.collaborator_permission) {
      // Team Role assigned explicitly
      permission = brd.collaborator_permission;
    } else if (brd.user_id && String(brd.user_id) === userIdStr) {
      permission = 'owner';
    } else if (req.user.role === 'admin') {
      permission = 'admin';
    } else if ((brd.assigned_to && Number(brd.assigned_to) === userIdInt) || brd.is_reviewer_assignment) {
      permission = 'reviewer';
    }

    brd.user_permission = permission;

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
    const userRole = req.user.role;

    // Strict validation: Only admin or analyst can generate BRDs
    if (userRole !== 'admin' && userRole !== 'analyst') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Your role does not have permission to generate protocols.' });
    }

    const {
      story_ids = [],
      title,
      template = 'full',
      target_audience,
      in_scope,
      out_of_scope,
      tone,
      selected_sections,
      external_links,
      stakeholders = [],
      group_id,
      options = {}
    } = req.body;

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
      maxTokens: (config && config.max_tokens) || 4000,
      temperature: (config && config.temperature) || 0.7,
      targetAudience: target_audience,
      inScope: in_scope,
      outOfScope: out_of_scope,
      tone: tone,
      selectedSections: selected_sections,
      externalLinks: external_links,
      stakeholders: stakeholders
    };

    const brdContent = await aiService.generateBRDFromStories(stories, generationOptions);

    // Save BRD to database
    const brdId = uuidv4();
    const insertStmt = db.prepare(`
      INSERT INTO brd_documents 
      (id, user_id, title, content, version, group_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertStmt.run(brdId, userIdStr, title || `BRD - ${new Date().toLocaleDateString()}`, brdContent, 1, group_id || null);

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
    const userId = req.user.id;
    const userIdStr = String(userId);
    const { content, title, group_id } = req.body;

    // Get current BRD and check if user is owner or collaborator with edit access
    const getStmt = db.prepare(`
      SELECT b.*, c.permission_level
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ?
    `);
    const brd = getStmt.get(userIdStr, id);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    const isOwner = String(brd.user_id) === userIdStr;
    const perms = (brd.permission_level || '').split(',');
    const isEditor = perms.includes('edit');
    const isAdminGlobal = req.user.role === 'admin';

    // Logic: If they are in collaborators table, ONLY that permission matters (Assignment wins)
    // If NOT in collaborators, then Owner or Admin can edit.
    let canEdit = false;
    if (brd.permission_level) {
      canEdit = isEditor; // Admin or not, if they are assigned as 'view' only, they can't edit
    } else {
      canEdit = isOwner || isAdminGlobal;
    }

    if (!canEdit) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You do not have permission to edit this BRD' });
    }

    // Check if approved
    if (brd.status === 'approved') {
      return res.status(400).json({ success: false, error: 'Approved BRDs cannot be modified' });
    }

    // Update BRD
    const updateStmt = db.prepare(`
      UPDATE brd_documents 
      SET content = ?, title = ?, group_id = COALESCE(?, group_id), version = version + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    // Fix group_id: treat empty string as null (or undefined to skip update via COALESCE)
    // If we pass NULL to COALESCE(?, group_id), it preserves current value.
    // If we truly wanted to UNSET the group, we'd need to pass explicit NULL and NOT use COALESCE, or handle it differently.
    // For now, assuming empty string means "no change provided" or "invalid input", so mapping to null/undefined results in NO CHANGE.
    const cleanGroupId = (group_id === '' || group_id === undefined) ? null : group_id;

    updateStmt.run(content || brd.content, title || brd.title, cleanGroupId, id);

    // Save to version history
    try {
      const versionStmt = db.prepare(`
        INSERT INTO brd_versions (brd_id, content, version_number, created_at)
        SELECT id, content, version, CURRENT_TIMESTAMP FROM brd_documents WHERE id = ?
      `);
      versionStmt.run(id);
    } catch (verErr) {
      console.error('Failed to save version history:', verErr.message);
    }

    // Log the action (Audit)
    try {
      const logStmt = db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      logStmt.run(userIdStr, 'UPDATE', 'brd_document', id);
    } catch (auditErr) {
      // audit_logs might not exist or schema mismatch
      console.warn('Audit log failed:', auditErr.message);
    }

    // Log the action (Activity)
    try {
      const activityBtn = db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, description, resource_type, resource_id, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      activityBtn.run(userIdStr, 'BRD_UPDATED', `Updated protocol: ${title || brd.title}`, 'brd_document', id);
    } catch (actErr) {
      console.warn('Activity log failed:', actErr.message);
    }

    res.json({
      success: true,
      message: 'BRD updated successfully',
    });
  } catch (error) {
    console.error('Error updating BRD:', error);
    res.status(500).json({ success: false, error: 'Failed to update BRD: ' + error.message });
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

    // Check if user has permission (Assignment wins, then Owner/Admin)
    const checkStmt = db.prepare(`
      SELECT b.id, b.user_id, c.permission_level
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ?
    `);
    const brd = checkStmt.get(userIdStr, id);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    const isAdminGlobal = req.user.role === 'admin';
    const isOwner = String(brd.user_id) === userIdStr;
    const teamPerms = (brd.permission_level || '').split(',');

    let canDelete = false;
    if (brd.permission_level) {
      // If assigned in team, strictly follow that. (Only 'admin' level in collaborators can delete)
      canDelete = teamPerms.includes('admin') || teamPerms.includes('owner');
    } else {
      // If not in team, Owner or Global Admin can delete
      canDelete = isOwner || isAdminGlobal;
    }

    // Critical check: Viewer role is NEVER allowed to delete unless explicitly upgraded in team
    if (req.user.role === 'viewer' && !teamPerms.includes('admin')) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Viewers cannot delete protocols.' });
    }

    if (!canDelete) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You do not have permission to delete this protocol' });
    }

    // Manual cleanup of tables that might not have ON DELETE CASCADE or to be extra safe
    db.transaction(() => {
      // 1. Delete linked diagrams
      db.prepare('DELETE FROM brd_diagrams WHERE brd_id = ?').run(id);

      // 2. Delete estimations
      db.prepare('DELETE FROM brd_estimations WHERE brd_id = ?').run(id);

      // 3. Delete analysis
      db.prepare('DELETE FROM brd_analysis WHERE brd_id = ?').run(id);

      // 4. Delete versions
      db.prepare('DELETE FROM brd_versions WHERE brd_id = ?').run(id);

      // 5. Finally delete the document (this should trigger remaining cascades like comments)
      db.prepare('DELETE FROM brd_documents WHERE id = ?').run(id);
    })();

    // Log the action
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
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

    const userIdInt = Number(req.user.id);

    // Verify access (Owner, assigned reviewer, or collaborator)
    const accessStmt = db.prepare(`
      SELECT b.id 
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL)
    `);
    const brd = accessStmt.get(userIdStr, id, userIdStr, userIdInt);

    if (!brd) {
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
 * Extract headings from markdown content
 */
function extractHeadings(content) {
  const lines = content.split(/\r?\n/);
  const headings = [];
  lines.forEach((line, index) => {
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ level, text, line: index });
    }
  });
  return headings;
}

/**
 * Export BRD to PDF with Table of Contents
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

    // Extract headings for ToC
    const headings = extractHeadings(brd.content);

    // Create PDF
    const doc = new PDFDocument({ bufferPages: true });
    const filename = `BRD_${brd.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    const filepath = pathLib.join(__dirname, '../../uploads', filename);

    // Ensure uploads directory exists
    if (!fs.existsSync(pathLib.dirname(filepath))) {
      fs.mkdirSync(pathLib.dirname(filepath), { recursive: true });
    }

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // --- Professional Styles ---
    const primaryColor = '#4f46e5';
    const secondaryColor = '#64748b';
    const textColor = '#1e293b';

    // --- Cover Page ---
    doc.rect(0, 0, doc.page.width, 40).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(14).text('BUSINESS REQUIREMENTS DOCUMENT', 40, 14, { characterSpacing: 1 });

    doc.moveDown(4);
    doc.fillColor(textColor).fontSize(26).font('Helvetica-Bold').text(brd.title.toUpperCase(), { align: 'left' });
    doc.rect(40, doc.y + 5, 80, 2).fill(primaryColor);

    doc.moveDown(2);
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica').text('SYSTEM GENERATED | INTELLIGENCE STUDIO');
    doc.moveDown(0.5);
    doc.text(`VERSION: ${brd.version || 1}  |  DATE: ${new Date().toLocaleDateString()}`);

    // --- Table of Contents ---
    if (headings.length > 0) {
      doc.addPage();
      doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('TABLE OF CONTENTS', { underline: true });
      doc.moveDown(2);

      headings.forEach((heading, idx) => {
        const indent = (heading.level - 1) * 15;
        const dotLeader = '.'.repeat(Math.max(0, 60 - heading.text.length - indent / 2));

        doc.fillColor(textColor).fontSize(10).font('Helvetica');
        doc.text(`${' '.repeat(indent)}${idx + 1}. ${heading.text} ${dotLeader} ${idx + 2}`, {
          continued: false,
          lineGap: 3
        });
      });

      doc.addPage();
    }

    // --- Document Body with Styled Headings ---
    const lines = brd.content.split(/\r?\n/);
    lines.forEach(line => {
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();

        doc.moveDown(level === 1 ? 2 : 1);
        const fontSize = level === 1 ? 18 : level === 2 ? 16 : 14;
        doc.fillColor(primaryColor).fontSize(fontSize).font('Helvetica-Bold').text(text);
        doc.moveDown(0.5);
      } else if (line.trim()) {
        // Regular text
        doc.fillColor(textColor).fontSize(11).font('Helvetica').text(line, {
          align: 'justify',
          lineGap: 2
        });
      } else {
        doc.moveDown(0.5);
      }
    });

    // Add page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fillColor(secondaryColor).fontSize(9).text(
        `Page ${i + 1} of ${pages.count}`,
        doc.page.width - 100,
        doc.page.height - 30,
        { align: 'right' }
      );
    }

    doc.end();

    stream.on('finish', () => {
      res.download(filepath, filename, (err) => {
        if (err) console.error('Error downloading file:', err);
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
 * Export BRD to DOCX with Table of Contents
 * POST /api/brd/:id/export-docx
 */
exports.exportDOCX = async (req, res) => {
  try {
    const { id } = req.params;
    const userIdStr = String(req.user.id);

    const stmt = db.prepare('SELECT * FROM brd_documents WHERE id = ? AND user_id = ?');
    const brd = stmt.get(id, userIdStr);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    // Parse markdown content
    const lines = brd.content.split(/\r?\n/);
    const docSections = [];

    // Add title page
    docSections.push(
      new Paragraph({
        text: brd.title.toUpperCase(),
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Version ${brd.version || 1}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `Generated: ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: 'BUSINESS REQUIREMENTS DOCUMENT',
        alignment: AlignmentType.CENTER,
        bold: true,
        spacing: { after: 200 }
      })
    );

    // Add Table of Contents
    docSections.push(
      new Paragraph({
        text: 'TABLE OF CONTENTS',
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true
      }),
      new TableOfContents('Table of Contents', {
        hyperlink: true,
        headingStyleRange: '1-3'
      })
    );

    // Add page break before content
    docSections.push(
      new Paragraph({
        text: '',
        pageBreakBefore: true
      })
    );

    // Parse and add content
    lines.forEach(line => {
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        const headingLevel = level === 1 ? HeadingLevel.HEADING_1 :
          level === 2 ? HeadingLevel.HEADING_2 :
            level === 3 ? HeadingLevel.HEADING_3 :
              level === 4 ? HeadingLevel.HEADING_4 :
                level === 5 ? HeadingLevel.HEADING_5 : HeadingLevel.HEADING_6;

        docSections.push(
          new Paragraph({
            text: text,
            heading: headingLevel,
            spacing: { before: 240, after: 120 }
          })
        );
      } else if (line.trim()) {
        // Regular paragraph
        docSections.push(
          new Paragraph({
            text: line,
            spacing: { after: 120 }
          })
        );
      }
    });

    // Create document
    const docFile = new Document({
      sections: [{
        properties: {},
        children: docSections
      }]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(docFile);
    const filename = `BRD_${brd.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.docx`;
    const filepath = pathLib.join(__dirname, '../../uploads', filename);

    // Write to file
    fs.writeFileSync(filepath, buffer);

    // Send file
    res.download(filepath, filename, (err) => {
      if (err) console.error('Error downloading file:', err);
      fs.unlink(filepath, (err) => {
        if (err) console.error('Error cleaning up file:', err);
      });
    });
  } catch (error) {
    console.error('Error exporting DOCX:', error.message);
    res.status(500).json({ success: false, error: 'Failed to export DOCX' });
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
 * Export BRD to Excel
 * POST /api/brd/:id/export-excel
 */
exports.exportExcel = async (req, res) => {
  try {
    const { id } = req.params;
    const userIdStr = String(req.user.id);

    const stmt = db.prepare('SELECT * FROM brd_documents WHERE id = ? AND user_id = ?');
    const brd = stmt.get(id, userIdStr);

    if (!brd) {
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('BRD Content');

    // Define styles
    const headerStyle = workbook.createStyle({
      font: { color: '#FFFFFF', bold: true, size: 12 },
      fill: { type: 'pattern', patternType: 'solid', fgColor: '#4F46E5' },
      alignment: { horizontal: 'center', vertical: 'center' }
    });

    const bodyStyle = workbook.createStyle({
      alignment: { wrapText: true, vertical: 'top' }
    });

    // Set headers
    worksheet.cell(1, 1).string('Section Title').style(headerStyle);
    worksheet.cell(1, 2).string('Content Description').style(headerStyle);

    // Set column widths
    worksheet.column(1).setWidth(30);
    worksheet.column(2).setWidth(80);

    // Parse content to extract sections
    const lines = brd.content.split(/\r?\n/);
    let currentRow = 2;
    let currentSection = 'Introduction';
    let currentContent = [];

    lines.forEach((line) => {
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (headingMatch) {
        // If we have a previous section, write it
        if (currentContent.length > 0 || currentSection !== 'Introduction') {
          worksheet.cell(currentRow, 1).string(currentSection).style(bodyStyle);
          worksheet.cell(currentRow, 2).string(currentContent.join('\n') || 'N/A').style(bodyStyle);
          currentRow++;
          currentContent = [];
        }
        currentSection = headingMatch[2].trim();
      } else if (line.trim()) {
        currentContent.push(line.trim());
      }
    });

    // Write the last section
    if (currentContent.length > 0 || currentSection !== 'Introduction') {
      worksheet.cell(currentRow, 1).string(currentSection).style(bodyStyle);
      worksheet.cell(currentRow, 2).string(currentContent.join('\n') || 'N/A').style(bodyStyle);
    }

    const filename = `BRD_${brd.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
    const filepath = pathLib.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(pathLib.dirname(filepath))) {
      fs.mkdirSync(pathLib.dirname(filepath), { recursive: true });
    }

    workbook.write(filepath, (err, stats) => {
      if (err) {
        console.error('Excel write error:', err);
        return res.status(500).json({ success: false, error: 'Failed to generate Excel' });
      }
      res.download(filepath, filename, (downloadErr) => {
        if (downloadErr) console.error('Error downloading file:', downloadErr);
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Error cleaning up file:', unlinkErr);
        });
      });
    });
  } catch (error) {
    console.error('Error exporting Excel:', error.message);
    res.status(500).json({ success: false, error: 'Failed to export Excel' });
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
    const userIdInt = Number(req.user.id);

    console.log(`[analyzeBRD] Checking permissions for BRD ${id}, user ${userIdStr}`);

    // 1. Get BRD with permissions check (similar to getBRD)
    const brd = db.prepare(`
      SELECT b.id, b.user_id, b.content, b.assigned_to, c.permission_level as collaborator_permission
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL)
    `).get(userIdStr, id, userIdStr, userIdInt);

    if (!brd) {
      console.log(`[analyzeBRD] BRD not found or unauthorized: ${id}`);
      return res.status(404).json({ success: false, error: 'BRD not found' });
    }

    // 2. Check for existing analysis
    const existing = db.prepare('SELECT * FROM brd_analysis WHERE brd_id = ?').get(id);
    const trigger = req.query.trigger === 'true';

    if (existing) {
      console.log(`[analyzeBRD] Returning cached analysis for BRD ${id}`);
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

    // If not triggering, just return success with null data
    if (!trigger) {
      return res.json({ success: true, data: null });
    }

    // 3. Permission to trigger NEW AI analysis: Only owner or edit collaborators
    let canTrigger = false;
    if (String(brd.user_id) === userIdStr) canTrigger = true;
    else if (brd.collaborator_permission === 'edit') canTrigger = true;

    if (!canTrigger) {
      return res.status(403).json({ success: false, error: 'Only owners or editors can trigger AI analysis.' });
    }

    if (!brd.content || brd.content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'BRD has no content to analyze' });
    }

    // 4. Get AI Config and Key
    console.log(`[analyzeBRD] Fetching AI config for user ${userIdStr}`);
    const config = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?').get(userIdStr);

    const envApiKey = process.env.OPENAI_API_KEY;
    let effectiveKey = null;

    if (config && config.api_key) {
      const { decryptKey } = require('../utils/encryption');
      try {
        effectiveKey = decryptKey(config.api_key);
      } catch (e) {
        return res.status(500).json({ success: false, error: 'Failed to decrypt API key' });
      }
    } else if (envApiKey) {
      effectiveKey = envApiKey;
    } else {
      return res.status(400).json({ success: false, error: 'AI configuration not found. Please configure OpenAI API key.' });
    }

    if (!aiService.initializeOpenAI(effectiveKey)) {
      return res.status(500).json({ success: false, error: 'AI service initialization failed' });
    }

    console.log(`[analyzeBRD] Calling AI service to analyze BRD...`);
    const analysis = await aiService.analyzeBRD(brd.content);

    // 5. Save analysis for future
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
      console.error('[analyzeBRD] Failed to cache analysis:', dbErr.message);
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('[analyzeBRD] Error:', error.message);
    console.error('[analyzeBRD] Stack:', error.stack);
    res.status(500).json({ success: false, error: `Failed to analyze BRD: ${error.message}` });
  }
};

/**
 * Estimate BRD Effort
 * GET /api/brd/:id/estimate
 */
exports.estimateBRD = async (req, res) => {
  try {
    const { id } = req.params;
    const userIdStr = String(req.user.id);
    const userIdInt = Number(req.user.id);

    // 1. Get BRD with permissions
    const brd = db.prepare(`
      SELECT b.id, b.user_id, b.content, b.assigned_to, c.permission_level as collaborator_permission
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL)
    `).get(userIdStr, id, userIdStr, userIdInt);

    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // 2. Check Cache
    const existing = db.prepare('SELECT * FROM brd_estimations WHERE brd_id = ?').get(id);
    const trigger = req.query.trigger === 'true';

    if (existing) {
      return res.json({
        success: true,
        data: {
          ...existing,
          recommended_team: JSON.parse(existing.recommended_team),
          key_challenges: JSON.parse(existing.key_challenges)
        }
      });
    }

    // If not triggering, return null
    if (!trigger) {
      return res.json({ success: true, data: null });
    }

    // 3. Permission to trigger NEW AI estimation
    let canTrigger = false;
    if (String(brd.user_id) === userIdStr) canTrigger = true;
    else if (brd.collaborator_permission === 'edit') canTrigger = true;

    if (!canTrigger) {
      return res.status(403).json({ success: false, error: 'Only owners or editors can trigger AI estimation.' });
    }

    if (!brd.content || brd.content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'BRD has no content to estimate effort from' });
    }

    // 4. Setup AI
    const config = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?').get(userIdStr);
    const envApiKey = process.env.OPENAI_API_KEY;
    let effectiveKey = null;

    if (config && config.api_key) {
      const { decryptKey } = require('../utils/encryption');
      try {
        effectiveKey = decryptKey(config.api_key);
      } catch (decryptErr) {
        return res.status(500).json({ success: false, error: 'Failed to decrypt API key' });
      }
    } else if (envApiKey) {
      effectiveKey = envApiKey;
    } else {
      return res.status(400).json({
        success: false,
        error: 'AI configuration not found. Please configure your OpenAI API key.'
      });
    }

    aiService.initializeOpenAI(effectiveKey);

    // 5. Estimate Effort
    const estimate = await aiService.estimateProjectEffort(brd.content);

    // 6. Cache it
    try {
      db.prepare(`
        INSERT INTO brd_estimations (brd_id, man_hours, complexity_score, estimated_duration, recommended_team, key_challenges, rationale)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        estimate.man_hours,
        estimate.complexity_score,
        estimate.estimated_duration,
        JSON.stringify(estimate.recommended_team),
        JSON.stringify(estimate.key_challenges),
        estimate.rationale
      );
    } catch (dbErr) {
      console.error('[estimateBRD] Failed to cache estimation:', dbErr.message);
    }

    res.json({
      success: true,
      data: estimate
    });
  } catch (error) {
    console.error('[estimateBRD] Error:', error.message);
    res.status(500).json({ success: false, error: `Failed to estimate BRD: ${error.message}` });
  }
};

/**
 * Convert BRD into User Stories (Reverse Engineering)
 * POST /api/brd/:id/convert-to-stories
 */
exports.convertToStories = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const userIdStr = String(req.user.id);

    // 1. Get BRD
    const brd = db.prepare('SELECT content FROM brd_documents WHERE id = ? AND user_id = ?').get(id, userIdStr);
    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    if (!brd.content || brd.content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'BRD has no content to extract stories from' });
    }

    // 2. Setup AI
    const config = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?').get(userIdStr);
    if (!config || !config.api_key) {
      return res.status(400).json({
        success: false,
        error: 'AI configuration not found. Please configure your OpenAI API key in Settings.'
      });
    }

    const { decryptKey } = require('../utils/encryption');
    try {
      aiService.initializeOpenAI(decryptKey(config.api_key));
    } catch (decryptErr) {
      console.error('Error decrypting API key:', decryptErr);
      return res.status(500).json({ success: false, error: 'Failed to decrypt API key' });
    }

    // 3. Extract Stories
    const stories = await aiService.extractStoriesFromBRD(brd.content);

    if (!stories || stories.length === 0) {
      return res.json({
        success: true,
        message: 'No user stories could be extracted from this BRD',
        data: []
      });
    }

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

    const userIdInt = Number(req.user.id);

    const stmt = db.prepare(`
      SELECT v.content, b.title, v.version_number
      FROM brd_versions v
      JOIN brd_documents b ON v.brd_id = b.id
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE v.brd_id = ? AND v.version_number = ? 
      AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL)
    `);

    const version = stmt.get(userIdStr, id, versionNumber, userIdStr, userIdInt);
    if (!version) return res.status(404).json({ success: false, error: 'Version not found' });

    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error fetching version:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch version content' });
  }
};

// ============ WORKFLOW ENDPOINTS ============

/**
 * Request review for a BRD (draft → in-review)
 */
exports.requestReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to, reason, signature } = req.body;
    const userId = req.user.id;

    const userIdStr = String(userId);

    // Check if BRD exists and user has permission (Owner or Editor)
    const getStmt = db.prepare(`
      SELECT b.*, c.permission_level
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ?
    `);
    const brd = getStmt.get(userIdStr, id);

    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    const isOwner = String(brd.user_id) === userIdStr;
    const isEditor = brd.permission_level === 'edit' || brd.permission_level === 'admin';

    if (!isOwner && !isEditor) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only the owner or editors can request review' });
    }

    // Can only request review if status is 'draft'
    if (brd.status !== 'draft') {
      return res.status(400).json({ success: false, error: `Cannot request review for BRD with status "${brd.status}"` });
    }

    // Handle multiple assignees
    const assignees = Array.isArray(assigned_to) ? assigned_to : [assigned_to];
    const validAssignees = assignees.filter(id => id).map(id => Number(id)); // Ensure numbers

    if (validAssignees.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one reviewer is required' });
    }

    const primaryAssignee = validAssignees[0];

    // Transaction to update everything safely
    db.transaction(() => {
      // 1. Update BRD status
      // We keep 'assigned_to' in brd_documents pointing to the PRIMARY (first) reviewer for backward compatibility
      const updateStmt = db.prepare(`
        UPDATE brd_documents 
        SET status = 'in-review', assigned_to = ?, requester_signature = ?, request_review_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(primaryAssignee, signature || null, id);

      // 2. Record in workflow history
      const historyStmt = db.prepare(`
        INSERT INTO brd_workflow_history (brd_id, from_status, to_status, changed_by, reason, signature)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      historyStmt.run(id, 'draft', 'in-review', userId, reason || 'Requested for review', signature || null);

      // 3. Create review assignments (Clear ALL old assignments to start a fresh round)
      db.prepare("DELETE FROM brd_review_assignments WHERE brd_id = ?").run(id);

      const assignStmt = db.prepare(`
        INSERT INTO brd_review_assignments (brd_id, assigned_to, assigned_by, status)
        VALUES (?, ?, ?, 'pending')
      `);

      for (const assigneeId of validAssignees) {
        assignStmt.run(id, assigneeId, userId);
      }
    })();

    res.json({ success: true, message: 'Review requested successfully', data: { status: 'in-review' } });

    // Log to activity_logs
    try {
      db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, description, resource_type, resource_id, created_at)
        VALUES (?, 'REVIEW_REQUESTED', ?, 'brd_document', ?, CURRENT_TIMESTAMP)
      `).run(userId, reason || `Requested review from ${validAssignees.length} reviewers`, id);
    } catch (e) { console.error('Activity log error:', e); }

    // Send notifications
    try {
      // Notify all assignees
      Promise.all(validAssignees.map(assigneeId =>
        notificationService.notify(assigneeId, 'REVIEW_REQUESTED', {
          actor_id: userId,
          actor_name: req.user.name || req.user.username,
          brd_title: brd.title,
          resource_id: id,
          resource_type: 'brd_document'
        }).catch(err => console.error(`Failed to notify user ${assigneeId}:`, err))
      ));
    } catch (nErr) { console.error('Notification error:', nErr.message); }

  } catch (error) {
    console.error('Error requesting review:', error.message);
    res.status(500).json({ success: false, error: 'Failed to request review' });
  }
};

/**
 * Approve a BRD (in-review → approved)
 */
exports.approveBRD = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, signature } = req.body;
    const userId = req.user.id;

    // Check if BRD exists
    const brd = db.prepare(`SELECT * FROM brd_documents WHERE id = ?`).get(id);
    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // Check if user has a pending review
    const assignment = db.prepare('SELECT * FROM brd_review_assignments WHERE brd_id = ? AND assigned_to = ? AND status = ?').get(id, userId, 'pending');

    if (!assignment) {
      return res.status(403).json({ success: false, error: 'You do not have a pending review for this BRD' });
    }

    // Can only approve if status is 'in-review'
    if (brd.status !== 'in-review') {
      return res.status(400).json({ success: false, error: `Cannot approve BRD with status "${brd.status}"` });
    }

    let isFullyApproved = false;

    // Transaction
    db.transaction(() => {
      // 1. Update review assignment
      const assignStmt = db.prepare(`
        UPDATE brd_review_assignments 
        SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewer_signature = ?
        WHERE brd_id = ? AND assigned_to = ?
      `);
      assignStmt.run(signature || null, id, userId);

      // 2. Check for remaining pending reviews
      const pendingCount = db.prepare("SELECT COUNT(*) as count FROM brd_review_assignments WHERE brd_id = ? AND status = 'pending'").get(id).count;

      if (pendingCount === 0) {
        // All reviews completed. Since we are in approveBRD, we assume no rejections pending (rejection strictly resets to draft)
        isFullyApproved = true;

        // 3. Update BRD status to approved
        const updateStmt = db.prepare(`
          UPDATE brd_documents 
          SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        updateStmt.run(userId, id); // Use current approver as the final sign-off person in main table

        // 4. Record workflow history
        const historyStmt = db.prepare(`
          INSERT INTO brd_workflow_history (brd_id, from_status, to_status, changed_by, reason, signature)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        historyStmt.run(id, 'in-review', 'approved', userId, 'All reviewers approved', signature || null);
      } else {
        // Just record this specific approval in history but keep status 'in-review'
        const historyStmt = db.prepare(`
          INSERT INTO brd_workflow_history (brd_id, from_status, to_status, changed_by, reason, signature)
          VALUES (?, 'in-review', 'in-review', ?, ?, ?)
        `);
        historyStmt.run(id, userId, reason || `Reviewer ${userId} approved (Waiting for others)`, signature || null);
      }
    })();

    if (isFullyApproved) {
      res.json({ success: true, message: 'BRD approved successfully', data: { status: 'approved' } });

      // Log
      try {
        db.prepare(`
          INSERT INTO activity_logs (user_id, action_type, description, resource_type, resource_id, created_at)
          VALUES (?, 'APPROVED', ?, 'brd_document', ?, CURRENT_TIMESTAMP)
        `).run(userId, reason || 'Protocol approved by all reviewers', id);
      } catch (e) { console.error('Activity log error:', e); }

      // Notify Owner
      try {
        await notificationService.notify(brd.user_id, 'BRD_APPROVED', {
          actor_id: userId,
          actor_name: req.user.name || req.user.username,
          brd_title: brd.title,
          resource_id: id,
          resource_type: 'brd_document'
        });
      } catch (nErr) { console.error('Notification error:', nErr.message); }

    } else {
      res.json({ success: true, message: 'Approval recorded. Waiting for other reviewers.', data: { status: 'in-review' } });

      // Notify Owner of partial approval
      try {
        await notificationService.notify(brd.user_id, 'BRD_REVIEW_UPDATE', { // Assuming this type exists or will be generic
          actor_id: userId,
          actor_name: req.user.name || req.user.username,
          brd_title: brd.title,
          resource_id: id,
          resource_type: 'brd_document',
          message: 'approved the document'
        });
      } catch (nErr) { console.error('Notification error:', nErr.message); }
    }

  } catch (error) {
    console.error('Error approving BRD:', error.message);
    res.status(500).json({ success: false, error: 'Failed to approve BRD' });
  }
};

/**
 * Re-assign a BRD (in-review -> in-review with new assignee)
 */
exports.reassignBRD = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to, reason } = req.body;
    const userId = req.user.id;
    const userIdStr = String(userId);

    if (!assigned_to) {
      return res.status(400).json({ success: false, error: 'New assignee is required' });
    }

    // Check if BRD exists and user has permission (Owner or Editor)
    const getStmt = db.prepare(`
      SELECT b.*, c.permission_level, u.first_name, u.last_name
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      LEFT JOIN users u ON u.id = ?
      WHERE b.id = ?
    `);
    const brd = getStmt.get(userIdStr, assigned_to, id);

    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // Validate new assignee exists
    if (!brd.first_name) { // 'u' join was filtered by assigned_to
      const userCheck = db.prepare('SELECT id FROM users WHERE id = ?').get(assigned_to);
      if (!userCheck) return res.status(400).json({ success: false, error: 'New assignee user not found' });
    }

    const isOwner = String(brd.user_id) === userIdStr;
    const isEditor = brd.permission_level === 'edit' || brd.permission_level === 'admin';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isEditor && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only the owner, editors, or admins can re-assign review' });
    }

    // Can only re-assign if status is 'in-review'
    if (brd.status !== 'in-review') {
      return res.status(400).json({ success: false, error: `Cannot re-assign BRD with status "${brd.status}"` });
    }

    if (String(brd.assigned_to) === String(assigned_to)) {
      return res.status(400).json({ success: false, error: 'User is already assigned to this BRD' });
    }

    const oldAssignee = brd.assigned_to;

    // Transaction to update everything safely
    db.transaction(() => {
      // 1. Update BRD status
      const updateStmt = db.prepare(`
        UPDATE brd_documents 
        SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(assigned_to, id);

      // 2. Record in workflow history
      const historyStmt = db.prepare(`
        INSERT INTO brd_workflow_history (brd_id, from_status, to_status, changed_by, reason)
        VALUES (?, 'in-review', 'in-review', ?, ?)
      `);
      historyStmt.run(id, userId, reason || `Re-assigned from user ${oldAssignee} to ${assigned_to}`);

      // 3. Cancel old assignment
      if (oldAssignee) {
        // Only cancel PENDING reviews for this BRD and user
        db.prepare(`
          UPDATE brd_review_assignments 
          SET status = 'cancelled', reviewed_at = CURRENT_TIMESTAMP
          WHERE brd_id = ? AND assigned_to = ? AND status = 'pending'
        `).run(id, oldAssignee);
      }

      // 4. Create new assignment (Use REPLACE to handle if this user was previously assigned/cancelled)
      const assignStmt = db.prepare(`
        INSERT OR REPLACE INTO brd_review_assignments (brd_id, assigned_to, assigned_by, status)
        VALUES (?, ?, ?, 'pending')
      `);
      assignStmt.run(id, assigned_to, userId);
    })();

    res.json({ success: true, message: 'BRD re-assigned successfully', data: { status: 'in-review', assigned_to } });

    // Log to activity_logs
    try {
      db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, description, resource_type, resource_id, created_at)
        VALUES (?, 'REVIEW_REASSIGNED', ?, 'brd_document', ?, CURRENT_TIMESTAMP)
      `).run(userId, `Re-assigned review to user ${assigned_to}`, id);
    } catch (e) { console.error('Activity log error:', e); }

    // Send notification to NEW Assigned Reviewer
    try {
      await notificationService.notify(assigned_to, 'REVIEW_REQUESTED', {
        actor_id: userId,
        actor_name: req.user.name || req.user.username,
        brd_title: brd.title,
        resource_id: id,
        resource_type: 'brd_document'
      });
    } catch (nErr) { console.error('Notification error:', nErr.message); }

  } catch (error) {
    console.error('Error re-assigning BRD:', error.message);
    res.status(500).json({ success: false, error: 'Failed to re-assign BRD' });
  }
};

/**
 * Reject a BRD (in-review → draft with feedback)
 */
exports.rejectBRD = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Check if BRD exists
    const brd = db.prepare(`SELECT * FROM brd_documents WHERE id = ?`).get(id);
    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // Check if user has a pending review
    const assignment = db.prepare('SELECT * FROM brd_review_assignments WHERE brd_id = ? AND assigned_to = ? AND status = ?').get(id, userId, 'pending');

    if (!assignment) {
      return res.status(403).json({ success: false, error: 'You do not have a pending review for this BRD' });
    }

    // Can only reject if status is 'in-review'
    if (brd.status !== 'in-review') {
      return res.status(400).json({ success: false, error: `Cannot reject BRD with status "${brd.status}"` });
    }

    // Transaction
    db.transaction(() => {
      // 1. Update THIS assignment to rejected
      const assignStmt = db.prepare(`
        UPDATE brd_review_assignments 
        SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, comment = ?
        WHERE brd_id = ? AND assigned_to = ?
      `);
      assignStmt.run(reason || '', id, userId);

      // 2. Cancel all other pending assignments (Strict consensus: one rejection stops the flow)
      const cancelStmt = db.prepare(`
        UPDATE brd_review_assignments 
        SET status = 'cancelled', reviewed_at = CURRENT_TIMESTAMP
        WHERE brd_id = ? AND status = 'pending' AND assigned_to != ?
      `);
      cancelStmt.run(id, userId);

      // 3. Update BRD status back to draft
      const updateStmt = db.prepare(`
        UPDATE brd_documents 
        SET status = 'draft', assigned_to = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(id);

      // 4. Record in workflow history
      const historyStmt = db.prepare(`
        INSERT INTO brd_workflow_history (brd_id, from_status, to_status, changed_by, reason)
        VALUES (?, ?, ?, ?, ?)
      `);
      historyStmt.run(id, 'in-review', 'draft', userId, reason || 'Rejected for revisions');
    })();

    res.json({ success: true, message: 'BRD rejected for revisions', data: { status: 'draft' } });

    // Log to activity_logs
    try {
      db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, description, resource_type, resource_id, created_at)
        VALUES (?, 'REJECTED', ?, 'brd_document', ?, CURRENT_TIMESTAMP)
      `).run(userId, reason || 'Rejected for revisions', id);
    } catch (e) { console.error('Activity log error:', e); }

    // Send notification to BRD Owner
    try {
      await notificationService.notify(brd.user_id, 'BRD_REJECTED', {
        actor_id: userId,
        actor_name: req.user.name || req.user.username,
        brd_title: brd.title,
        resource_id: id,
        resource_type: 'brd_document'
      });
    } catch (nErr) { console.error('Notification error:', nErr.message); }
  } catch (error) {
    console.error('Error rejecting BRD:', error.message);
    res.status(500).json({ success: false, error: 'Failed to reject BRD' });
  }
};

/**
 * Get workflow history for a BRD
 */
exports.getWorkflowHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user has access to BRD (Owner, assigned reviewer, or collaborator)
    const userIdStr = String(userId);
    const userIdInt = Number(userId);
    const brd = db.prepare(`
      SELECT b.id 
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      LEFT JOIN brd_review_assignments ra ON ra.brd_id = b.id AND ra.assigned_to = ?
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL OR ra.assigned_to IS NOT NULL)
    `).get(userIdStr, userIdInt, id, userIdStr, userIdInt);

    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    const stmt = db.prepare(`
      SELECT 
        h.*,
        u.first_name,
        u.last_name,
        u.email
      FROM brd_workflow_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.brd_id = ?
      ORDER BY h.created_at DESC
    `);

    const history = stmt.all(id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching workflow history:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch workflow history' });
  }
};

/**
 * Get review assignments for a BRD
 */
exports.getReviewAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user has access to BRD
    const brd = db.prepare(`
      SELECT b.id
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      LEFT JOIN brd_review_assignments ra ON ra.brd_id = b.id AND ra.assigned_to = ?
      WHERE b.id = ? AND (b.user_id = ? OR c.user_id IS NOT NULL OR ra.assigned_to IS NOT NULL)
    `).get(String(userId), Number(userId), id, String(userId));
    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    const stmt = db.prepare(`
      SELECT 
        a.*,
        u.first_name as assigned_to_first_name,
        u.last_name as assigned_to_last_name,
        u.email as assigned_to_email
      FROM brd_review_assignments a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.brd_id = ?
      ORDER BY a.assigned_at DESC
    `);

    const assignments = stmt.all(id);
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching review assignments:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch review assignments' });
  }
};

/**
 * Assign reviewers to a BRD
 */
exports.assignReviewers = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer_ids } = req.body;
    const userId = req.user.id;

    // Check if user is owner or editor
    const brd = db.prepare(`
      SELECT b.*, c.permission_level
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ? AND (b.user_id = ? OR c.permission_level LIKE '%edit%')
    `).get(String(userId), id, String(userId));

    if (!brd) {
      return res.status(403).json({ success: false, error: 'Unauthorized to assign reviewers' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO brd_review_assignments (brd_id, assigned_to, assigned_by, status)
      VALUES (?, ?, ?, 'pending')
    `);

    const assignments = [];
    for (const reviewerId of reviewer_ids) {
      const existing = db.prepare(`
        SELECT id FROM brd_review_assignments
        WHERE brd_id = ? AND assigned_to = ? AND status = 'pending'
      `).get(id, reviewerId);

      if (!existing) {
        const result = insertStmt.run(id, reviewerId, userId);
        assignments.push({
          id: result.lastInsertRowid,
          brd_id: id,
          assigned_to: reviewerId,
          assigned_by: userId,
          status: 'pending'
        });

        notificationService.createNotification(
          reviewerId,
          'review_assignment',
          `You have been assigned to review BRD: ${brd.title}`,
          { brd_id: id }
        );
      }
    }

    db.prepare(`UPDATE brd_documents SET workflow_status = 'in_review' WHERE id = ?`).run(id);

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error assigning reviewers:', error.message);
    res.status(500).json({ success: false, error: 'Failed to assign reviewers' });
  }
};

/**
 * Update review assignment status
 */
exports.updateReviewAssignment = async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    const { status, comments } = req.body;
    const userId = req.user.id;

    const assignment = db.prepare(`
      SELECT * FROM brd_review_assignments
      WHERE id = ? AND brd_id = ? AND assigned_to = ?
    `).get(assignmentId, id, userId);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found or unauthorized' });
    }

    db.prepare(`
      UPDATE brd_review_assignments
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, comments = ?
      WHERE id = ?
    `).run(status, comments || null, assignmentId);

    const allAssignments = db.prepare(`
      SELECT status FROM brd_review_assignments
      WHERE brd_id = ?
    `).all(id);

    const allCompleted = allAssignments.every(a => a.status !== 'pending');
    const allApproved = allAssignments.every(a => a.status === 'approved');

    if (allCompleted) {
      const newStatus = allApproved ? 'approved' : 'changes_requested';
      db.prepare(`UPDATE brd_documents SET workflow_status = ? WHERE id = ?`).run(newStatus, id);

      const brd = db.prepare(`SELECT user_id, title FROM brd_documents WHERE id = ?`).get(id);
      if (brd) {
        notificationService.createNotification(
          brd.user_id,
          'review_completed',
          `Review completed for BRD: ${brd.title}`,
          { brd_id: id, status: newStatus }
        );
      }
    }

    res.json({ success: true, data: { status, allCompleted, allApproved } });
  } catch (error) {
    console.error('Error updating review assignment:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update review assignment' });
  }
};

/**
 * Add a collaborator to a BRD
 */
exports.addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, permission_level = 'view' } = req.body;
    const userId = req.user.id;

    // Check if BRD exists and belongs to user
    const brd = db.prepare(`SELECT * FROM brd_documents WHERE id = ? AND user_id = ?`).get(id, String(userId));
    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // Validate permission_level (can be comma-separated list like 'view,comment')
    const validPermissions = ['view', 'comment', 'edit'];
    const requestedPerms = permission_level.split(',');
    const isValid = requestedPerms.every(p => validPermissions.includes(p.trim()));

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid permission level provided' });
    }

    // Add collaborator
    db.prepare(`
      INSERT INTO brd_collaborators (brd_id, user_id, permission_level, added_by, added_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, user_id, permission_level, userId);

    // Log to activity_logs
    try {
      const addedUser = db.prepare('SELECT email FROM users WHERE id = ?').get(user_id);
      db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, description, resource_type, resource_id, created_at)
        VALUES (?, 'COLLABORATOR_ADDED', ?, 'brd_document', ?, CURRENT_TIMESTAMP)
      `).run(userId, `Added collaborator: ${addedUser?.email || user_id} (${permission_level})`, id);
    } catch (e) { console.error('Activity log error:', e); }

    // Send notification to added collaborator
    try {
      await notificationService.notify(user_id, 'COLLABORATOR_ASSIGNED', {
        actor_id: userId,
        actor_name: req.user.name || req.user.username,
        brd_title: brd.title,
        resource_id: id,
        resource_type: 'brd_document'
      });
    } catch (nErr) { console.error('Notification error:', nErr.message); }

    res.json({ success: true, message: 'Collaborator added successfully' });
  } catch (error) {
    console.error('Error adding collaborator:', error.message);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'User is already a collaborator' });
    }
    res.status(500).json({ success: false, error: 'Failed to add collaborator' });
  }
};

/**
 * Remove a collaborator from a BRD
 */
exports.removeCollaborator = async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.id;

    // Check if BRD exists and belongs to user
    const brd = db.prepare(`SELECT * FROM brd_documents WHERE id = ? AND user_id = ?`).get(id, String(userId));
    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // Remove collaborator
    const stmt = db.prepare(`DELETE FROM brd_collaborators WHERE brd_id = ? AND id = ?`);
    const result = stmt.run(id, collaboratorId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Collaborator not found' });
    }

    res.json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error.message);
    res.status(500).json({ success: false, error: 'Failed to remove collaborator' });
  }
};

/**
 * Get collaborators for a BRD
 */
exports.getCollaborators = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userIdStr = String(userId);
    const userIdInt = Number(userId);

    // Verify access
    const brd = db.prepare(`
      SELECT b.id 
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL)
    `).get(userIdStr, id, userIdStr, userIdInt);

    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.brd_id,
        c.user_id,
        c.permission_level,
        c.added_at,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as user_name,
        u.email
      FROM brd_collaborators c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.brd_id = ?
      ORDER BY c.added_at DESC
    `);

    const collaborators = stmt.all(id);
    res.json({ success: true, data: collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch collaborators' });
  }
};

// ============ ACTIVITY LOG ENDPOINTS ============

/**
 * Get activity log for a BRD
 */
exports.getActivityLog = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userIdStr = String(userId);
    const userIdInt = Number(userId);

    // Verify access
    const brd = db.prepare(`
      SELECT b.id 
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL)
    `).get(userIdStr, id, userIdStr, userIdInt);

    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    // Get activity log from activity_logs table
    const stmt = db.prepare(`
      SELECT 
        a.id,
        a.resource_id as brd_id,
        a.action_type as to_status, -- Mapping for UI compatibility
        NULL as from_status,
        a.description as reason,
        a.created_at,
        COALESCE(u.first_name || ' ' || u.last_name, u.email) as user_name,
        u.email as user_email
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.resource_id = ? AND a.resource_type = 'brd_document'
      ORDER BY a.created_at DESC
    `);

    const activities = stmt.all(id);

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activity log:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch activity log' });
  }
};

/**
 * Log an activity (internal use)
 */
const logActivity = (brdId, fromStatus, toStatus, userId, reason) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO brd_workflow_history (brd_id, from_status, to_status, changed_by, reason)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(brdId, fromStatus, toStatus, userId, reason);
  } catch (error) {
    console.error('Error logging activity:', error.message);
  }
};

exports.logActivity = logActivity;

/**
 * Get comments for a BRD
 */
exports.getComments = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userIdStr = String(userId);
    const userIdInt = Number(userId);

    // Verify access
    const brd = db.prepare(`
      SELECT b.id 
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL)
    `).get(userIdStr, id, userIdStr, userIdInt);

    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.brd_id,
        c.section_heading as section_id,
        c.comment_text,
        c.status,
        c.created_at,
        c.updated_at,
        c.commented_by as user_id,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as user_name,
        u.email as user_email
      FROM brd_section_comments c
      LEFT JOIN users u ON c.commented_by = u.id
      WHERE c.brd_id = ?
      ORDER BY c.created_at DESC
    `);
    const comments = stmt.all(id);
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
};

/**
 * Smart Edit selected text using AI
 */
exports.smartEdit = async (req, res) => {
  console.log('[SmartEdit] Request received');
  try {
    const { selection, instruction, context } = req.body;

    if (!req.user || !req.user.id) {
      console.error('[SmartEdit] No user in request');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const userId = req.user.id;
    console.log(`[SmartEdit] User: ${userId}, Instruction: ${instruction}, Selection Length: ${selection ? selection.length : 0}`);

    if (!selection || !instruction) {
      return res.status(400).json({ success: false, error: 'Selection and instruction are required' });
    }

    // Initialize AI
    const aiConfig = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?').get(userId);
    let apiKey = process.env.OPENAI_API_KEY;

    if (aiConfig && aiConfig.api_key) {
      console.log('[SmartEdit] Found user AI config');
      const decrypted = decryptApiKey(aiConfig.api_key);
      if (decrypted) {
        apiKey = decrypted;
        console.log('[SmartEdit] Decrypted user API key');
      } else {
        console.error('[SmartEdit] Failed to decrypt user key');
      }
    } else {
      console.log('[SmartEdit] No user specific AI config found, using env key');
    }

    if (!apiKey) {
      console.error('[SmartEdit] No API Key available');
      return res.status(400).json({ success: false, error: 'AI not configured. Please add your API key in Settings.' });
    }

    // Ensure service is initialized
    console.log('[SmartEdit] Initializing AI service...');
    if (!aiService.initializeOpenAI(apiKey)) {
      throw new Error('Failed to initialize AI with provided key');
    }
    console.log('[SmartEdit] AI Service initialized. Calling smartEditText...');

    // Check usage limits if applicable...

    const rewrittenText = await aiService.smartEditText(selection, instruction, context);
    console.log('[SmartEdit] Success. Rewritten length:', rewrittenText.length);

    res.json({
      success: true,
      data: { rewritten: rewrittenText }
    });

  } catch (error) {
    console.error('[SmartEdit] CRITICAL ERROR:', error);
    // Print stack trace
    console.error(error.stack);
    res.status(500).json({ success: false, error: 'Failed to perform Smart Edit: ' + error.message });
  }
};

/**
 * Add a comment to a BRD section
 */
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userIdStr = String(userId);
    const userIdInt = Number(userId);
    const { section_id, comment_text } = req.body;

    // Verify access
    const brd = db.prepare(`
      SELECT b.id 
      FROM brd_documents b
      LEFT JOIN brd_collaborators c ON c.brd_id = b.id AND c.user_id = ?
      WHERE b.id = ? AND (b.user_id = ? OR b.assigned_to = ? OR c.user_id IS NOT NULL)
    `).get(userIdStr, id, userIdStr, userIdInt);

    if (!brd) return res.status(404).json({ success: false, error: 'BRD not found' });

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Ensure we use section_heading for the column
    const stmt = db.prepare(`
      INSERT INTO brd_section_comments (brd_id, section_heading, comment_text, commented_by, status)
      VALUES (?, ?, ?, ?, 'open')
    `);

    const info = stmt.run(id, section_id, comment_text.trim(), userId);

    // Log to activity_logs
    try {
      db.prepare(`
        INSERT INTO activity_logs (user_id, action_type, description, resource_type, resource_id, created_at)
        VALUES (?, 'COMMENT_ADDED', ?, 'brd_document', ?, CURRENT_TIMESTAMP)
      `).run(userId, `Added a comment in section: ${section_id}`, id);
    } catch (e) { console.error('Activity log error:', e); }

    // Send notification to BRD Owner (if the commenter is not the owner)
    try {
      if (userId !== Number(brd.user_id)) {
        await notificationService.notify(brd.user_id, 'COMMENT_ADDED', {
          actor_id: userId,
          actor_name: req.user.name || req.user.username,
          brd_title: brd.title,
          resource_id: id,
          resource_type: 'brd_document'
        });
      }
    } catch (nErr) { console.error('Notification error:', nErr.message); }

    // Return the newly created comment
    const comment = db.prepare(`
      SELECT 
        c.id,
        c.brd_id,
        c.section_heading as section_id,
        c.comment_text,
        c.status,
        c.created_at,
        c.updated_at,
        c.commented_by as user_id,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as user_name,
        u.email as user_email
      FROM brd_section_comments c
      LEFT JOIN users u ON c.commented_by = u.id
      WHERE c.id = ?
    `).get(info.lastInsertRowid);

    res.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

/**
 * Update a comment
 */
const updateComment = (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { comment_text, is_resolved } = req.body;
    const userId = req.user?.id;

    // Verify comment exists
    const comment = db.prepare(`
      SELECT c.commented_by, b.user_id as owner_id, col.permission_level
      FROM brd_section_comments c
      JOIN brd_documents b ON b.id = c.brd_id
      LEFT JOIN brd_collaborators col ON col.brd_id = b.id AND col.user_id = ?
      WHERE c.id = ? AND c.brd_id = ?
    `).get(userId, commentId, id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Permission check: Author OR BRD Owner OR Editor
    const perms = (comment.permission_level || '').split(',');
    const isEditor = perms.includes('edit');
    const isAuthor = String(comment.commented_by) === String(userId);
    const isOwner = String(comment.owner_id) === String(userId);

    if (!isAuthor && !isOwner && !isEditor) {
      return res.status(403).json({ error: 'Unauthorized to update this comment' });
    }

    // Update comment
    const updates = [];
    const values = [];

    if (comment_text !== undefined) {
      updates.push('comment_text = ?');
      values.push(comment_text);
    }
    if (is_resolved !== undefined) {
      updates.push('status = ?');
      values.push(is_resolved ? 'resolved' : 'open');
      if (is_resolved) {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
        updates.push('resolved_by = ?');
        values.push(userId);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(commentId);
    const stmt = db.prepare(`
      UPDATE brd_section_comments 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(...values);

    // Return updated comment
    const updated = db.prepare(`
      SELECT 
        c.id,
        c.brd_id,
        c.section_heading as section_id,
        c.comment_text,
        c.status,
        c.created_at,
        c.updated_at,
        c.commented_by as user_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
      FROM brd_section_comments c
      LEFT JOIN users u ON c.commented_by = u.id
      WHERE c.id = ?
    `).get(commentId);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating comment:', error.message);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

/**
 * Delete a comment
 */
const deleteComment = (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user?.id;

    // Verify comment exists
    const comment = db.prepare(`
      SELECT c.commented_by, b.user_id as owner_id, col.permission_level
      FROM brd_section_comments c
      JOIN brd_documents b ON b.id = c.brd_id
      LEFT JOIN brd_collaborators col ON col.brd_id = b.id AND col.user_id = ?
      WHERE c.id = ? AND c.brd_id = ?
    `).get(userId, commentId, id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Permission check: Author OR BRD Owner OR Editor
    const perms = (comment.permission_level || '').split(',');
    const isEditor = perms.includes('edit');
    const isAuthor = String(comment.commented_by) === String(userId);
    const isOwner = String(comment.owner_id) === String(userId);

    if (!isAuthor && !isOwner && !isEditor) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    // Delete comment
    db.prepare('DELETE FROM brd_section_comments WHERE id = ?').run(commentId);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error.message);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

exports.addComment = addComment;
exports.updateComment = updateComment;
exports.deleteComment = deleteComment;
/**
 * Regenerate a BRD section using AI
 * POST /api/brd/regenerate-section
 */
exports.regenerateSection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, instruction, brdId, sectionId, context } = req.body;

    if (!text || !instruction) {
      return res.status(400).json({
        success: false,
        error: 'Text and instruction are required'
      });
    }

    // Get user's API key if available
    let apiKey = process.env.OPENAI_API_KEY;

    // If user has custom API key, use it
    if (brdId) {
      try {
        const brdResult = db.prepare(`
          SELECT api_key_encrypted FROM brd_documents WHERE id = ? AND user_id = ?
        `).get(brdId, userId);

        if (brdResult?.api_key_encrypted) {
          const decrypted = decryptApiKey(brdResult.api_key_encrypted);
          if (decrypted) apiKey = decrypted;
        }
      } catch (err) {
        console.warn('Failed to get user API key:', err.message);
      }
    }

    // Initialize AI Service
    aiService.initializeOpenAI(apiKey);

    // Call regenerate function
    const result = await aiService.regenerateSection(text, instruction, {
      tone: 'professional',
      language: 'ar',
      context: context || '',
      maxTokens: 2000
    });

    // Log activity if BRD is provided
    if (brdId) {
      try {
        db.prepare(`
          INSERT INTO activity_logs (brd_id, user_id, action, details, created_at)
          VALUES (?, ?, 'SECTION_REGENERATED', ?, datetime('now'))
        `).run(brdId, userId, JSON.stringify({ sectionId, instruction }));
      } catch (logErr) {
        console.warn('Failed to log activity:', logErr.message);
      }
    }

    return res.json({
      success: true,
      data: {
        original: result.original,
        result: result.result,
        instruction: result.instruction,
        timestamp: result.timestamp,
        tokensUsed: result.tokens_used
      }
    });

  } catch (error) {
    console.error('Regenerate section error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to regenerate section',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Smart Edit a text selection
 * POST /api/brd/smart-edit
 */
exports.smartEdit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selection, instruction, context } = req.body;

    if (!selection || !instruction) {
      return res.status(400).json({
        success: false,
        error: 'Selection and instruction are required'
      });
    }

    // Get user's API key
    let apiKey = process.env.OPENAI_API_KEY;

    // Initialize AI Service
    aiService.initializeOpenAI(apiKey);

    // Call smart edit function
    const rewritten = await aiService.smartEditText(
      selection,
      instruction,
      context || ''
    );

    return res.json({
      success: true,
      data: {
        original: selection,
        rewritten: rewritten
      }
    });

  } catch (error) {
    console.error('Smart edit error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process smart edit'
    });
  }
};