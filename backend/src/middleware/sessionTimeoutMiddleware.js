// Middleware للتحقق من session timeout
const pool = require('../db/connection');

const checkSessionTimeout = async (req, res, next) => {
  try {
    // Skip for public routes
    if (!req.user || !req.user.id) {
      return next();
    }

    const userId = req.user.id;

    // Get user's session timeout setting from database
    const result = await pool.query(
      `SELECT settings FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows && result.rows.length > 0) {
      const user = result.rows[0];
      
      let settings = {};
      try {
        settings = user.settings ? JSON.parse(user.settings) : {};
      } catch (e) {
        // If parse fails, use default
        settings = {};
      }

      // Get session timeout from settings (in minutes)
      const sessionTimeout = settings.security?.sessions_timeout || 30;

      // Get current session from database
      if (req.sessionId) {
        const sessionResult = await pool.query(
          `SELECT created_at, last_activity FROM user_sessions WHERE id = $1 AND is_active = 1`,
          [req.sessionId]
        );

        if (sessionResult.rows && sessionResult.rows.length > 0) {
          const session = sessionResult.rows[0];
          const lastActivity = new Date(session.last_activity || session.created_at);
          const now = new Date();
          const minutesSinceLastActivity = (now - lastActivity) / 1000 / 60;

          console.log(`[SESSION TIMEOUT] User ${userId}: ${minutesSinceLastActivity.toFixed(2)} minutes since last activity, timeout set to ${sessionTimeout} minutes`);

          // If session has expired, end it
          if (minutesSinceLastActivity > sessionTimeout) {
            console.log(`[SESSION TIMEOUT] Session expired for user ${userId}, ending session`);
            
            // End session
            await pool.query(
              `UPDATE user_sessions SET is_active = 0 WHERE id = $1`,
              [req.sessionId]
            );

            return res.status(401).json({ 
              error: 'Session expired',
              code: 'SESSION_TIMEOUT'
            });
          }

          // Update last activity
          await pool.query(
            `UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1`,
            [req.sessionId]
          );
        }
      }
    }

    next();
  } catch (error) {
    console.error('[SESSION TIMEOUT] Error checking session timeout:', error);
    // Don't block request if timeout check fails
    next();
  }
};

module.exports = checkSessionTimeout;
