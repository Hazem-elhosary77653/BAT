const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

// Configure AI settings
const configureAI = async (req, res) => {
  try {
    const { promptTemplate, language, detailLevel, temperature, maxTokens } = req.body;

    // Check if config exists
    const existing = await pool.query(
      `SELECT * FROM ai_configurations WHERE user_id = $1`,
      [req.user.id]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE ai_configurations 
         SET prompt_template = COALESCE($1, prompt_template),
             language = COALESCE($2, language),
             detail_level = COALESCE($3, detail_level),
             temperature = COALESCE($4, temperature),
             max_tokens = COALESCE($5, max_tokens),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6
         RETURNING *`,
        [promptTemplate, language, detailLevel, temperature, maxTokens, req.user.id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO ai_configurations (user_id, prompt_template, language, detail_level, temperature, max_tokens)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, promptTemplate, language, detailLevel, temperature, maxTokens]
      );
    }

    await logAuditAction(req.user.id, 'AI_CONFIG_UPDATED', 'ai_config', result.rows[0].id);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error configuring AI:', err);
    res.status(500).json({ error: 'Failed to configure AI' });
  }
};

// Get AI configuration
const getAIConfig = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_configurations WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({
        language: 'English',
        detailLevel: 'medium',
        temperature: 0.7,
        maxTokens: 2000
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching AI config:', err);
    res.status(500).json({ error: 'Failed to fetch AI configuration' });
  }
};

module.exports = {
  configureAI,
  getAIConfig
};
