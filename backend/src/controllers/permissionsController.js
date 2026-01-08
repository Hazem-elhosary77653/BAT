const pool = require('../db/connection');
const { hasPermission, getUserPermissions, checkPermission, getAllPermissions, getAccessibleResources, refreshCustomPermissions } = require('../utils/permissionChecker');

// Check if user has permission
const checkUserPermission = async (req, res) => {
  try {
    const { resource, action } = req.query;

    if (!resource || !action) {
      return res.status(400).json({ error: 'Resource and action are required' });
    }

    const result = checkPermission(req.user.role, resource, action);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Check permission error:', err);
    res.status(500).json({ error: 'Failed to check permission' });
  }
};

// Get user's permissions
const getMyPermissions = async (req, res) => {
  try {
    const permissions = getUserPermissions(req.user.role);

    res.json({
      success: true,
      data: {
        role: req.user.role,
        permissions
      }
    });
  } catch (err) {
    console.error('Get permissions error:', err);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

// Get all permissions (permission-based access)
const getAllRolePermissions = async (req, res) => {
  try {
    // Permission already checked by middleware or allow all authenticated users
    const permissions = getAllPermissions();

    res.json({
      success: true,
      data: permissions,
      roles: Object.keys(permissions)
    });
  } catch (err) {
    console.error('Get all permissions error:', err);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

// Get accessible resources
const getAccessible = async (req, res) => {
  try {
    const resources = getAccessibleResources(req.user.role);
    const permissions = getUserPermissions(req.user.role);

    res.json({
      success: true,
      data: {
        role: req.user.role,
        resources,
        actions: permissions
      }
    });
  } catch (err) {
    console.error('Get accessible resources error:', err);
    res.status(500).json({ error: 'Failed to fetch accessible resources' });
  }
};

// List current permissions (from DB)
const listPermissions = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT role, resource, action FROM permissions ORDER BY role, resource, action`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List permissions error:', err);
    res.status(500).json({ error: 'Failed to list permissions' });
  }
};

// Add a permission (role/resource/action)
const addPermission = async (req, res) => {
  try {
    const { role, resource, action } = req.body;

    if (!role || !resource || !action) {
      return res.status(400).json({ error: 'role, resource, and action are required' });
    }

    await pool.query(
      `INSERT INTO permissions (role, resource, action)
       VALUES ($1, $2, $3)
       ON CONFLICT (role, resource, action) DO NOTHING`,
      [role, resource, action]
    );

    await refreshCustomPermissions();

    res.status(201).json({ success: true, message: 'Permission added' });
  } catch (err) {
    console.error('Add permission error:', err);
    res.status(500).json({ error: 'Failed to add permission' });
  }
};

// Remove a permission
const removePermission = async (req, res) => {
  try {
    const { role, resource, action } = req.body;

    if (!role || !resource || !action) {
      return res.status(400).json({ error: 'role, resource, and action are required' });
    }

    const result = await pool.query(
      `DELETE FROM permissions WHERE role = $1 AND resource = $2 AND action = $3`,
      [role, resource, action]
    );

    await refreshCustomPermissions();

    res.json({ success: true, message: 'Permission removed', deleted: result.rowCount });
  } catch (err) {
    console.error('Remove permission error:', err);
    res.status(500).json({ error: 'Failed to remove permission' });
  }
};

module.exports = {
  checkUserPermission,
  getMyPermissions,
  getAllRolePermissions,
  getAccessible,
  listPermissions,
  addPermission,
  removePermission
};
