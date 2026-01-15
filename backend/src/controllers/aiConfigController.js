/**
 * AI Configuration Controller
 * Handles AI settings management and API key validation
 */

const { validationResult } = require('express-validator');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const aiService = require('../services/aiService');
const { encryptKey, decryptKey } = require('../utils/encryption');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Use imported encryption functions
const encryptAPIKey = encryptKey;
const decryptAPIKey = decryptKey;

/**
 * Get AI configuration for current user
 * GET /api/ai-config
 */
exports.getConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;
    const userIdStr = String(userId);

    const stmt = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?');
    const config = stmt.get(userIdStr);

    if (!config) {
      return res.json({
        success: true,
        data: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 2000,
          language: 'en',
          detail_level: 'standard',
          api_key_configured: false,
        },
      });
    }

    // Don't return the encrypted API key
    res.json({
      success: true,
      data: {
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        language: config.language,
        detail_level: config.detail_level,
        api_key_configured: !!config.api_key,
        created_at: config.created_at,
        updated_at: config.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching AI config:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch configuration' });
  }
};

/**
 * Update AI configuration
 * PUT /api/ai-config
 */
exports.updateConfiguration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const userIdStr = String(userId);
    const { api_key, model, temperature, max_tokens, language, detail_level } = req.body;

    // Validate parameters
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      return res.status(400).json({ success: false, error: 'Temperature must be between 0 and 2' });
    }

    if (max_tokens !== undefined && (max_tokens < 100 || max_tokens > 4000)) {
      return res.status(400).json({ success: false, error: 'Max tokens must be between 100 and 4000' });
    }

    // Check if config exists
    const existing = db.prepare('SELECT id FROM ai_configurations WHERE user_id = ?').get(userIdStr);

    if (existing) {
      // Update existing
      const updateFields = [];
      const updateValues = [];

      if (model) {
        updateFields.push('model = ?');
        updateValues.push(model);
      }
      if (temperature !== undefined) {
        updateFields.push('temperature = ?');
        updateValues.push(temperature);
      }
      if (max_tokens !== undefined) {
        updateFields.push('max_tokens = ?');
        updateValues.push(max_tokens);
      }
      if (language) {
        updateFields.push('language = ?');
        updateValues.push(language);
      }
      if (detail_level) {
        updateFields.push('detail_level = ?');
        updateValues.push(detail_level);
      }
      if (api_key) {
        updateFields.push('api_key = ?');
        updateValues.push(encryptAPIKey(api_key));
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(userIdStr);

        const query = `UPDATE ai_configurations SET ${updateFields.join(', ')} WHERE user_id = ?`;
        const stmt = db.prepare(query);
        stmt.run(...updateValues.map((v, idx) => (idx === updateValues.length - 1 ? String(v) : v)));
      }
    } else {
      // Insert new (requires id and api_key per schema)
      const encryptedKey = api_key ? encryptAPIKey(api_key) : null;

      if (!encryptedKey) {
        return res.status(400).json({ success: false, error: 'API key is required' });
      }

      const stmt = db.prepare(`
        INSERT INTO ai_configurations 
        (id, user_id, api_key, model, temperature, max_tokens, language, detail_level, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        uuidv4(),
        userIdStr,
        encryptedKey,
        model || 'gpt-3.5-turbo',
        temperature || 0.7,
        max_tokens || 2000,
        language || 'en',
        detail_level || 'standard'
      );
    }

    // Log the action
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logStmt.run(userIdStr, 'UPDATE', 'ai_configuration');

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        model: model || 'gpt-3.5-turbo',
        temperature: temperature !== undefined ? temperature : 0.7,
        max_tokens: max_tokens || 2000,
        language: language || 'en',
        detail_level: detail_level || 'standard',
        api_key_configured: !!api_key,
      },
    });
  } catch (error) {
    console.error('Error updating AI config:', error.message, error.stack);
    res.status(500).json({ success: false, error: 'Failed to update configuration', details: error.message });
  }
};

/**
 * Test OpenAI connection
 * POST /api/ai-config/test
 */
exports.testConnection = async (req, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({ success: false, error: 'API key is required' });
    }

    // Test the connection
    const isValid = await aiService.testOpenAIConnection(api_key);

    if (isValid) {
      res.json({
        success: true,
        message: 'Connection successful',
        connected: true,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid API key or connection failed',
        connected: false,
      });
    }
  } catch (error) {
    console.error('Error testing connection:', error.message);
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message,
    });
  }
};

/**
 * Get available OpenAI models
 * GET /api/ai-config/models
 */
exports.getAvailableModels = async (req, res) => {
  try {
    // Return a hardcoded list of recommended models
    // In production, you could fetch from OpenAI API if needed
    const models = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable model, best for complex tasks',
        costPerToken: 0.00003, // approximate
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective, good for most tasks',
        costPerToken: 0.0005, // approximate
      },
      {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16K',
        description: 'Extended context window (16K tokens)',
        costPerToken: 0.001,
      },
    ];

    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('Error fetching models:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch models' });
  }
};

/**
 * Reset configuration to defaults
 * POST /api/ai-config/reset
 */
exports.resetConfiguration = async (req, res) => {
  try {
    const userIdStr = String(req.user.id);

    // Delete existing configuration
    db.prepare('DELETE FROM ai_configurations WHERE user_id = ?').run(userIdStr);

    // Log the action
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    logStmt.run(userIdStr, 'RESET', 'ai_configuration');

    res.json({
      success: true,
      message: 'Configuration reset to defaults',
      data: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 2000,
        language: 'en',
        detail_level: 'standard',
        api_key_configured: false,
      },
    });
  } catch (error) {
    console.error('Error resetting config:', error.message);
    res.status(500).json({ success: false, error: 'Failed to reset configuration' });
  }
};
