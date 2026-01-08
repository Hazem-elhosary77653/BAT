const pool = require('../db/connection');
const crypto = require('crypto');

// Create new session
const createSession = async (userId, token, ipAddress, userAgent) => {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await pool.query(
      `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, last_activity, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
       RETURNING id, user_id, token, expires_at`,
      [userId, token, ipAddress, userAgent, expiresAt]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Create session error:', err);
    throw err;
  }
};

// Get active session
const getSession = async (token) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, token, ip_address, user_agent, last_activity, expires_at
       FROM user_sessions
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    return result.rows[0] || null;
  } catch (err) {
    console.error('Get session error:', err);
    throw err;
  }
};

// Update session last activity
const updateSessionActivity = async (token) => {
  try {
    const result = await pool.query(
      `UPDATE user_sessions
       SET last_activity = NOW()
       WHERE token = $1 AND expires_at > NOW()
       RETURNING id`,
      [token]
    );

    return result.rows[0] || null;
  } catch (err) {
    console.error('Update session activity error:', err);
    throw err;
  }
};

// Get user sessions
const getUserSessions = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, token, ip_address, user_agent, last_activity, expires_at, created_at
       FROM user_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (err) {
    console.error('Get user sessions error:', err);
    throw err;
  }
};

// Invalidate session
const invalidateSession = async (token) => {
  try {
    const result = await pool.query(
      `DELETE FROM user_sessions WHERE token = $1`,
      [token]
    );

    return result.rowCount > 0;
  } catch (err) {
    console.error('Invalidate session error:', err);
    throw err;
  }
};

// Invalidate all user sessions
const invalidateAllUserSessions = async (userId, exceptToken = null) => {
  try {
    let query = `DELETE FROM user_sessions WHERE user_id = $1`;
    const params = [userId];

    if (exceptToken) {
      query += ` AND token != $2`;
      params.push(exceptToken);
    }

    const result = await pool.query(query, params);
    return result.rowCount;
  } catch (err) {
    console.error('Invalidate all sessions error:', err);
    throw err;
  }
};

// Clean up expired sessions
const cleanupExpiredSessions = async () => {
  try {
    const result = await pool.query(
      `DELETE FROM user_sessions WHERE expires_at < NOW()`
    );

    console.log(`Cleaned up ${result.rowCount} expired sessions`);
    return result.rowCount;
  } catch (err) {
    console.error('Cleanup expired sessions error:', err);
    throw err;
  }
};

// Check concurrent login limit
const checkConcurrentLogins = async (userId, maxSessions = 3) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM user_sessions
       WHERE user_id = $1 AND expires_at > NOW()`,
      [userId]
    );

    const activeSessions = parseInt(result.rows[0].count);
    return {
      activeSessions,
      isLimitExceeded: activeSessions >= maxSessions,
      remaining: maxSessions - activeSessions
    };
  } catch (err) {
    console.error('Check concurrent logins error:', err);
    throw err;
  }
};

module.exports = {
  createSession,
  getSession,
  updateSessionActivity,
  getUserSessions,
  invalidateSession,
  invalidateAllUserSessions,
  cleanupExpiredSessions,
  checkConcurrentLogins
};
