const { getUserActivity, getAllUserActivities, getUserLoginHistory, getActivitySummary } = require('../services/activityService');

// Get current user's activities
const getMyActivity = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await getUserActivity(
      req.user.id,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: result.activities,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

// Get current user's login history
const getMyLoginHistory = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const loginHistory = await getUserLoginHistory(req.user.id, parseInt(limit));

    res.json({
      success: true,
      data: loginHistory
    });
  } catch (err) {
    console.error('Get login history error:', err);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
};

// Get current user's activity summary
const getMyActivitySummary = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const summary = await getActivitySummary(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('Get activity summary error:', err);
    res.status(500).json({ error: 'Failed to fetch activity summary' });
  }
};

// Get all activities (permission-based access)
const getAllActivities = async (req, res) => {
  try {
    // Permission already checked by middleware (activity:read_all required)

    const { limit = 500, offset = 0, actionType, userId, startDate, endDate } = req.query;

    const filters = {};
    if (actionType) filters.actionType = actionType;
    if (userId) filters.userId = parseInt(userId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await getAllUserActivities(
      parseInt(limit),
      parseInt(offset),
      filters
    );

    res.json({
      success: true,
      data: result.activities,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (err) {
    console.error('Get all activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

// Export all activities as CSV (permission-based access)
const exportActivitiesCsv = async (req, res) => {
  try {
    // Permission already checked by middleware (activity:export required)

    const { limit = 2000, offset = 0, actionType, userId, startDate, endDate } = req.query;

    const filters = {};
    if (actionType) filters.actionType = actionType;
    if (userId) filters.userId = parseInt(userId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await getAllUserActivities(parseInt(limit), parseInt(offset), filters);

    const header = ['id', 'user_id', 'user_email', 'action_type', 'description', 'ip_address', 'user_agent', 'resource_type', 'resource_id', 'created_at'];
    const rows = result.activities.map(a => [
      a.id,
      a.user_id,
      a.email || '',
      a.action_type,
      (a.description || '').replace(/\n/g, ' '),
      a.ip_address || '',
      (a.user_agent || '').replace(/,/g, ' '),
      a.resource_type || '',
      a.resource_id || '',
      a.created_at
    ]);

    const csvLines = [header.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))];
    const csvContent = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity_export.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error('Export activities error:', err);
    res.status(500).json({ error: 'Failed to export activities' });
  }
};

// Get specific user's activities (permission-based access)
const getUserActivitiesAdmin = async (req, res) => {
  try {
    // Permission already checked by middleware (activity:read_all required)

    const { userId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await getUserActivity(
      parseInt(userId),
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: result.activities,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (err) {
    console.error('Get user activities error:', err);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
};

module.exports = {
  getMyActivity,
  getMyLoginHistory,
  getMyActivitySummary,
  getAllActivities,
  getUserActivitiesAdmin,
  exportActivitiesCsv
};
