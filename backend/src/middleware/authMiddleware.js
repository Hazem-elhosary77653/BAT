const jwt = require('jsonwebtoken');
const { getSessionById, updateSessionActivity } = require('../services/sessionManagementService');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If the token carries a sessionId, ensure the session is still active
    if (decoded.sessionId) {
      const session = await getSessionById(decoded.sessionId);
      if (!session || session.is_active === 0) {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }

      try {
        await updateSessionActivity(decoded.sessionId, new Date());
      } catch (activityErr) {
        console.warn('Warning updating session activity:', activityErr.message);
      }
      
      // Pass sessionId to request for session timeout middleware
      req.sessionId = decoded.sessionId;
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
