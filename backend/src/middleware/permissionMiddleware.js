const { checkPermission } = require('../utils/permissionChecker');

const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { allowed } = checkPermission(req.user.role, resource, action);

    if (!allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        detail: `Role ${req.user.role} cannot ${action} on ${resource}`
      });
    }

    next();
  };
};

const requireAnyPermission = (resource, actions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowed = actions.some(action => checkPermission(req.user.role, resource, action).allowed);

    if (!allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        detail: `Role ${req.user.role} lacks required permissions for ${resource}`
      });
    }

    next();
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission
};
