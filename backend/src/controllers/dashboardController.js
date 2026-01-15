const db = require('better-sqlite3')('./database.db');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admin sees all data, others see only their data
    const isAdmin = userRole === 'admin';

    // Get user stories count
    const userStoriesResult = isAdmin
      ? db.prepare(`SELECT COUNT(*) as count FROM user_stories`).get()
      : db.prepare(`SELECT COUNT(*) as count FROM user_stories WHERE user_id = ?`).get(userId);

    // Get BRDs count
    const brdsResult = isAdmin
      ? db.prepare(`SELECT COUNT(*) as count FROM brd_documents`).get()
      : db.prepare(`SELECT COUNT(*) as count FROM brd_documents WHERE user_id = ?`).get(userId);

    // Get documents count
    const docsResult = isAdmin
      ? db.prepare(`SELECT COUNT(*) as count FROM documents`).get()
      : db.prepare(`SELECT COUNT(*) as count FROM documents WHERE user_id = ?`).get(userId);

    // Get active users count (users with active sessions)
    const activeUsersResult = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_sessions 
      WHERE is_active = 1
    `).get();

    // Get recent activity logs
    const recentActivities = db.prepare(`
      SELECT action_type, resource_type as entity_type, created_at 
      FROM activity_logs 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all();

    // Build activity trend for last 7 days (fallback to session logins if no activities)
    const last7Days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - idx));
      return d;
    });

    const formatKey = (d) => d.toISOString().slice(0, 10); // yyyy-mm-dd
    const formatLabel = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });

    const activityRows = db.prepare(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM activity_logs
      WHERE DATE(created_at) >= DATE('now', '-6 days')
      GROUP BY DATE(created_at)
    `).all();

    const sessionRows = db.prepare(`
      SELECT DATE(login_time) as day, COUNT(*) as count
      FROM user_sessions
      WHERE DATE(login_time) >= DATE('now', '-6 days')
      GROUP BY DATE(login_time)
    `).all();

    const activityMap = activityRows.reduce((acc, row) => {
      acc[row.day] = row.count;
      return acc;
    }, {});

    const sessionMap = sessionRows.reduce((acc, row) => {
      acc[row.day] = row.count;
      return acc;
    }, {});

    const activityTrend = last7Days.map((d) => {
      const key = formatKey(d);
      const count = activityMap[key] ?? sessionMap[key] ?? 0;
      return {
        name: formatLabel(d),
        activities: count,
        users: count,
        documents: 0
      };
    });

    // Get user stories by status (for charts)
    const userStoriesByStatus = isAdmin
      ? db.prepare(`
          SELECT status, COUNT(*) as count 
          FROM user_stories 
          GROUP BY status
        `).all()
      : db.prepare(`
          SELECT status, COUNT(*) as count 
          FROM user_stories 
          WHERE user_id = ?
          GROUP BY status
        `).all(userId);

    // Get BRDs by status (for charts)
    const brdsByStatus = isAdmin
      ? db.prepare(`
          SELECT status, COUNT(*) as count 
          FROM brd_documents 
          GROUP BY status
        `).all()
      : db.prepare(`
          SELECT status, COUNT(*) as count 
          FROM brd_documents 
          WHERE user_id = ?
          GROUP BY status
        `).all(userId);

    res.json({
      success: true,
      data: {
        userStories: userStoriesResult?.count || 0,
        brds: brdsResult?.count || 0,
        documents: docsResult?.count || 0,
        activeUsers: activeUsersResult?.count || 0,
        recentActivities: recentActivities || [],
        activityTrend,
        userStoriesByStatus: userStoriesByStatus || [],
        brdsByStatus: brdsByStatus || []
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
  }
};

module.exports = {
  getDashboardStats
};
