const pool = require('../db/connection');

// Create user session
const createSession = async (userId, ipAddress = '', userAgent = '') => {
  try {
    const result = await pool.query(
      `INSERT INTO user_sessions (user_id, ip_address, user_agent, login_time, last_activity)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, user_id, login_time`,
      [userId, ipAddress || '', userAgent || '']
    );

    return result.rows[0];
  } catch (err) {
    console.error('Error creating session:', err);
    throw err;
  }
};

// Get user sessions
const getUserSessions = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT id, ip_address, user_agent, login_time, last_activity, is_active
       FROM user_sessions 
       WHERE user_id = $1 
       ORDER BY login_time DESC`,
      [userId]
    );

    return result.rows;
  } catch (err) {
    console.error('Error fetching user sessions:', err);
    throw err;
  }
};

// Update session activity
const updateSessionActivity = async (sessionId, lastActivity = new Date()) => {
  try {
    // SQLite needs primitives; store ISO string timestamp
    const timestamp = typeof lastActivity === 'string' ? lastActivity : new Date(lastActivity).toISOString();

    await pool.query(
      `UPDATE user_sessions 
       SET last_activity = $1 
       WHERE id = $2`,
      [timestamp, sessionId]
    );

    return true;
  } catch (err) {
    console.error('Error updating session activity:', err);
    throw err;
  }
};

// End session (logout)
const endSession = async (sessionId) => {
  try {
    await pool.query(
      `UPDATE user_sessions 
       SET is_active = 0, logout_time = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [sessionId]
    );

    return true;
  } catch (err) {
    console.error('Error ending session:', err);
    throw err;
  }
};

// Get single session by id
const getSessionById = async (sessionId) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, ip_address, user_agent, login_time, last_activity, is_active
       FROM user_sessions
       WHERE id = $1`,
      [sessionId]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Error fetching session by id:', err);
    throw err;
  }
};

// End all sessions for user (logout from all devices)
const endAllUserSessions = async (userId) => {
  try {
    await pool.query(
      `UPDATE user_sessions 
       SET is_active = 0, logout_time = CURRENT_TIMESTAMP 
       WHERE user_id = $1`,
      [userId]
    );

    return true;
  } catch (err) {
    console.error('Error ending all sessions:', err);
    throw err;
  }
};

// Get active sessions
const getActiveSessions = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT id, ip_address, user_agent, login_time, last_activity
       FROM user_sessions 
       WHERE user_id = $1 AND is_active = 1
       ORDER BY last_activity DESC`,
      [userId]
    );

    return result.rows;
  } catch (err) {
    console.error('Error fetching active sessions:', err);
    throw err;
  }
};

// Get total sessions count
const getSessionsCount = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1`,
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  } catch (err) {
    console.error('Error getting sessions count:', err);
    throw err;
  }
};

module.exports = {
  createSession,
  getUserSessions,
  updateSessionActivity,
  endSession,
  getSessionById,
  endAllUserSessions,
  getActiveSessions,
  getSessionsCount
};
