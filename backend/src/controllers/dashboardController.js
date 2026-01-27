const { sqlite: db } = require('../db/connection');

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

// Get business-centric analytics
const getBusinessAnalytics = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const userId = req.user?.id;

    // 1. Average Approval Time (Duration between request and approval)
    // Using SQLite strftime to calculate difference in seconds
    const approvalTimeResult = isAdmin
      ? db.prepare(`
          SELECT AVG(julianday(approved_at) - julianday(request_review_at)) * 86400 as avg_seconds
          FROM brd_documents
          WHERE status = 'approved' AND approved_at IS NOT NULL AND request_review_at IS NOT NULL
        `).get()
      : db.prepare(`
          SELECT AVG(julianday(approved_at) - julianday(request_review_at)) * 86400 as avg_seconds
          FROM brd_documents
          WHERE user_id = ? AND status = 'approved' AND approved_at IS NOT NULL AND request_review_at IS NOT NULL
        `).get(userId);

    // 2. Approval Bottlenecks (Top 5 reviewers with longest pending review times)
    const bottlenecks = db.prepare(`
      SELECT 
        u.first_name || ' ' || u.last_name as reviewer_name,
        COUNT(*) as pending_count,
        AVG(julianday('now') - julianday(assigned_at)) * 24 as avg_pending_hours
      FROM brd_review_assignments ra
      JOIN users u ON ra.assigned_to = u.id
      WHERE ra.status = 'pending'
      GROUP BY ra.assigned_to
      ORDER BY avg_pending_hours DESC
      LIMIT 5
    `).all();

    // 3. Status Pipeline (Complete breakdown)
    const pipeline = isAdmin
      ? db.prepare(`SELECT status, COUNT(*) as count FROM brd_documents GROUP BY status`).all()
      : db.prepare(`SELECT status, COUNT(*) as count FROM brd_documents WHERE user_id = ? GROUP BY status`).all(userId);

    // 4. Monthly Trend (Submissions per month)
    const trend = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM brd_documents
      WHERE created_at >= date('now', '-12 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();

    res.json({
      success: true,
      data: {
        avgApprovalTime: Math.round(approvalTimeResult?.avg_seconds || 0),
        bottlenecks: bottlenecks || [],
        pipeline: pipeline || [],
        monthlyTrend: trend || []
      }
    });
  } catch (err) {
    console.error('Error fetching business analytics:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch business analytics' });
  }
};
module.exports = {
  getDashboardStats,
  getBusinessAnalytics
};
