const express = require('express');
const router = express.Router();
const axios = require('axios');
const { decryptKey } = require('../utils/encryption');
const authMiddleware = require('../middleware/authMiddleware');
const { sqlite: db } = require('../db/connection');

// GET /api/openai/credit - Get OpenAI credit/quota info
router.get('/credit', authMiddleware, async (req, res) => {
  let apiKey = null;
  try {
    const userId = req.user?.id;
    if (userId) {
      const stmt = db.prepare('SELECT api_key FROM ai_configurations WHERE user_id = ?');
      const config = stmt.get(String(userId));
      if (config && config.api_key) {
        apiKey = decryptKey(config.api_key);
      }
    }
  } catch (e) {
    console.error('Error fetching API key from DB:', e.message);
  }

  // fallback to env if not in DB
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'OpenAI API key not configured' });
  }

  try {
    // Note: The /dashboard/billing/credit_grants endpoint might be deprecated or require specific session tokens,
    // but we restore the logic to be syntactically correct first.
    const response = await axios.get('https://api.openai.com/v1/dashboard/billing/credit_grants', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error('OpenAI Credit Info Error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.error || err.message
    });
  }
});

module.exports = router;
