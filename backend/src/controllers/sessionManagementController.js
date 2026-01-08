const {
  getUserSessions,
  getActiveSessions,
  endSession,
  endAllUserSessions,
  getSessionsCount,
  getSessionById
} = require('../services/sessionManagementService');

// Get user sessions
const getUserSessionList = async (req, res) => {
  try {
    const targetUserId = req.user.role === 'admin' && req.query.userId
      ? parseInt(req.query.userId)
      : req.user.id;

    const sessions = await getUserSessions(targetUserId);
    const activeCount = sessions.filter(s => s.is_active).length;

    res.json({
      success: true,
      data: {
        total: sessions.length,
        active: activeCount,
        sessions: sessions.map(session => ({
          id: session.id,
          ipAddress: session.ip_address,
          userAgent: session.user_agent,
          loginTime: session.login_time,
          lastActivity: session.last_activity,
          isActive: session.is_active,
          status: session.is_active ? 'Active' : 'Inactive'
        }))
      }
    });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// Get active sessions only
const getActiveUserSessions = async (req, res) => {
  try {
    const targetUserId = req.user.role === 'admin' && req.query.userId
      ? parseInt(req.query.userId)
      : req.user.id;

    const sessions = await getActiveSessions(targetUserId);

    res.json({
      success: true,
      data: {
        count: sessions.length,
        sessions: sessions.map(session => ({
          id: session.id,
          ipAddress: session.ip_address,
          device: parseUserAgent(session.user_agent),
          loginTime: session.login_time,
          lastActivity: session.last_activity
        }))
      }
    });
  } catch (err) {
    console.error('Get active sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
};

// End specific session
const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const targetUserId = req.user.role === 'admin' && (req.body.userId || req.query.userId)
      ? parseInt(req.body.userId || req.query.userId)
      : req.user.id;

    // Verify session belongs to target user
    const session = await getSessionById(sessionId);

    if (!session || session.user_id !== targetUserId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await endSession(sessionId);

    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (err) {
    console.error('Terminate session error:', err);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
};

// End all sessions (logout from all devices)
const terminateAllSessions = async (req, res) => {
  try {
    // Admin can terminate any user's sessions, user can only terminate their own
    const { userId } = req.body;
    const currentUserId = req.user.id;

    // If userId provided and user is admin, terminate that user's sessions
    // Otherwise, terminate current user's sessions
    const targetUserId = userId && req.user.role === 'admin' ? userId : currentUserId;

    await endAllUserSessions(targetUserId);

    res.json({
      success: true,
      message: 'All sessions terminated successfully',
      note: 'You have been logged out from all devices'
    });
  } catch (err) {
    console.error('Terminate all sessions error:', err);
    res.status(500).json({ error: 'Failed to terminate all sessions' });
  }
};

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown Device';

  if (userAgent.includes('Windows')) {
    return 'Windows Desktop';
  } else if (userAgent.includes('Macintosh')) {
    return 'Mac Desktop';
  } else if (userAgent.includes('Linux')) {
    return 'Linux Desktop';
  } else if (userAgent.includes('iPhone')) {
    return 'iPhone';
  } else if (userAgent.includes('iPad')) {
    return 'iPad';
  } else if (userAgent.includes('Android')) {
    return 'Android Device';
  } else if (userAgent.includes('Mobile')) {
    return 'Mobile Device';
  }

  return 'Unknown Device';
};

module.exports = {
  getUserSessionList,
  getActiveUserSessions,
  terminateSession,
  terminateAllSessions
};
