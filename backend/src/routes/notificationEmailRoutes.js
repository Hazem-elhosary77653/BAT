const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');
const { sqlite: db } = require('../db/connection');

// Send notification email and save notification
router.post('/send', async (req, res) => {
  const { user_id, email, subject, message } = req.body;
  if (!user_id || !email || !subject || !message) {
    return res.status(400).json({ error: 'user_id, email, subject, and message are required' });
  }
  try {
    await sendEmail(email, subject, `<div>${message}</div>`, message);
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(user_id, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
