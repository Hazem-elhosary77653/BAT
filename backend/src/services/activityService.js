const pool = require('../db/connection');

// Log user activity
const logUserActivity = async (userId, actionType, description, options = {}) => {
  try {
    const { ipAddress, userAgent, resourceType, resourceId } = options;

    const result = await pool.query(
      `INSERT INTO activity_logs (user_id, action_type, description, ip_address, user_agent, resource_type, resource_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING id`,
      [userId, actionType, description, ipAddress || null, userAgent || null, resourceType || null, resourceId || null]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Log user activity error:', err);
    // Don't throw - activity logging should not break the main operation
  }
};

// Get user activity logs
const getUserActivity = async (userId, limit = 100, offset = 0) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, action_type, description, ip_address, user_agent, resource_type, resource_id, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM activity_logs WHERE user_id = $1`,
      [userId]
    );

    return {
      activities: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    };
  } catch (err) {
    console.error('Get user activity error:', err);
    throw err;
  }
};

// Get all user activities (admin)
const getAllUserActivities = async (limit = 500, offset = 0, filters = {}) => {
  try {
    let baseQuery = `SELECT al.*, u.email as user_email, u.username as user_name, u.first_name, u.last_name FROM activity_logs al
                     JOIN users u ON al.user_id = u.id WHERE 1=1`;
    const filterParams = [];

    if (filters.actionType) {
      baseQuery += ` AND al.action_type = $${filterParams.length + 1}`;
      filterParams.push(filters.actionType);
    }

    if (filters.userId) {
      baseQuery += ` AND al.user_id = $${filterParams.length + 1}`;
      filterParams.push(filters.userId);
    }

    if (filters.startDate) {
      baseQuery += ` AND al.created_at >= $${filterParams.length + 1}`;
      filterParams.push(filters.startDate);
    }

    if (filters.endDate) {
      baseQuery += ` AND al.created_at <= $${filterParams.length + 1}`;
      filterParams.push(filters.endDate);
    }

    // Get count
    const countQuery = baseQuery.replace('al.*, u.email as user_email, u.username as user_name, u.first_name, u.last_name', 'COUNT(*) as total');
    const countResult = await pool.query(countQuery, filterParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Get paginated results
    const query = baseQuery + ` ORDER BY al.created_at DESC LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}`;
    const params = [...filterParams, limit, offset];
    const result = await pool.query(query, params);

    return {
      activities: result.rows,
      total,
      limit,
      offset
    };
  } catch (err) {
    console.error('Get all activities error:', err);
    throw err;
  }
};

// Get user login history
const getUserLoginHistory = async (userId, limit = 50) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, action_type, ip_address, user_agent, created_at
       FROM activity_logs
       WHERE user_id = $1 AND action_type IN ('LOGIN', 'LOGIN_SUCCESS')
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (err) {
    console.error('Get login history error:', err);
    throw err;
  }
};

// Get activity summary for dashboard
const getActivitySummary = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await pool.query(
      `SELECT 
        action_type,
        COUNT(*) as count
       FROM activity_logs
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY action_type
       ORDER BY count DESC`,
      [userId, startDate]
    );

    return result.rows;
  } catch (err) {
    console.error('Get activity summary error:', err);
    throw err;
  }
};

module.exports = {
  logUserActivity,
  getUserActivity,
  getAllUserActivities,
  getUserLoginHistory,
  getActivitySummary
};
