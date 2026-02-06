const pool = require('../db/connection');
const { validationResult } = require('express-validator');

// Get all highlights for a BRD
exports.getHighlights = async (req, res) => {
  try {
    const { brdId } = req.params;
    
    const result = await pool.query(
      `SELECT h.*, u.username, u.first_name, u.last_name
       FROM brd_highlights h
       LEFT JOIN users u ON h.user_id = u.id
       WHERE h.brd_id = $1
       ORDER BY h.created_at DESC`,
      [brdId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch highlights' });
  }
};

// Create a new highlight
exports.createHighlight = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { brdId } = req.params;
    const { text, color, position_start, position_end } = req.body;
    const userId = req.user.id;

    console.log('[Highlight] Creating highlight:', { brdId, userId, text: text.substring(0, 50), color });

    // Create highlights table if not exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS brd_highlights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brd_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          color TEXT NOT NULL,
          position_start INTEGER DEFAULT 0,
          position_end INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (tableError) {
      console.log('[Highlight] Table already exists or creation skipped');
    }

    // Insert highlight - SQLite will auto-return the id
    const insertResult = await pool.query(
      `INSERT INTO brd_highlights (brd_id, user_id, text, color, position_start, position_end)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [brdId, userId, text, color, position_start || 0, position_end || 0]
    );

    console.log('[Highlight] Insert result:', insertResult);

    // Return success with basic data
    res.json({ 
      success: true, 
      data: {
        id: insertResult.rows && insertResult.rows[0] ? insertResult.rows[0].id : null,
        brd_id: brdId,
        user_id: userId,
        text,
        color,
        created_at: new Date()
      },
      message: 'Highlight created successfully' 
    });
  } catch (error) {
    console.error('[Highlight] Error creating highlight:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create highlight' });
  }
};

// Delete a highlight
exports.deleteHighlight = async (req, res) => {
  try {
    const { highlightId } = req.params;
    const userId = req.user.id;

    // Check if user owns the highlight
    const highlightResult = await pool.query(
      'SELECT * FROM brd_highlights WHERE id = $1',
      [highlightId]
    );

    if (!highlightResult.rows || highlightResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Highlight not found' });
    }

    const highlight = highlightResult.rows[0];

    if (highlight.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this highlight' });
    }

    await pool.query('DELETE FROM brd_highlights WHERE id = $1', [highlightId]);

    res.json({ success: true, message: 'Highlight deleted successfully' });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    res.status(500).json({ success: false, error: 'Failed to delete highlight' });
  }
};

// Get all mentions for a BRD
exports.getMentions = async (req, res) => {
  try {
    const { brdId } = req.params;

    const result = await pool.query(
      `SELECT m.*, 
              u1.username as mentioned_username, u1.first_name as mentioned_first_name, u1.last_name as mentioned_last_name,
              u2.username as mentioner_username, u2.first_name as mentioner_first_name, u2.last_name as mentioner_last_name
       FROM brd_mentions m
       LEFT JOIN users u1 ON m.mentioned_user_id = u1.id
       LEFT JOIN users u2 ON m.mentioned_by = u2.id
       WHERE m.brd_id = $1
       ORDER BY m.created_at DESC`,
      [brdId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching mentions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mentions' });
  }
};

// Create a mention
exports.createMention = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { brdId } = req.params;
    const { mentioned_user_id, text } = req.body;
    const mentionedBy = req.user.id;

    // Create mentions table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brd_mentions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id INTEGER NOT NULL,
        mentioned_user_id INTEGER NOT NULL,
        mentioned_by INTEGER NOT NULL,
        text TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brd_id) REFERENCES brds(id) ON DELETE CASCADE,
        FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (mentioned_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Insert mention
    const insertResult = await pool.query(
      `INSERT INTO brd_mentions (brd_id, mentioned_user_id, mentioned_by, text)
       VALUES ($1, $2, $3, $4)`,
      [brdId, mentioned_user_id, mentionedBy, text]
    );

    // Get the inserted mention with user info
    const mentionId = insertResult.rows && insertResult.rows[0] && insertResult.rows[0].id;
    
    if (mentionId) {
      const mention = await pool.query(
        `SELECT m.*, 
                u1.username as mentioned_username, u1.first_name as mentioned_first_name,
                u2.username as mentioner_username, u2.first_name as mentioner_first_name
         FROM brd_mentions m
         LEFT JOIN users u1 ON m.mentioned_user_id = u1.id
         LEFT JOIN users u2 ON m.mentioned_by = u2.id
         WHERE m.id = $1`,
        [mentionId]
      );

      res.json({ success: true, data: mention.rows[0], message: 'Mention created successfully' });
    } else {
      res.json({ success: true, message: 'Mention created successfully' });
    }
  } catch (error) {
    console.error('Error creating mention:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create mention' });
  }
};

// Mark mention as read
exports.markMentionAsRead = async (req, res) => {
  try {
    const { mentionId } = req.params;
    const userId = req.user.id;

    // Check if user is the mentioned user
    const mentionResult = await pool.query(
      'SELECT * FROM brd_mentions WHERE id = $1',
      [mentionId]
    );

    if (!mentionResult.rows || mentionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mention not found' });
    }

    const mention = mentionResult.rows[0];

    if (mention.mentioned_user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await pool.query(
      'UPDATE brd_mentions SET is_read = 1 WHERE id = $1',
      [mentionId]
    );

    res.json({ success: true, message: 'Mention marked as read' });
  } catch (error) {
    console.error('Error marking mention as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark mention as read' });
  }
};
